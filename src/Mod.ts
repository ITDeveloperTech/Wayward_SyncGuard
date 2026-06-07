import type CommandManager from "@wayward/game/command/CommandManager";
import { EventBus } from "@wayward/game/event/EventBuses";
import { EventHandler } from "@wayward/game/event/EventManager";
import type ActionExecutor from "@wayward/game/game/entity/action/ActionExecutor";
import type Human from "@wayward/game/game/entity/Human";
import { ActionType } from "@wayward/game/game/entity/action/IAction";
import type { IActionHandlerApi } from "@wayward/game/game/entity/action/IAction";
import type { IDropCanUse, IDropItemFilterArgument } from "@wayward/game/game/entity/action/actions/Drop";
import type { IMoveItemCanUse } from "@wayward/game/game/entity/action/actions/MoveItem";
import type { IPickUpAllItemsCanUse } from "@wayward/game/game/entity/action/actions/PickUpAllItems";
import MoveItemsSourceArgument from "@wayward/game/game/entity/action/actions/moveItem/MoveItemsSourceArgument";
import { MessageType } from "@wayward/game/game/entity/player/IMessageManager";
import type Player from "@wayward/game/game/entity/player/Player";
import type { IContainer } from "@wayward/game/game/item/IItem";
import { ItemType } from "@wayward/game/game/item/IItem";
import type { IMoveItemOptions } from "@wayward/game/game/item/IItemManager";
import Item from "@wayward/game/game/item/Item";
import type ItemManager from "@wayward/game/game/item/ItemManager";
import type Message from "@wayward/game/language/dictionary/Message";
import type Multiplayer from "@wayward/game/multiplayer/Multiplayer";
import Mod from "@wayward/game/mod/Mod";
import Register from "@wayward/game/mod/ModRegistry";
import {
	cancelSyncGuardAutoRejoin,
	isSyncGuardAutoRejoinPending,
	scheduleSyncGuardAutoRejoin,
} from "./SyncGuardAutoRejoin";
import SyncGuardDesyncGuard, {
	registerSyncGuardDesyncGuard,
	syncGuardDesyncRuntime,
	unregisterSyncGuardDesyncGuard,
} from "./SyncGuardDesyncGuard";
import SyncGuardBatchQueue, { type IBatchMoveRequest } from "./SyncGuardBatchQueue";
import {
	emptySyncGuardStats,
	type ISyncGuardGlobalData,
	type ISyncGuardStats,
	mergeSyncGuardConfig,
} from "./SyncGuardConfig";
import type { IMoveItemFilterArgument } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemFilterArgument";
import type { IMoveItemOptionsArgument } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemOptionsArgument";
import type { MoveItemsSourceArgumentResolvable } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemsSourceArgument";

interface IMoveThrottleInfo {
	sourceArg: unknown;
	itemCount: number;
	items: Item[];
	fromContainer?: IContainer;
	toContainer?: IContainer;
	moveItemIndex?: number;
	moveItemFilter?: IMoveItemFilterArgument;
	moveItemOptions?: IMoveItemOptionsArgument;
	dropFilter?: IDropItemFilterArgument;
}

const THROTTLED_MOVE_ACTIONS = new Set([
	ActionType.MoveItem,
	ActionType.Drop,
	ActionType.PickUpAllItems,
]);

export default class SyncGuardMod extends Mod {

	@Mod.globalData()
	public globalData!: ISyncGuardGlobalData;

	@Register.message("Loaded")
	public readonly messageLoaded!: Message;
	@Register.message("TooManyItems")
	public readonly messageTooManyItems!: Message;
	@Register.message("RateLimited")
	public readonly messageRateLimited!: Message;
	@Register.message("OrderRateLimited")
	public readonly messageOrderRateLimited!: Message;
	@Register.message("Stats")
	public readonly messageStats!: Message;
	@Register.message("Help")
	public readonly messageHelp!: Message;
	@Register.message("ConfigUpdated")
	public readonly messageConfigUpdated!: Message;
	@Register.message("UnknownOption")
	public readonly messageUnknownOption!: Message;
	@Register.message("BatchStarted")
	public readonly messageBatchStarted!: Message;
	@Register.message("BatchStalled")
	public readonly messageBatchStalled!: Message;
	@Register.message("AutoRejoin")
	public readonly messageAutoRejoin!: Message;
	@Register.message("DesyncSuppressed")
	public readonly messageDesyncSuppressed!: Message;

