var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "@wayward/game/event/EventBuses", "@wayward/game/event/EventManager", "@wayward/game/game/entity/action/IAction", "@wayward/game/game/entity/action/actions/moveItem/MoveItemsSourceArgument", "@wayward/game/game/entity/player/IMessageManager", "@wayward/game/game/item/IItem", "@wayward/game/game/item/Item", "@wayward/game/mod/Mod", "@wayward/game/mod/ModRegistry", "./SyncGuardAutoRejoin", "./SyncGuardDesyncGuard", "./SyncGuardBatchQueue", "./SyncGuardConfig"], function (require, exports, EventBuses_1, EventManager_1, IAction_1, MoveItemsSourceArgument_1, IMessageManager_1, IItem_1, Item_1, Mod_1, ModRegistry_1, SyncGuardAutoRejoin_1, SyncGuardDesyncGuard_1, SyncGuardBatchQueue_1, SyncGuardConfig_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    MoveItemsSourceArgument_1 = __importDefault(MoveItemsSourceArgument_1);
    Item_1 = __importDefault(Item_1);
    Mod_1 = __importDefault(Mod_1);
    ModRegistry_1 = __importDefault(ModRegistry_1);
    SyncGuardDesyncGuard_1 = __importStar(SyncGuardDesyncGuard_1);
    SyncGuardBatchQueue_1 = __importDefault(SyncGuardBatchQueue_1);
    const THROTTLED_MOVE_ACTIONS = new Set([
        IAction_1.ActionType.MoveItem,
        IAction_1.ActionType.Drop,
        IAction_1.ActionType.PickUpAllItems,
    ]);
    class SyncGuardMod extends Mod_1.default {
        constructor() {
            super(...arguments);
            this.batchQueue = new SyncGuardBatchQueue_1.default();
            this.sessionStats = (0, SyncGuardConfig_1.emptySyncGuardStats)();
            this.lastContainerMoveAt = new Map();
            this.lastItemOrderAt = new Map();
            this.wasMultiplayerClient = false;
        }
        initializeGlobalData(data) {
            const existing = data;
            return {
                config: (0, SyncGuardConfig_1.mergeSyncGuardConfig)(existing?.config),
                lifetimeStats: {
                    ...(0, SyncGuardConfig_1.emptySyncGuardStats)(),
                    ...existing?.lifetimeStats,
                },
            };
        }
        onInitialize() {
            const role = this.getMultiplayerRole();
            this.log.info(`Sync Guard initialized (${role}). Throttle: ${this.globalData.config.throttleEnabled}`);
            this.desyncGuard = new SyncGuardDesyncGuard_1.default((message) => this.log.warn(message));
            (0, SyncGuardDesyncGuard_1.registerSyncGuardDesyncGuard)(this.desyncGuard);
        }
        onUninitialize() {
            (0, SyncGuardDesyncGuard_1.unregisterSyncGuardDesyncGuard)();
            this.desyncGuard = undefined;
        }
        onLoad() {
            Object.assign(this.sessionStats, (0, SyncGuardConfig_1.emptySyncGuardStats)());
            this.lastContainerMoveAt.clear();
            this.lastItemOrderAt.clear();
            this.applyDesyncGuardRuntime();
            this.batchQueue.onStall = (actor, remaining) => {
                this.log.warn(`[SyncGuard] batch-stall player=${actor.id} remaining=${remaining} `
                    + `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`);
                this.notifyActor(actor, () => this.messageBatchStalled, remaining);
            };
            if (multiplayer.isConnected && multiplayer.isClient) {
                this.wasMultiplayerClient = true;
            }
            const role = this.getMultiplayerRole();
            this.log.info(`Sync Guard loaded (${role}). autoRejoin=${this.globalData.config.autoRejoin} `
                + `suppressDesyncKick=${this.globalData.config.suppressDesyncKick}`);
            if (this.shouldAnnounceToLocalPlayer()) {
                localPlayer.messages.type(IMessageManager_1.MessageType.Good).send(this.messageLoaded);
            }
        }
        onUnload() {
            this.batchQueue.clear();
            this.log.info(`Sync Guard unloaded. Session stats: ${this.formatStats(this.sessionStats)} `
                + `autoRejoinPending=${(0, SyncGuardAutoRejoin_1.isSyncGuardAutoRejoinPending)()}`);
        }
        onSyncGuardCommand(_commandManager, player, args) {
            const parts = args.trim().split(/\s+/).filter(Boolean);
            const subcommand = parts[0]?.toLowerCase() ?? "help";
            switch (subcommand) {
                case "stats":
                    this.sendStats(player);
                    break;
                case "throttle":
                    this.setThrottle(player, parts[1]);
                    break;
                case "maxitems":
                    this.setNumericOption(player, "maxItemsPerMove", parts[1], 1, 200);
                    break;
                case "cooldown":
                    this.setNumericOption(player, "moveCooldownMs", parts[1], 0, 5000);
                    break;
                case "bulkcooldown":
                    this.setNumericOption(player, "bulkMoveCooldownMs", parts[1], 0, 10000);
                    break;
                case "verbose":
                    this.setBooleanOption(player, "verboseLogging", parts[1]);
                    break;
                case "batch":
                    this.setBooleanOption(player, "batchLargeMoves", parts[1]);
                    break;
                case "autorejoin":
                    this.setBooleanOption(player, "autoRejoin", parts[1]);
                    break;
                case "desynckick":
                    this.setBooleanOption(player, "suppressDesyncKick", parts[1]);
                    break;
                case "help":
                default:
                    player.messages.type(IMessageManager_1.MessageType.Stat).send(subcommand === "help" ? this.messageHelp : this.messageUnknownOption);
                    break;
            }
        }
        onCanMoveItems(_host, human, itemsToMove, fromContainer, toContainer, _options, mover) {
            const config = this.globalData.config;
            if (!config.verboseLogging) {
                return undefined;
            }
            const actor = mover ?? human;
            const playerId = this.getActorId(actor);
            const itemCount = itemsToMove.length;
            if (itemCount >= config.logBulkThreshold) {
                this.logMove("canMove", playerId, itemCount, fromContainer, toContainer);
            }
            return undefined;
        }
        onContainerItemAdd(_host, items, container, _index) {
            this.logContainerEvent("add", items, container);
        }
        onContainerItemUpdate(_host, items, containerFrom, _containerFromTile, containerTo) {
            if (items.length < this.globalData.config.logBulkThreshold || !this.globalData.config.verboseLogging) {
                return;
            }
            this.log.info(`[SyncGuard] container update ${items.length} items `
                + `from ${this.describeContainer(containerFrom)} `
                + `to ${this.describeContainer(containerTo)} `
                + `turn=${this.getTurn()}`);
        }
        onPreExecuteAction(_host, actionType, actionApi, args) {
            if (!this.globalData.config.throttleEnabled) {
                return;
            }
            if (actionType === IAction_1.ActionType.UpdateItemOrder) {
                const playerId = this.getActorId(actionApi.executor);
                if (this.isRateLimited(this.lastItemOrderAt, playerId, this.globalData.config.itemOrderCooldownMs)) {
                    this.blockItemOrder(actionApi.executor);
                    return false;
                }
                this.lastItemOrderAt.set(playerId, Date.now());
                this.sessionStats.itemOrderUpdates++;
                this.globalData.lifetimeStats.itemOrderUpdates++;
                return;
            }
            if (!THROTTLED_MOVE_ACTIONS.has(actionType)) {
                return;
            }
            try {
                const throttleInfo = this.getMoveThrottleInfo(actionType, actionApi, args);
                if (!throttleInfo) {
                    return;
                }
                const blocked = this.applyMoveThrottle(actionType, actionApi.executor, throttleInfo);
                if (blocked === false) {
                    const playerId = this.getActorId(actionApi.executor);
                    if (this.batchQueue.isAwaitingResult(playerId)) {
                        this.batchQueue.cancelAwaiting(playerId, this.globalData.config);
                    }
                }
                return blocked;
            }
            catch (error) {
                this.log.error(`[SyncGuard] preExecuteAction failed for ${IAction_1.ActionType[actionType]}: ${error}`);
                return undefined;
            }
        }
        onPostExecuteAction(_host, actionType, actionApi, args) {
            if (!THROTTLED_MOVE_ACTIONS.has(actionType)) {
                return;
            }
            const actor = actionApi.executor;
            if (!actor?.isLocalPlayer) {
                return;
            }
            const moveLimit = actionType === IAction_1.ActionType.Drop
                ? args[1]?.moveLimit
                : args[3]?.moveLimit;
            if (moveLimit === undefined) {
                return;
            }
            if (this.batchQueue.isAwaitingResult(actor.id)) {
                this.batchQueue.onActionCompleted(actor.id, this.globalData.config);
            }
        }
        onMultiplayerConnect(_host) {
            (0, SyncGuardAutoRejoin_1.cancelSyncGuardAutoRejoin)();
            this.wasMultiplayerClient = multiplayer.isClient;
        }
        onMultiplayerDisconnect(_host) {
            this.batchQueue.clear();
            this.sessionStats.disconnects++;
            this.globalData.lifetimeStats.disconnects++;
            const shouldAutoRejoin = this.globalData.config.autoRejoin
                && this.wasMultiplayerClient
                && game.playing;
            this.log.warn(`[SyncGuard] Multiplayer disconnected. `
                + `session=${this.formatStats(this.sessionStats)} `
                + `lifetime=${this.formatStats(this.globalData.lifetimeStats)} `
                + `autoRejoin=${shouldAutoRejoin}`);
            this.wasMultiplayerClient = false;
            if (shouldAutoRejoin) {
                (0, SyncGuardAutoRejoin_1.scheduleSyncGuardAutoRejoin)({
                    logInfo: (message) => this.log.info(message),
                    logError: (message) => this.log.error(message),
                    notifyLocalPlayer: () => {
                        if (localPlayer?.isLocalPlayer) {
                            localPlayer.messages.type(IMessageManager_1.MessageType.Stat).send(this.messageAutoRejoin);
                        }
                    },
                });
            }
        }
        shouldAnnounceToLocalPlayer() {
            return !multiplayer.isConnected || !multiplayer.isServer;
        }
        getMultiplayerRole() {
            if (!multiplayer.isConnected) {
                return "singleplayer";
            }
            return multiplayer.isServer ? "server" : "client";
        }
        getActorId(actor) {
            return actor?.id ?? -1;
        }
        getTurn() {
            return localPlayer?.days ?? "?";
        }
        getMoveThrottleInfo(actionType, actionApi, args) {
            switch (actionType) {
                case IAction_1.ActionType.MoveItem: {
                    const use = actionApi.use;
                    const items = this.resolveActionItems(use?.items, args[0]);
                    if (items.length === 0) {
                        return undefined;
                    }
                    return {
                        sourceArg: args[0],
                        itemCount: items.length,
                        items,
                        toContainer: use?.targetContainer ?? args[1],
                        moveItemIndex: args[2],
                        moveItemFilter: args[3],
                        moveItemOptions: args[4],
                    };
                }
                case IAction_1.ActionType.Drop: {
                    const use = actionApi.use;
                    const items = this.resolveDropItems(use, args[0]);
                    if (!items || items.length === 0) {
                        return undefined;
                    }
                    return {
                        sourceArg: args[0],
                        itemCount: items.length,
                        items,
                        toContainer: use?.into,
                        dropFilter: args[1],
                    };
                }
                case IAction_1.ActionType.PickUpAllItems: {
                    const use = actionApi.use;
                    const items = [...(use?.tileContainer?.containedItems ?? [])];
                    if (items.length === 0) {
                        return undefined;
                    }
                    return {
                        sourceArg: args[0],
                        itemCount: items.length,
                        items,
                        fromContainer: use?.tileContainer,
                        toContainer: actionApi.executor.inventory,
                    };
                }
                default:
                    return undefined;
            }
        }
        resolveActionItems(useItems, source) {
            if (useItems && useItems.length > 0) {
                return useItems;
            }
            return this.resolveMoveItems(source);
        }
        resolveDropItems(use, source) {
            if (use?.items && use.items.length > 0) {
                return use.items;
            }
            if (Array.isArray(source)) {
                return source;
            }
            if (source instanceof Item_1.default) {
                return [source];
            }
            return undefined;
        }
        applyMoveThrottle(actionType, actor, info) {
            const config = this.globalData.config;
            const playerId = this.getActorId(actor);
            const itemCount = info.itemCount;
            const actionName = IAction_1.ActionType[actionType] ?? String(actionType);
            const batchMoveLimit = info.moveItemFilter?.moveLimit ?? info.dropFilter?.moveLimit;
            this.sessionStats.containerMoves++;
            this.globalData.lifetimeStats.containerMoves++;
            if (itemCount >= config.logBulkThreshold) {
                this.sessionStats.bulkMoves++;
                this.globalData.lifetimeStats.bulkMoves++;
                this.logMove(`preExecute:${actionName}`, playerId, itemCount, info.fromContainer, info.toContainer);
            }
            if (batchMoveLimit !== undefined && batchMoveLimit <= config.maxItemsPerMove) {
                const queueDriven = this.batchQueue.hasActiveBatch(playerId);
                if (!queueDriven) {
                    const effectiveCount = Math.min(itemCount, batchMoveLimit);
                    const cooldown = effectiveCount >= config.bulkThreshold
                        ? config.bulkMoveCooldownMs
                        : config.moveCooldownMs;
                    if (this.isRateLimited(this.lastContainerMoveAt, playerId, cooldown)) {
                        return this.blockMove(actor, actionName, "rate");
                    }
                    this.lastContainerMoveAt.set(playerId, Date.now());
                }
                return;
            }
            if (itemCount > config.maxItemsPerMove) {
                if (config.batchLargeMoves && info.items.length > 0) {
                    return this.startBatchedMove(actionType, actor, info);
                }
                return this.blockMove(actor, actionName, "too-many", config.maxItemsPerMove);
            }
            const cooldown = itemCount >= config.bulkThreshold
                ? config.bulkMoveCooldownMs
                : config.moveCooldownMs;
            if (this.isRateLimited(this.lastContainerMoveAt, playerId, cooldown)) {
                return this.blockMove(actor, actionName, "rate");
            }
            this.lastContainerMoveAt.set(playerId, Date.now());
        }
        isRateLimited(map, playerId, cooldownMs) {
            if (cooldownMs <= 0) {
                return false;
            }
            const lastAt = map.get(playerId) ?? 0;
            return Date.now() - lastAt < cooldownMs;
        }
        startBatchedMove(actionType, actor, info) {
            const config = this.globalData.config;
            const actionName = IAction_1.ActionType[actionType] ?? String(actionType);
            const playerId = this.getActorId(actor);
            this.sessionStats.batchedMoves++;
            this.globalData.lifetimeStats.batchedMoves++;
            const useSourceArgument = actionType !== IAction_1.ActionType.PickUpAllItems
                && actionType !== IAction_1.ActionType.Drop
                && this.isContainerBasedSource(info.sourceArg);
            const batchCount = Math.ceil(info.itemCount / config.maxItemsPerMove);
            this.log.info(`[SyncGuard] batch-start action=${actionName} player=${playerId} `
                + `items=${info.itemCount} batches=${batchCount} size=${config.maxItemsPerMove} `
                + `mode=${useSourceArgument ? "source" : "snapshot"} `
                + `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`);
            if (!actor?.isLocalPlayer) {
                return false;
            }
            const request = this.createBatchRequest(actionType, actor, info);
            this.batchQueue.enqueue(actor, request, config);
            this.notifyActor(actor, () => this.messageBatchStarted, info.items.length, config.maxItemsPerMove);
            return false;
        }
        createBatchRequest(actionType, actor, info) {
            const useSourceArgument = actionType !== IAction_1.ActionType.PickUpAllItems
                && actionType !== IAction_1.ActionType.Drop
                && this.isContainerBasedSource(info.sourceArg);
            if (actionType === IAction_1.ActionType.Drop) {
                return {
                    executeAs: IAction_1.ActionType.Drop,
                    sourceAction: actionType,
                    useSourceArgument: false,
                    itemSnapshot: info.items,
                    itemOffset: 0,
                    dropFilter: info.dropFilter,
                };
            }
            return {
                executeAs: IAction_1.ActionType.MoveItem,
                sourceAction: actionType,
                useSourceArgument,
                moveItemSource: useSourceArgument
                    ? info.sourceArg
                    : undefined,
                itemSnapshot: useSourceArgument ? undefined : info.items,
                itemOffset: 0,
                moveItemTarget: actionType === IAction_1.ActionType.PickUpAllItems
                    ? actor.inventory
                    : info.toContainer,
                moveItemIndex: info.moveItemIndex,
                moveItemFilter: info.moveItemFilter,
                moveItemOptions: info.moveItemOptions,
            };
        }
        isContainerBasedSource(source) {
            if (!source || typeof source !== "object" || Array.isArray(source)) {
                return false;
            }
            if (source instanceof Item_1.default) {
                return false;
            }
            const candidate = source;
            return "container" in candidate || "island" in candidate;
        }
        blockMove(actor, actionName, reason, maxItems) {
            this.sessionStats.throttled++;
            this.globalData.lifetimeStats.throttled++;
            this.log.warn(`[SyncGuard] throttled ${reason} action=${actionName} player=${this.getActorId(actor)} `
                + `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`);
            if (reason === "too-many" && maxItems !== undefined) {
                this.notifyActor(actor, () => this.messageTooManyItems, maxItems);
            }
            else {
                this.notifyActor(actor, () => this.messageRateLimited);
            }
            return false;
        }
        blockItemOrder(actor) {
            this.sessionStats.throttled++;
            this.globalData.lifetimeStats.throttled++;
            this.log.warn(`[SyncGuard] throttled item-order player=${this.getActorId(actor)} `
                + `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`);
            this.notifyActor(actor, () => this.messageOrderRateLimited);
        }
        notifyActor(actor, message, ...args) {
            if (!actor?.isLocalPlayer) {
                return;
            }
            actor.messages.type(IMessageManager_1.MessageType.Warning).send(message(), ...args);
        }
        logMove(kind, playerId, itemCount, fromContainer, toContainer) {
            this.log.info(`[SyncGuard] ${kind} player=${playerId} items=${itemCount} `
                + `from=${this.describeContainer(fromContainer)} `
                + `to=${this.describeContainer(toContainer)} `
                + `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`);
        }
        logContainerEvent(kind, items, container) {
            const config = this.globalData.config;
            if (!config.verboseLogging || items.length < config.logBulkThreshold) {
                return;
            }
            this.log.info(`[SyncGuard] container ${kind} ${items.length} items `
                + `into ${this.describeContainer(container)} turn=${this.getTurn()}`);
        }
        describeContainer(container) {
            if (!container) {
                return "none";
            }
            if (container instanceof Item_1.default) {
                const renamed = container.renamed?.toString();
                const typeName = IItem_1.ItemType[container.type] ?? String(container.type);
                return renamed ? `${renamed} (${typeName}#${container.id})` : `${typeName}#${container.id}`;
            }
            return "container";
        }
        resolveMoveItems(source) {
            if (Array.isArray(source)) {
                return source;
            }
            try {
                return MoveItemsSourceArgument_1.default.resolve(source);
            }
            catch {
                return source ? [source] : [];
            }
        }
        applyDesyncGuardRuntime() {
            SyncGuardDesyncGuard_1.syncGuardDesyncRuntime.suppressDesyncKick = this.globalData.config.suppressDesyncKick;
            SyncGuardDesyncGuard_1.syncGuardDesyncRuntime.onSuppressed = (details) => {
                this.sessionStats.desyncSuppressed++;
                this.globalData.lifetimeStats.desyncSuppressed++;
                this.log.warn(`[SyncGuard] desync kick blocked (${details})`);
                if (localPlayer?.isLocalPlayer) {
                    localPlayer.messages.type(IMessageManager_1.MessageType.Warning).send(this.messageDesyncSuppressed);
                }
            };
        }
        formatStats(stats) {
            return `moves=${stats.containerMoves}, bulk=${stats.bulkMoves}, `
                + `batched=${stats.batchedMoves}, throttled=${stats.throttled}, `
                + `order=${stats.itemOrderUpdates}, disconnects=${stats.disconnects}, `
                + `desyncBlocked=${stats.desyncSuppressed}`;
        }
        sendStats(player) {
            const summary = this.formatStats(this.sessionStats);
            this.log.info(`[SyncGuard] stats requested by ${player.id}: session ${summary}`);
            player.messages.type(IMessageManager_1.MessageType.Stat).send(this.messageStats, this.sessionStats.containerMoves, this.sessionStats.bulkMoves, this.sessionStats.batchedMoves, this.sessionStats.throttled, this.sessionStats.itemOrderUpdates, this.sessionStats.disconnects, this.sessionStats.desyncSuppressed);
        }
        setThrottle(player, value) {
            if (value !== "on" && value !== "off") {
                player.messages.type(IMessageManager_1.MessageType.Stat).send(this.messageHelp);
                return;
            }
            this.globalData.config.throttleEnabled = value === "on";
            this.ackConfig(player, `throttle=${value}`);
        }
        setNumericOption(player, key, value, min, max) {
            const parsed = Number(value);
            if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
                player.messages.type(IMessageManager_1.MessageType.Stat).send(this.messageHelp);
                return;
            }
            this.globalData.config[key] = parsed;
            this.ackConfig(player, `${key}=${parsed}`);
        }
        setBooleanOption(player, key, value) {
            if (value !== "on" && value !== "off") {
                player.messages.type(IMessageManager_1.MessageType.Stat).send(this.messageHelp);
                return;
            }
            this.globalData.config[key] = value === "on";
            if (key === "autoRejoin" && value === "off") {
                (0, SyncGuardAutoRejoin_1.cancelSyncGuardAutoRejoin)();
            }
            if (key === "suppressDesyncKick") {
                this.applyDesyncGuardRuntime();
            }
            this.ackConfig(player, `${key}=${value}`);
        }
        ackConfig(player, details) {
            this.log.info(`[SyncGuard] config updated (${details}) by player ${player.id}`);
            player.messages.type(IMessageManager_1.MessageType.Good).send(this.messageConfigUpdated);
        }
    }
    exports.default = SyncGuardMod;
    __decorate([
        Mod_1.default.globalData()
    ], SyncGuardMod.prototype, "globalData", void 0);
    __decorate([
        ModRegistry_1.default.message("Loaded")
    ], SyncGuardMod.prototype, "messageLoaded", void 0);
    __decorate([
        ModRegistry_1.default.message("TooManyItems")
    ], SyncGuardMod.prototype, "messageTooManyItems", void 0);
    __decorate([
        ModRegistry_1.default.message("RateLimited")
    ], SyncGuardMod.prototype, "messageRateLimited", void 0);
    __decorate([
        ModRegistry_1.default.message("OrderRateLimited")
    ], SyncGuardMod.prototype, "messageOrderRateLimited", void 0);
    __decorate([
        ModRegistry_1.default.message("Stats")
    ], SyncGuardMod.prototype, "messageStats", void 0);
    __decorate([
        ModRegistry_1.default.message("Help")
    ], SyncGuardMod.prototype, "messageHelp", void 0);
    __decorate([
        ModRegistry_1.default.message("ConfigUpdated")
    ], SyncGuardMod.prototype, "messageConfigUpdated", void 0);
    __decorate([
        ModRegistry_1.default.message("UnknownOption")
    ], SyncGuardMod.prototype, "messageUnknownOption", void 0);
    __decorate([
        ModRegistry_1.default.message("BatchStarted")
    ], SyncGuardMod.prototype, "messageBatchStarted", void 0);
    __decorate([
        ModRegistry_1.default.message("BatchStalled")
    ], SyncGuardMod.prototype, "messageBatchStalled", void 0);
    __decorate([
        ModRegistry_1.default.message("AutoRejoin")
    ], SyncGuardMod.prototype, "messageAutoRejoin", void 0);
    __decorate([
        ModRegistry_1.default.message("DesyncSuppressed")
    ], SyncGuardMod.prototype, "messageDesyncSuppressed", void 0);
    __decorate([
        ModRegistry_1.default.command("syncguard")
    ], SyncGuardMod.prototype, "onSyncGuardCommand", null);
    __decorate([
        (0, EventManager_1.EventHandler)(EventBuses_1.EventBus.ItemManager, "canMoveItems")
    ], SyncGuardMod.prototype, "onCanMoveItems", null);
    __decorate([
        (0, EventManager_1.EventHandler)(EventBuses_1.EventBus.ItemManager, "containerItemAdd")
    ], SyncGuardMod.prototype, "onContainerItemAdd", null);
    __decorate([
        (0, EventManager_1.EventHandler)(EventBuses_1.EventBus.ItemManager, "containerItemUpdate")
    ], SyncGuardMod.prototype, "onContainerItemUpdate", null);
    __decorate([
        (0, EventManager_1.EventHandler)(EventBuses_1.EventBus.Actions, "preExecuteAction")
    ], SyncGuardMod.prototype, "onPreExecuteAction", null);
    __decorate([
        (0, EventManager_1.EventHandler)(EventBuses_1.EventBus.Actions, "postExecuteAction")
    ], SyncGuardMod.prototype, "onPostExecuteAction", null);
    __decorate([
        (0, EventManager_1.EventHandler)(EventBuses_1.EventBus.Multiplayer, "connect")
    ], SyncGuardMod.prototype, "onMultiplayerConnect", null);
    __decorate([
        (0, EventManager_1.EventHandler)(EventBuses_1.EventBus.Multiplayer, "disconnect")
    ], SyncGuardMod.prototype, "onMultiplayerDisconnect", null);
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL01vZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF1REEsTUFBTSxzQkFBc0IsR0FBRyxJQUFJLEdBQUcsQ0FBQztRQUN0QyxvQkFBVSxDQUFDLFFBQVE7UUFDbkIsb0JBQVUsQ0FBQyxJQUFJO1FBQ2Ysb0JBQVUsQ0FBQyxjQUFjO0tBQ3pCLENBQUMsQ0FBQztJQUVILE1BQXFCLFlBQWEsU0FBUSxhQUFHO1FBQTdDOztZQThCa0IsZUFBVSxHQUFHLElBQUksNkJBQW1CLEVBQUUsQ0FBQztZQUV2QyxpQkFBWSxHQUFHLElBQUEscUNBQW1CLEdBQUUsQ0FBQztZQUNyQyx3QkFBbUIsR0FBRyxJQUFJLEdBQUcsRUFBa0IsQ0FBQztZQUNoRCxvQkFBZSxHQUFHLElBQUksR0FBRyxFQUFrQixDQUFDO1lBQ3JELHlCQUFvQixHQUFHLEtBQUssQ0FBQztRQXFzQnRDLENBQUM7UUFuc0JnQixvQkFBb0IsQ0FBQyxJQUFjO1lBQ2xELE1BQU0sUUFBUSxHQUFHLElBQWlELENBQUM7WUFDbkUsT0FBTztnQkFDTixNQUFNLEVBQUUsSUFBQSxzQ0FBb0IsRUFBQyxRQUFRLEVBQUUsTUFBTSxDQUFDO2dCQUM5QyxhQUFhLEVBQUU7b0JBQ2QsR0FBRyxJQUFBLHFDQUFtQixHQUFFO29CQUN4QixHQUFHLFFBQVEsRUFBRSxhQUFhO2lCQUMxQjthQUNELENBQUM7UUFDSCxDQUFDO1FBRWUsWUFBWTtZQUMzQixNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztZQUN2QyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQywyQkFBMkIsSUFBSSxnQkFBZ0IsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQztZQUV2RyxJQUFJLENBQUMsV0FBVyxH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