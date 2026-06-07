import type Human from "@wayward/game/game/entity/Human";
import { ActionType } from "@wayward/game/game/entity/action/IAction";
import Drop from "@wayward/game/game/entity/action/actions/Drop";
import type { IDropItemFilterArgument } from "@wayward/game/game/entity/action/actions/Drop";
import MoveItem from "@wayward/game/game/entity/action/actions/MoveItem";
import type { IMoveItemFilterArgument } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemFilterArgument";
import type { IMoveItemOptionsArgument } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemOptionsArgument";
import MoveItemsSourceArgument from "@wayward/game/game/entity/action/actions/moveItem/MoveItemsSourceArgument";
import type { MoveItemsSourceArgumentResolvable } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemsSourceArgument";
import type { IContainer } from "@wayward/game/game/item/IItem";
import type Item from "@wayward/game/game/item/Item";
import type { ISyncGuardConfig } from "./SyncGuardConfig";

export interface IBatchMoveRequest {
	/** Action used when executing each batch (PickUpAllItems is run as MoveItem). */
	executeAs: ActionType.MoveItem | ActionType.Drop;
	/** Original action that triggered batching (for logging). */
	sourceAction: ActionType;
	/** Re-use MoveItemsSourceArgument packets (container/filter moves). */
	useSourceArgument: boolean;
	moveItemSource?: MoveItemsSourceArgumentResolvable;
	itemSnapshot?: Item[];
	itemOffset: number;
	moveItemTarget?: IContainer;
	moveItemIndex?: number;
	moveItemFilter?: IMoveItemFilterArgument;
	moveItemOptions?: IMoveItemOptionsArgument;
	dropFilter?: IDropItemFilterArgument;
	sourceCountBefore?: number;
	awaitingResult?: boolean;
}

interface IBatchJob {
	actor: Human;
	request: IBatchMoveRequest;
}

export default class SyncGuardBatchQueue {

	private readonly jobs = new Map<number, IBatchJob[]>();
	private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

	public onStall?: (actor: Human, remaining: number) => void;
	public onComplete?: (actor: Human) => void;

	public enqueue(actor: Human, request: IBatchMoveRequest, config: ISyncGuardConfig): void {
		const playerId = actor.id;
		const queue = this.jobs.get(playerId) ?? [];
		queue.push({ actor, request: { ...request, itemOffset: 0 } });
		this.jobs.set(playerId, queue);

		if (!this.timers.has(playerId)) {
			this.runNext(playerId, config, 0);
		}
	}

	public clear(): void {
		for (const timer of this.timers.values()) {
			clearTimeout(timer);
		}
		this.timers.clear();
		this.jobs.clear();
	}

	public hasActiveBatch(playerId: number): boolean {
		return (this.jobs.get(playerId)?.length ?? 0) > 0;
	}

	public isAwaitingResult(playerId: number): boolean {
		return this.jobs.get(playerId)?.[0]?.request.awaitingResult === true;
	}

	public cancelAwaiting(playerId: number, config: ISyncGuardConfig): void {
		const job = this.jobs.get(playerId)?.[0];
		if (!job?.request.awaitingResult) {
			return;
		}
		job.request.awaitingResult = false;
		this.runNext(playerId, config, config.bulkMoveCooldownMs);
	}

	public onActionCompleted(playerId: number, config: ISyncGuardConfig): void {
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
			} else if (after >= before) {
				this.abortPlayer(playerId, actor, after);
			} else {
				this.runNext(playerId, config, config.bulkMoveCooldownMs);
			}
		}
	}

	private runNext(playerId: number, config: ISyncGuardConfig, delayMs: number): void {
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

	private executeNext(playerId: number, config: ISyncGuardConfig): void {
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
		} else {
			this.jobs.delete(playerId);
		}
	}

	private beginSourceBatch(
		playerId: number,
		actor: Human,
		request: IBatchMoveRequest,
		config: ISyncGuardConfig,
	): void {
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

		if (request.executeAs === ActionType.Drop) {
			const executor = game.actionExecutor.get(Drop);
			executor.setSilent(true);
			void executor.execute(
				actor,
				request.moveItemSource,
				this.withMoveLimit(request.dropFilter, config.maxItemsPerMove),
			);
			return;
		}

		const executor = game.actionExecutor.get(MoveItem);
		executor.setSilent(true);
		void executor.execute(
			actor,
			request.moveItemSource,
			request.moveItemTarget,
			request.moveItemIndex,
			this.withMoveLimit(request.moveItemFilter, config.maxItemsPerMove),
			request.moveItemOptions,
		);
	}

	private executeSnapshotBatch(
		actor: Human,
		request: IBatchMoveRequest,
		config: ISyncGuardConfig,
	): boolean {
		const snapshot = request.itemSnapshot;
		if (!snapshot || snapshot.length === 0) {
			return true;
		}

		const batch = snapshot.slice(
			request.itemOffset,
			request.itemOffset + config.maxItemsPerMove,
		);
		if (batch.length === 0) {
			return true;
		}

		if (request.executeAs === ActionType.Drop) {
			const executor = game.actionExecutor.get(Drop);
			executor.setSilent(true);
			void executor.execute(actor, batch, request.dropFilter);
		} else {
			const executor = game.actionExecutor.get(MoveItem);
			executor.setSilent(true);
			void executor.execute(
				actor,
				batch,
				request.moveItemTarget,
				request.moveItemIndex,
				request.moveItemFilter,
				request.moveItemOptions,
			);
		}

		request.itemOffset += batch.length;
		return request.itemOffset >= snapshot.length;
	}

	private completeCurrentJob(playerId: number): void {
		const queue = this.jobs.get(playerId);
		queue?.shift();
		if (!queue || queue.length === 0) {
			this.jobs.delete(playerId);
		}
	}

	private abortPlayer(playerId: number, actor: Human, remaining: number): void {
		this.clearPlayer(playerId);
		this.onStall?.(actor, remaining);
	}

	private clearPlayer(playerId: number): void {
		const timer = this.timers.get(playerId);
		if (timer !== undefined) {
			clearTimeout(timer);
		}
		this.timers.delete(playerId);
		this.jobs.delete(playerId);
	}

	private countSourceItems(source: MoveItemsSourceArgumentResolvable): number {
		try {
			return MoveItemsSourceArgument.resolve(source).length;
		} catch {
			return Array.isArray(source) ? source.length : source ? 1 : 0;
		}
	}

	private withMoveLimit<T extends { moveLimit?: number }>(
		filter: T | undefined,
		moveLimit: number,
	): T {
		return {
			...(filter ?? {} as T),
			moveLimit,
		};
	}
}