	private readonly batchQueue = new SyncGuardBatchQueue();
	private desyncGuard?: SyncGuardDesyncGuard;
	private readonly sessionStats = emptySyncGuardStats();
	private readonly lastContainerMoveAt = new Map<number, number>();
	private readonly lastItemOrderAt = new Map<number, number>();
	private wasMultiplayerClient = false;

	public override initializeGlobalData(data?: unknown): ISyncGuardGlobalData {
		const existing = data as Partial<ISyncGuardGlobalData> | undefined;
		return {
			config: mergeSyncGuardConfig(existing?.config),
			lifetimeStats: {
				...emptySyncGuardStats(),
				...existing?.lifetimeStats,
			},
		};
	}

	public override onInitialize(): void {
		const role = this.getMultiplayerRole();
		this.log.info(`Sync Guard initialized (${role}). Throttle: ${this.globalData.config.throttleEnabled}`);

		this.desyncGuard = new SyncGuardDesyncGuard((message) => this.log.warn(message));
		registerSyncGuardDesyncGuard(this.desyncGuard);
	}

	public override onUninitialize(): void {
		unregisterSyncGuardDesyncGuard();
		this.desyncGuard = undefined;
	}

	public override onLoad(): void {
		Object.assign(this.sessionStats, emptySyncGuardStats());
		this.lastContainerMoveAt.clear();
		this.lastItemOrderAt.clear();
		this.applyDesyncGuardRuntime();

		this.batchQueue.onStall = (actor, remaining) => {
			this.log.warn(
				`[SyncGuard] batch-stall player=${actor.id} remaining=${remaining} `
				+ `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`,
			);
			this.notifyActor(actor, () => this.messageBatchStalled, remaining);
		};

		if (multiplayer.isConnected && multiplayer.isClient) {
			this.wasMultiplayerClient = true;
		}

		const role = this.getMultiplayerRole();
		this.log.info(
			`Sync Guard loaded (${role}). autoRejoin=${this.globalData.config.autoRejoin} `
			+ `suppressDesyncKick=${this.globalData.config.suppressDesyncKick}`,
		);

		if (this.shouldAnnounceToLocalPlayer()) {
			localPlayer.messages.type(MessageType.Good).send(this.messageLoaded);
		}
	}

	public override onUnload(): void {
		this.batchQueue.clear();
		this.log.info(
			`Sync Guard unloaded. Session stats: ${this.formatStats(this.sessionStats)} `
			+ `autoRejoinPending=${isSyncGuardAutoRejoinPending()}`,
		);
	}

