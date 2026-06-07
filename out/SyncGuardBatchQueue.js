var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "@wayward/game/game/entity/action/IAction", "@wayward/game/game/entity/action/actions/Drop", "@wayward/game/game/entity/action/actions/MoveItem", "@wayward/game/game/entity/action/actions/moveItem/MoveItemsSourceArgument"], function (require, exports, IAction_1, Drop_1, MoveItem_1, MoveItemsSourceArgument_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    Drop_1 = __importDefault(Drop_1);
    MoveItem_1 = __importDefault(MoveItem_1);
    MoveItemsSourceArgument_1 = __importDefault(MoveItemsSourceArgument_1);
    class SyncGuardBatchQueue {
        constructor() {
            this.jobs = new Map();
            this.timers = new Map();
        }
        enqueue(actor, request, config) {
            const playerId = actor.id;
            const queue = this.jobs.get(playerId) ?? [];
            queue.push({ actor, request: { ...request, itemOffset: 0 } });
            this.jobs.set(playerId, queue);
            if (!this.timers.has(playerId)) {
                this.runNext(playerId, config, 0);
            }
        }
        clear() {
            for (const timer of this.timers.values()) {
                clearTimeout(timer);
            }
            this.timers.clear();
            this.jobs.clear();
        }
        hasActiveBatch(playerId) {
            return (this.jobs.get(playerId)?.length ?? 0) > 0;
        }
        isAwaitingResult(playerId) {
            return this.jobs.get(playerId)?.[0]?.request.awaitingResult === true;
        }
        cancelAwaiting(playerId, config) {
            const job = this.jobs.get(playerId)?.[0];
            if (!job?.request.awaitingResult) {
                return;
            }
            job.request.awaitingResult = false;
            this.runNext(playerId, config, config.bulkMoveCooldownMs);
        }
        onActionCompleted(playerId, config) {
            const job = this.jobs.get(playerId)?.[0];
            if (!job?.request.awaitingResult) {
                return;
            }
            job.request.awaitingResult = false;
            const { actor, request } = job;
            if (request.useSourceArgument && request.moveItemSource !== undefined) {
                const after = this.countSourceItems(request.moveItemSource);
                const before = request.sourceCountBefore ?? after;
                if (after === 0) {
                    this.completeCurrentJob(playerId);
                    this.onComplete?.(actor);
                    if (this.jobs.has(playerId)) {
                        this.runNext(playerId, config, config.bulkMoveCooldownMs);
                    }
                }
                else if (after >= before) {
                    this.abortPlayer(playerId, actor, after);
                }
                else {
                    this.runNext(playerId, config, config.bulkMoveCooldownMs);
                }
            }
        }
        runNext(playerId, config, delayMs) {
            const existing = this.timers.get(playerId);
            if (existing !== undefined) {
                clearTimeout(existing);
            }
            const timer = setTimeout(() => {
                this.timers.delete(playerId);
                this.executeNext(playerId, config);
            }, delayMs);
            this.timers.set(playerId, timer);
        }
        executeNext(playerId, config) {
            const queue = this.jobs.get(playerId);
            const job = queue?.[0];
            if (!queue || !job) {
                this.jobs.delete(playerId);
                return;
            }
            const { actor, request } = job;
            if (!actor.isLocalPlayer) {
                this.clearPlayer(playerId);
                return;
            }
            if (request.awaitingResult) {
                return;
            }
            if (request.useSourceArgument) {
                this.beginSourceBatch(playerId, actor, request, config);
                return;
            }
            const done = this.executeSnapshotBatch(actor, request, config);
            if (done) {
                queue.shift();
                this.onComplete?.(actor);
            }
            if (queue.length > 0) {
                this.runNext(playerId, config, config.bulkMoveCooldownMs);
            }
            else {
                this.jobs.delete(playerId);
            }
        }
        beginSourceBatch(playerId, actor, request, config) {
            if (request.moveItemSource === undefined) {
                this.completeCurrentJob(playerId);
                return;
            }
            const remaining = this.countSourceItems(request.moveItemSource);
            if (remaining === 0) {
                this.completeCurrentJob(playerId);
                this.onComplete?.(actor);
                if (this.jobs.has(playerId)) {
                    this.runNext(playerId, config, config.bulkMoveCooldownMs);
                }
                return;
            }
            request.sourceCountBefore = remaining;
            request.awaitingResult = true;
            if (request.executeAs === IAction_1.ActionType.Drop) {
                const executor = game.actionExecutor.get(Drop_1.default);
                executor.setSilent(true);
                void executor.execute(actor, request.moveItemSource, this.withMoveLimit(request.dropFilter, config.maxItemsPerMove));
                return;
            }
            const executor = game.actionExecutor.get(MoveItem_1.default);
            executor.setSilent(true);
            void executor.execute(actor, request.moveItemSource, request.moveItemTarget, request.moveItemIndex, this.withMoveLimit(request.moveItemFilter, config.maxItemsPerMove), request.moveItemOptions);
        }
        executeSnapshotBatch(actor, request, config) {
            const snapshot = request.itemSnapshot;
            if (!snapshot || snapshot.length === 0) {
                return true;
            }
            const batch = snapshot.slice(request.itemOffset, request.itemOffset + config.maxItemsPerMove);
            if (batch.length === 0) {
                return true;
            }
            if (request.executeAs === IAction_1.ActionType.Drop) {
                const executor = game.actionExecutor.get(Drop_1.default);
                executor.setSilent(true);
                void executor.execute(actor, batch, request.dropFilter);
            }
            else {
                const executor = game.actionExecutor.get(MoveItem_1.default);
                executor.setSilent(true);
                void executor.execute(actor, batch, request.moveItemTarget, request.moveItemIndex, request.moveItemFilter, request.moveItemOptions);
            }
            request.itemOffset += batch.length;
            return request.itemOffset >= snapshot.length;
        }
        completeCurrentJob(playerId) {
            const queue = this.jobs.get(playerId);
            queue?.shift();
            if (!queue || queue.length === 0) {
                this.jobs.delete(playerId);
            }
        }
        abortPlayer(playerId, actor, remaining) {
            this.clearPlayer(playerId);
            this.onStall?.(actor, remaining);
        }
        clearPlayer(playerId) {
            const timer = this.timers.get(playerId);
            if (timer !== undefined) {
                clearTimeout(timer);
            }
            this.timers.delete(playerId);
            this.jobs.delete(playerId);
        }
        countSourceItems(source) {
            try {
                return MoveItemsSourceArgument_1.default.resolve(source).length;
            }
            catch {
                return Array.isArray(source) ? source.length : source ? 1 : 0;
            }
        }
        withMoveLimit(filter, moveLimit) {
            return {
                ...(filter ?? {}),
                moveLimit,
            };
        }
    }
    exports.default = SyncGuardBatchQueue;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY0d1YXJkQmF0Y2hRdWV1ZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9TeW5jR3VhcmRCYXRjaFF1ZXVlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztJQTBFQSxNQUFxQixtQkFBbUI7UUFBeEM7WUFJa0IsU0FBSSxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1lBRXRDLFdBQU0sR0FBRyxJQUFJLEdBQUcsRUFBeUMsQ0FBQztRQXdlNUUsQ0FBQztRQTlkTyxPQUFPLENBQUMsS0FBWSxFQUFFLE9BQTBCLEVBQUUsTUFBd0I7WUFFaEYsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUUxQixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFNUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsRUFBRSxHQUFHLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBRTlELElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUkvQixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztnQkFFaEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBRW5DLENBQUM7UUFFRixDQUFDO1FBSU0sS0FBSztZQUVYLEtBQUssTUFBTSxLQUFLLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO2dCQUUxQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7WUFFckIsQ0FBQztZQUVELElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7WUFFcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUVuQixDQUFDO1FBSU0sY0FBYyxDQUFDLFFBQWdCO1lBRXJDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxNQUFNLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRW5ELENBQUM7UUFJTSxnQkFBZ0IsQ0FBQyxRQUFnQjtZQUV2QyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLGNBQWMsS0FBSyxJQUFJLENBQUM7UUFFdEUsQ0FBQztRQUlNLGNBQWMsQ0FBQyxRQUFnQixFQUFFLE1BQXdCO1lBRS9ELE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFFekMsSUFBSSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7Z0JBRWxDLE9BQU87WUFFUixDQUFDO1lBRUQsR0FBRyxDQUFDLE9BQU8sQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO1lBRW5DLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUUzRCxDQUFDO1FBSU0saUJBQWlCLENBQUMsUUFBZ0IsRUFBRSxNQUF3QjtZQUVsRSxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXpDLElBQUksQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLGNBQWMsRUFBRSxDQUFDO2dCQUVsQyxPQUFPO1lBRVIsQ0FBQztZQUlELEdBQUcsQ0FBQyxPQUFPLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztZQUVuQyxNQUFNLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxHQUFHLEdBQUcsQ0FBQztZQUkvQixJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsY0FBYyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUV2RSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUU1RCxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO2dCQUlsRCxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUUsQ0FBQztvQkFFakIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO29CQUVsQyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBRXpCLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQzt3QkFFN0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUUzRCxDQUFDO2dCQUVGLENBQUM7cUJBQU0sSUFBSSxLQUFLLElBQUksTUFBTSxFQUFFLENBQUM7b0JBRTVCLElBQUksQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFFMUMsQ0FBQztxQkFBTSxDQUFDO29CQUVQLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFFM0QsQ0FBQztZQUVGLENBQUM7UUFFRixDQUFDO1FBSU8sT0FBTyxDQUFDLFFBQWdCLEVBQUUsTUFBd0IsRUFBRSxPQUFlO1lBRTFFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTNDLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUU1QixZQUFZLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFeEIsQ0FBQztZQUlELE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBRTdCLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUU3QixJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUVwQyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFJWixJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFbEMsQ0FBQztRQUlPLFdBQVcsQ0FBQyxRQUFnQixFQUFFLE1BQXdCO1lBRTdELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRXRDLE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXZCLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFFcEIsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRTNCLE9BQU87WUFFUixDQUFDO1lBSUQsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsR0FBRyxHQUFHLENBQUM7WUFJL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztnQkFFMUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFM0IsT0FBTztZQUVSLENBQUM7WUFJRCxJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUUsQ0FBQztnQkFFNUIsT0FBTztZQUVSLENBQUM7WUFJRCxJQUFJLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO2dCQUUvQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBRXhELE9BQU87WUFFUixDQUFDO1lBSUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFL0QsSUFBSSxJQUFJLEVBQUUsQ0FBQztnQkFFVixLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBRWQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRTFCLENBQUM7WUFJRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBRXRCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUUzRCxDQUFDO2lCQUFNLENBQUM7Z0JBRVAsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFNUIsQ0FBQztRQUVGLENBQUM7UUFJTyxnQkFBZ0IsQ0FFdkIsUUFBZ0IsRUFFaEIsS0FBWSxFQUVaLE9BQTBCLEVBRTFCLE1BQXdCO1lBSXhCLElBQUksT0FBTyxDQUFDLGNBQWMsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFFMUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUVsQyxPQUFPO1lBRVIsQ0FBQztZQUlELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUM7WUFFaEUsSUFBSSxTQUFTLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBRXJCLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFFbEMsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUV6QixJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUM7b0JBRTdCLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztnQkFFM0QsQ0FBQztnQkFFRCxPQUFPO1lBRVIsQ0FBQztZQUlELE9BQU8sQ0FBQyxpQkFBaUIsR0FBRyxTQUFTLENBQUM7WUFFdEMsT0FBTyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7WUFJOUIsSUFBSSxPQUFPLENBQUMsU0FBUyxLQUFLLG9CQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRTNDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLGNBQUksQ0FBQyxDQUFDO2dCQUUvQyxRQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUV6QixLQUFLLFFBQVEsQ0FBQyxPQUFPLENBRXBCLEtBQUssRUFFTCxPQUFPLENBQUMsY0FBYyxFQUV0QixJQUFJLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUU5RCxDQUFDO2dCQUVGLE9BQU87WUFFUixDQUFDO1lBSUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsa0JBQVEsQ0FBQyxDQUFDO1lBRW5ELFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFekIsS0FBSyxRQUFRLENBQUMsT0FBTyxDQUVwQixLQUFLLEVBRUwsT0FBTyxDQUFDLGNBQWMsRUFFdEIsT0FBTyxDQUFDLGNBQWMsRUFFdEIsT0FBTyxDQUFDLGFBQWEsRUFFckIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFFbEUsT0FBTyxDQUFDLGVBQWUsQ0FFdkIsQ0FBQztRQUVILENBQUM7UUFJTyxvQkFBb0IsQ0FFM0IsS0FBWSxFQUVaLE9BQTBCLEVBRTFCLE1BQXdCO1lBSXhCLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUM7WUFFdEMsSUFBSSxDQUFDLFFBQVEsSUFBSSxRQUFRLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUV4QyxPQUFPLElBQUksQ0FBQztZQUViLENBQUM7WUFJRCxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUUzQixPQUFPLENBQUMsVUFBVSxFQUVsQixPQUFPLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQyxlQUFlLENBRTNDLENBQUM7WUFFRixJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBRXhCLE9BQU8sSUFBSSxDQUFDO1lBRWIsQ0FBQztZQUlELElBQUksT0FBTyxDQUFDLFNBQVMsS0FBSyxvQkFBVSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUUzQyxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxjQUFJLENBQUMsQ0FBQztnQkFFL0MsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFekIsS0FBSyxRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRXpELENBQUM7aUJBQU0sQ0FBQztnQkFFUCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxrQkFBUSxDQUFDLENBQUM7Z0JBRW5ELFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXpCLEtBQUssUUFBUSxDQUFDLE9BQU8sQ0FFcEIsS0FBSyxFQUVMLEtBQUssRUFFTCxPQUFPLENBQUMsY0FBYyxFQUV0QixPQUFPLENBQUMsYUFBYSxFQUVyQixPQUFPLENBQUMsY0FBYyxFQUV0QixPQUFPLENBQUMsZUFBZSxDQUV2QixDQUFDO1lBRUgsQ0FBQztZQUlELE9BQU8sQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQztZQUVuQyxPQUFPLE9BQU8sQ0FBQyxVQUFVLElBQUksUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUU5QyxDQUFDO1FBSU8sa0JBQWtCLENBQUMsUUFBZ0I7WUFFMUMsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFdEMsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDO1lBRWYsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUVsQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU1QixDQUFDO1FBRUYsQ0FBQztRQUlPLFdBQVcsQ0FBQyxRQUFnQixFQUFFLEtBQVksRUFBRSxTQUFpQjtZQUVwRSxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRTNCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFFbEMsQ0FBQztRQUlPLFdBQVcsQ0FBQyxRQUFnQjtZQUVuQyxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUV4QyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFFekIsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBRXJCLENBQUM7WUFFRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUU3QixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU1QixDQUFDO1FBSU8sZ0JBQWdCLENBQUMsTUFBeUM7WUFFakUsSUFBSSxDQUFDO2dCQUVKLE9BQU8saUNBQXVCLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBQztZQUV2RCxDQUFDO1lBQUMsTUFBTSxDQUFDO2dCQUVSLE9BQU8sS0FBSyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUUvRCxDQUFDO1FBRUYsQ0FBQztRQUlPLGFBQWEsQ0FFcEIsTUFBcUIsRUFFckIsU0FBaUI7WUFJakIsT0FBTztnQkFFTixHQUFHLENBQUMsTUFBTSxJQUFJLEVBQU8sQ0FBQztnQkFFdEIsU0FBUzthQUVULENBQUM7UUFFSCxDQUFDO0tBRUQ7SUE5ZUQsc0NBOGVDIn0=