	@Register.command("syncguard")
	public onSyncGuardCommand(_commandManager: CommandManager, player: Player, args: string): void {
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
				player.messages.type(MessageType.Stat).send(
					subcommand === "help" ? this.messageHelp : this.messageUnknownOption,
				);
				break;
		}
	}

	@EventHandler(EventBus.ItemManager, "canMoveItems")
	public onCanMoveItems(
		_host: ItemManager,
		human: Human | undefined,
		itemsToMove: Item[],
		fromContainer: IContainer | undefined,
		toContainer: IContainer,
		_options?: IMoveItemOptions,
		mover?: Human,
	): boolean | undefined {
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

	@EventHandler(EventBus.ItemManager, "containerItemAdd")
	public onContainerItemAdd(
		_host: ItemManager,
		items: Item[],
		container: IContainer,
		_index: number,
	): void {
		this.logContainerEvent("add", items, container);
	}

	@EventHandler(EventBus.ItemManager, "containerItemUpdate")
	public onContainerItemUpdate(
		_host: ItemManager,
		items: Item[],
		containerFrom: IContainer | undefined,
		_containerFromTile: unknown,
		containerTo: IContainer,
	): void {
		if (items.length < this.globalData.config.logBulkThreshold || !this.globalData.config.verboseLogging) {
			return;
		}

		this.log.info(
			`[SyncGuard] container update ${items.length} items `
			+ `from ${this.describeContainer(containerFrom)} `
			+ `to ${this.describeContainer(containerTo)} `
			+ `turn=${this.getTurn()}`,
		);
	}

	@EventHandler(EventBus.Actions, "preExecuteAction")
	public onPreExecuteAction(
		_host: ActionExecutor<any, any, any, any, any>,
		actionType: ActionType,
		actionApi: IActionHandlerApi,
		args: unknown[],
	): false | void {
		if (!this.globalData.config.throttleEnabled) {
			return;
		}

		if (actionType === ActionType.UpdateItemOrder) {
			const playerId = this.getActorId(actionApi.executor as Human | undefined);
			if (this.isRateLimited(this.lastItemOrderAt, playerId, this.globalData.config.itemOrderCooldownMs)) {
				this.blockItemOrder(actionApi.executor as Human | undefined);
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

			const blocked = this.applyMoveThrottle(
				actionType,
				actionApi.executor as Human | undefined,
				throttleInfo,
			);
			if (blocked === false) {
				const playerId = this.getActorId(actionApi.executor as Human | undefined);
				if (this.batchQueue.isAwaitingResult(playerId)) {
					this.batchQueue.cancelAwaiting(playerId, this.globalData.config);
				}
			}
			return blocked;
		} catch (error) {
			this.log.error(
				`[SyncGuard] preExecuteAction failed for ${ActionType[actionType]}: ${error}`,
			);
			return undefined;
		}
	}

	@EventHandler(EventBus.Actions, "postExecuteAction")
	public onPostExecuteAction(
		_host: ActionExecutor<any, any, any, any, any>,
		actionType: ActionType,
		actionApi: IActionHandlerApi,
		args: unknown[],
	): void {
		if (!THROTTLED_MOVE_ACTIONS.has(actionType)) {
			return;
		}

		const actor = actionApi.executor as Human | undefined;
		if (!actor?.isLocalPlayer) {
			return;
		}

		const moveLimit = actionType === ActionType.Drop
			? (args[1] as IDropItemFilterArgument | undefined)?.moveLimit
			: (args[3] as IMoveItemFilterArgument | undefined)?.moveLimit;

		if (moveLimit === undefined) {
			return;
		}

		if (this.batchQueue.isAwaitingResult(actor.id)) {
			this.batchQueue.onActionCompleted(actor.id, this.globalData.config);
		}
	}

	@EventHandler(EventBus.Multiplayer, "connect")
	public onMultiplayerConnect(_host: Multiplayer): void {
		cancelSyncGuardAutoRejoin();
		this.wasMultiplayerClient = multiplayer.isClient;
	}

	@EventHandler(EventBus.Multiplayer, "disconnect")
	public onMultiplayerDisconnect(_host: Multiplayer): void {
		this.batchQueue.clear();
		this.sessionStats.disconnects++;
		this.globalData.lifetimeStats.disconnects++;

		const shouldAutoRejoin = this.globalData.config.autoRejoin
			&& this.wasMultiplayerClient
			&& game.playing;

		this.log.warn(
			`[SyncGuard] Multiplayer disconnected. `
			+ `session=${this.formatStats(this.sessionStats)} `
			+ `lifetime=${this.formatStats(this.globalData.lifetimeStats)} `
			+ `autoRejoin=${shouldAutoRejoin}`,
		);

		this.wasMultiplayerClient = false;

		if (shouldAutoRejoin) {
			scheduleSyncGuardAutoRejoin({
				logInfo: (message) => this.log.info(message),
				logError: (message) => this.log.error(message),
				notifyLocalPlayer: () => {
					if (localPlayer?.isLocalPlayer) {
						localPlayer.messages.type(MessageType.Stat).send(this.messageAutoRejoin);
					}
				},
			});
		}
	}

	private shouldAnnounceToLocalPlayer(): boolean {
		return !multiplayer.isConnected || !multiplayer.isServer;
	}

	private getMultiplayerRole(): string {
		if (!multiplayer.isConnected) {
			return "singleplayer";
		}
		return multiplayer.isServer ? "server" : "client";
	}

	private getActorId(actor?: Human): number {
		return actor?.id ?? -1;
	}

	private getTurn(): number | string {
		return localPlayer?.days ?? "?";
	}

	private getMoveThrottleInfo(
		actionType: ActionType,
		actionApi: IActionHandlerApi,
		args: unknown[],
	): IMoveThrottleInfo | undefined {
		switch (actionType) {
			case ActionType.MoveItem: {
				const use = actionApi.use as IMoveItemCanUse | undefined;
				const items = this.resolveActionItems(use?.items, args[0]);
				if (items.length === 0) {
					return undefined;
				}
				return {
					sourceArg: args[0],
					itemCount: items.length,
					items,
					toContainer: use?.targetContainer ?? (args[1] as IContainer | undefined),
					moveItemIndex: args[2] as number | undefined,
					moveItemFilter: args[3] as IMoveItemFilterArgument | undefined,
					moveItemOptions: args[4] as IMoveItemOptionsArgument | undefined,
				};
			}
			case ActionType.Drop: {
				const use = actionApi.use as unknown as IDropCanUse | undefined;
				const items = this.resolveDropItems(use, args[0]);
				if (!items || items.length === 0) {
					return undefined;
				}
				return {
					sourceArg: args[0],
					itemCount: items.length,
					items,
					toContainer: use?.into,
					dropFilter: args[1] as IDropItemFilterArgument | undefined,
				};
			}
			case ActionType.PickUpAllItems: {
				const use = actionApi.use as IPickUpAllItemsCanUse | undefined;
				const items = [...(use?.tileContainer?.containedItems ?? [])];
				if (items.length === 0) {
					return undefined;
				}
				return {
					sourceArg: args[0],
					itemCount: items.length,
					items,
					fromContainer: use?.tileContainer,
					toContainer: (actionApi.executor as Human).inventory,
				};
			}
			default:
				return undefined;
		}
	}

	private resolveActionItems(useItems: Item[] | undefined, source: unknown): Item[] {
		if (useItems && useItems.length > 0) {
			return useItems;
		}
		return this.resolveMoveItems(source);
	}

	/** Drop must use an explicit item list — never infer count from a whole container. */
	private resolveDropItems(
		use: IDropCanUse | undefined,
		source: unknown,
	): Item[] | undefined {
		if (use?.items && use.items.length > 0) {
			return use.items;
		}
		if (Array.isArray(source)) {
			return source;
		}
		if (source instanceof Item) {
			return [source];
		}
		return undefined;
	}

	private applyMoveThrottle(
		actionType: ActionType,
		actor: Human | undefined,
		info: IMoveThrottleInfo,
	): false | void {
		const config = this.globalData.config;
		const playerId = this.getActorId(actor);
		const itemCount = info.itemCount;
		const actionName = ActionType[actionType] ?? String(actionType);
		const batchMoveLimit = info.moveItemFilter?.moveLimit ?? info.dropFilter?.moveLimit;

		this.sessionStats.containerMoves++;
		this.globalData.lifetimeStats.containerMoves++;

		if (itemCount >= config.logBulkThreshold) {
			this.sessionStats.bulkMoves++;
			this.globalData.lifetimeStats.bulkMoves++;
			this.logMove(
				`preExecute:${actionName}`,
				playerId,
				itemCount,
				info.fromContainer,
				info.toContainer,
			);
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

	private isRateLimited(map: Map<number, number>, playerId: number, cooldownMs: number): boolean {
		if (cooldownMs <= 0) {
			return false;
		}
		const lastAt = map.get(playerId) ?? 0;
		return Date.now() - lastAt < cooldownMs;
	}

	private startBatchedMove(
		actionType: ActionType,
		actor: Human | undefined,
		info: IMoveThrottleInfo,
	): false {
		const config = this.globalData.config;
		const actionName = ActionType[actionType] ?? String(actionType);
		const playerId = this.getActorId(actor);

		this.sessionStats.batchedMoves++;
		this.globalData.lifetimeStats.batchedMoves++;

		const useSourceArgument = actionType !== ActionType.PickUpAllItems
			&& actionType !== ActionType.Drop
			&& this.isContainerBasedSource(info.sourceArg);
		const batchCount = Math.ceil(info.itemCount / config.maxItemsPerMove);
		this.log.info(
			`[SyncGuard] batch-start action=${actionName} player=${playerId} `
			+ `items=${info.itemCount} batches=${batchCount} size=${config.maxItemsPerMove} `
			+ `mode=${useSourceArgument ? "source" : "snapshot"} `
			+ `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`,
		);

		if (!actor?.isLocalPlayer) {
			return false;
		}

		const request = this.createBatchRequest(actionType, actor, info);
		this.batchQueue.enqueue(actor, request, config);
		this.notifyActor(
			actor,
			() => this.messageBatchStarted,
			info.items.length,
			config.maxItemsPerMove,
		);

		return false;
	}

	private createBatchRequest(
		actionType: ActionType,
		actor: Human,
		info: IMoveThrottleInfo,
	): IBatchMoveRequest {
		const useSourceArgument = actionType !== ActionType.PickUpAllItems
			&& actionType !== ActionType.Drop
			&& this.isContainerBasedSource(info.sourceArg);

		if (actionType === ActionType.Drop) {
			return {
				executeAs: ActionType.Drop,
				sourceAction: actionType,
				useSourceArgument: false,
				itemSnapshot: info.items,
				itemOffset: 0,
				dropFilter: info.dropFilter,
			};
		}

		return {
			executeAs: ActionType.MoveItem,
			sourceAction: actionType,
			useSourceArgument,
			moveItemSource: useSourceArgument
				? info.sourceArg as MoveItemsSourceArgumentResolvable
				: undefined,
			itemSnapshot: useSourceArgument ? undefined : info.items,
			itemOffset: 0,
			moveItemTarget: actionType === ActionType.PickUpAllItems
				? actor.inventory
				: info.toContainer,
			moveItemIndex: info.moveItemIndex,
			moveItemFilter: info.moveItemFilter,
			moveItemOptions: info.moveItemOptions,
		};
	}

	private isContainerBasedSource(source: unknown): boolean {
		if (!source || typeof source !== "object" || Array.isArray(source)) {
			return false;
		}
		if (source instanceof Item) {
			return false;
		}
		const candidate = source as Record<string, unknown>;
		return "container" in candidate || "island" in candidate;
	}

	private blockMove(
		actor: Human | undefined,
		actionName: string,
		reason: "too-many" | "rate",
		maxItems?: number,
	): false {
		this.sessionStats.throttled++;
		this.globalData.lifetimeStats.throttled++;
		this.log.warn(
			`[SyncGuard] throttled ${reason} action=${actionName} player=${this.getActorId(actor)} `
			+ `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`,
		);
		if (reason === "too-many" && maxItems !== undefined) {
			this.notifyActor(actor, () => this.messageTooManyItems, maxItems);
		} else {
			this.notifyActor(actor, () => this.messageRateLimited);
		}
		return false;
	}

	private blockItemOrder(actor: Human | undefined): void {
		this.sessionStats.throttled++;
		this.globalData.lifetimeStats.throttled++;
		this.log.warn(
			`[SyncGuard] throttled item-order player=${this.getActorId(actor)} `
			+ `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`,
		);
		this.notifyActor(actor, () => this.messageOrderRateLimited);
	}

	private notifyActor(
		actor: Human | undefined,
		message: () => Message,
		...args: Array<string | number>
	): void {
		if (!actor?.isLocalPlayer) {
			return;
		}
		actor.messages.type(MessageType.Warning).send(message(), ...args);
	}

	private logMove(
		kind: string,
		playerId: number,
		itemCount: number,
		fromContainer: IContainer | undefined,
		toContainer?: IContainer,
	): void {
		this.log.info(
			`[SyncGuard] ${kind} player=${playerId} items=${itemCount} `
			+ `from=${this.describeContainer(fromContainer)} `
			+ `to=${this.describeContainer(toContainer)} `
			+ `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`,
		);
	}

	private logContainerEvent(kind: string, items: Item[], container: IContainer): void {
		const config = this.globalData.config;
		if (!config.verboseLogging || items.length < config.logBulkThreshold) {
			return;
		}
		this.log.info(
			`[SyncGuard] container ${kind} ${items.length} items `
			+ `into ${this.describeContainer(container)} turn=${this.getTurn()}`,
		);
	}

	private describeContainer(container?: IContainer): string {
		if (!container) {
			return "none";
		}
		if (container instanceof Item) {
			const renamed = container.renamed?.toString();
			const typeName = ItemType[container.type] ?? String(container.type);
			return renamed ? `${renamed} (${typeName}#${container.id})` : `${typeName}#${container.id}`;
		}
		return "container";
	}

	private resolveMoveItems(source: unknown): Item[] {
		if (Array.isArray(source)) {
			return source;
		}
		try {
			return MoveItemsSourceArgument.resolve(source as never);
		} catch {
			return source ? [source as Item] : [];
		}
	}

	private applyDesyncGuardRuntime(): void {
		syncGuardDesyncRuntime.suppressDesyncKick = this.globalData.config.suppressDesyncKick;
		syncGuardDesyncRuntime.onSuppressed = (details) => {
			this.sessionStats.desyncSuppressed++;
			this.globalData.lifetimeStats.desyncSuppressed++;
			this.log.warn(`[SyncGuard] desync kick blocked (${details})`);
			if (localPlayer?.isLocalPlayer) {
				localPlayer.messages.type(MessageType.Warning).send(this.messageDesyncSuppressed);
			}
		};
	}

	private formatStats(stats: ISyncGuardStats): string {
		return `moves=${stats.containerMoves}, bulk=${stats.bulkMoves}, `
			+ `batched=${stats.batchedMoves}, throttled=${stats.throttled}, `
			+ `order=${stats.itemOrderUpdates}, disconnects=${stats.disconnects}, `
			+ `desyncBlocked=${stats.desyncSuppressed}`;
	}

	private sendStats(player: Player): void {
		const summary = this.formatStats(this.sessionStats);
		this.log.info(`[SyncGuard] stats requested by ${player.id}: session ${summary}`);
		player.messages.type(MessageType.Stat).send(
			this.messageStats,
			this.sessionStats.containerMoves,
			this.sessionStats.bulkMoves,
			this.sessionStats.batchedMoves,
			this.sessionStats.throttled,
			this.sessionStats.itemOrderUpdates,
			this.sessionStats.disconnects,
			this.sessionStats.desyncSuppressed,
		);
	}

	private setThrottle(player: Player, value?: string): void {
		if (value !== "on" && value !== "off") {
			player.messages.type(MessageType.Stat).send(this.messageHelp);
			return;
		}
		this.globalData.config.throttleEnabled = value === "on";
		this.ackConfig(player, `throttle=${value}`);
	}

	private setNumericOption(
		player: Player,
		key: "maxItemsPerMove" | "moveCooldownMs" | "bulkMoveCooldownMs",
		value: string | undefined,
		min: number,
		max: number,
	): void {
		const parsed = Number(value);
		if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
			player.messages.type(MessageType.Stat).send(this.messageHelp);
			return;
		}
		this.globalData.config[key] = parsed;
		this.ackConfig(player, `${key}=${parsed}`);
	}

	private setBooleanOption(
		player: Player,
		key: "verboseLogging" | "batchLargeMoves" | "autoRejoin" | "suppressDesyncKick",
		value?: string,
	): void {
		if (value !== "on" && value !== "off") {
			player.messages.type(MessageType.Stat).send(this.messageHelp);
			return;
		}
		this.globalData.config[key] = value === "on";
		if (key === "autoRejoin" && value === "off") {
			cancelSyncGuardAutoRejoin();
		}
		if (key === "suppressDesyncKick") {
			this.applyDesyncGuardRuntime();
		}
		this.ackConfig(player, `${key}=${value}`);
	}

	private ackConfig(player: Player, details: string): void {
		this.log.info(`[SyncGuard] config updated (${details}) by player ${player.id}`);
		player.messages.type(MessageType.Good).send(this.messageConfigUpdated);
	}
}
