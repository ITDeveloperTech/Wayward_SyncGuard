import type CommandManager from "@wayward/game/command/CommandManager";
import { EventBus } from "@wayward/game/event/EventBuses";
import { EventHandler } from "@wayward/game/event/EventManager";
import type ActionExecutor from "@wayward/game/game/entity/action/ActionExecutor";
import type Human from "@wayward/game/game/entity/Human";
import { ActionType } from "@wayward/game/game/entity/action/IAction";
import type { IActionHandlerApi } from "@wayward/game/game/entity/action/IAction";
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
	emptySyncGuardStats,
	type ISyncGuardGlobalData,
	type ISyncGuardStats,
	mergeSyncGuardConfig,
} from "./SyncGuardConfig";

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

	private readonly sessionStats = emptySyncGuardStats();
	private readonly lastContainerMoveAt = new Map<number, number>();
	private readonly lastItemOrderAt = new Map<number, number>();

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
	}

	public override onLoad(): void {
		Object.assign(this.sessionStats, emptySyncGuardStats());
		this.lastContainerMoveAt.clear();
		this.lastItemOrderAt.clear();

		const role = this.getMultiplayerRole();
		this.log.info(`Sync Guard loaded (${role}).`);

		if (this.shouldAnnounceToLocalPlayer()) {
			localPlayer.messages.type(MessageType.Good).send(this.messageLoaded);
		}
	}

	public override onUnload(): void {
		this.log.info(`Sync Guard unloaded. Session stats: ${this.formatStats(this.sessionStats)}`);
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
		if (!this.shouldEnforce()) {
			return undefined;
		}

		const actor = mover ?? human;
		const playerId = this.getActorId(actor);
		const itemCount = itemsToMove.length;
		const config = this.globalData.config;

		this.sessionStats.containerMoves++;
		this.globalData.lifetimeStats.containerMoves++;

		if (itemCount >= config.logBulkThreshold) {
			this.sessionStats.bulkMoves++;
			this.globalData.lifetimeStats.bulkMoves++;
			this.logMove("bulk-canMove", playerId, itemCount, fromContainer, toContainer);
		} else if (config.verboseLogging) {
			this.logMove("canMove", playerId, itemCount, fromContainer, toContainer);
		}

		if (!config.throttleEnabled) {
			return undefined;
		}

		if (itemCount > config.maxItemsPerMove) {
			return this.blockMove(actor, "too-many", config.maxItemsPerMove);
		}

		const cooldown = itemCount >= config.bulkThreshold
			? config.bulkMoveCooldownMs
			: config.moveCooldownMs;

		if (this.isRateLimited(this.lastContainerMoveAt, playerId, cooldown)) {
			return this.blockMove(actor, "rate");
		}

		this.lastContainerMoveAt.set(playerId, Date.now());
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
		if (!this.shouldEnforce() || !this.globalData.config.throttleEnabled) {
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

		if (actionType === ActionType.MoveItem && this.globalData.config.verboseLogging) {
			const source = args[0];
			const estimatedCount = this.estimateMoveItemCount(source);
			if (estimatedCount >= this.globalData.config.logBulkThreshold) {
				this.log.info(
					`[SyncGuard] MoveItem action ~${estimatedCount} items `
					+ `turn=${this.getTurn()} role=${this.getMultiplayerRole()}`,
				);
			}
		}
	}

	@EventHandler(EventBus.Multiplayer, "disconnect")
	public onMultiplayerDisconnect(_host: Multiplayer): void {
		this.sessionStats.disconnects++;
		this.globalData.lifetimeStats.disconnects++;
		this.log.warn(
			`[SyncGuard] Multiplayer disconnected. `
			+ `session=${this.formatStats(this.sessionStats)} `
			+ `lifetime=${this.formatStats(this.globalData.lifetimeStats)}`,
		);
	}

	private shouldEnforce(): boolean {
		if (!multiplayer.isConnected) {
			return true;
		}
		return multiplayer.isServer;
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

	private isRateLimited(map: Map<number, number>, playerId: number, cooldownMs: number): boolean {
		if (cooldownMs <= 0) {
			return false;
		}
		const lastAt = map.get(playerId) ?? 0;
		return Date.now() - lastAt < cooldownMs;
	}

	private blockMove(actor: Human | undefined, reason: "too-many" | "rate", maxItems?: number): false {
		this.sessionStats.throttled++;
		this.globalData.lifetimeStats.throttled++;
		this.log.warn(
			`[SyncGuard] throttled ${reason} player=${this.getActorId(actor)} `
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
		toContainer: IContainer,
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

	private estimateMoveItemCount(source: unknown): number {
		if (Array.isArray(source)) {
			return source.length;
		}
		try {
			return MoveItemsSourceArgument.resolve(source as never).length;
		} catch {
			return source ? 1 : 0;
		}
	}

	private formatStats(stats: ISyncGuardStats): string {
		return `moves=${stats.containerMoves}, bulk=${stats.bulkMoves}, `
			+ `throttled=${stats.throttled}, order=${stats.itemOrderUpdates}, `
			+ `disconnects=${stats.disconnects}`;
	}

	private sendStats(player: Player): void {
		const summary = this.formatStats(this.sessionStats);
		this.log.info(`[SyncGuard] stats requested by ${player.id}: session ${summary}`);
		player.messages.type(MessageType.Stat).send(
			this.messageStats,
			this.sessionStats.containerMoves,
			this.sessionStats.bulkMoves,
			this.sessionStats.throttled,
			this.sessionStats.itemOrderUpdates,
			this.sessionStats.disconnects,
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

	private setBooleanOption(player: Player, key: "verboseLogging", value?: string): void {
		if (value !== "on" && value !== "off") {
			player.messages.type(MessageType.Stat).send(this.messageHelp);
			return;
		}
		this.globalData.config[key] = value === "on";
		this.ackConfig(player, `${key}=${value}`);
	}

	private ackConfig(player: Player, details: string): void {
		this.log.info(`[SyncGuard] config updated (${details}) by player ${player.id}`);
		player.messages.type(MessageType.Good).send(this.messageConfigUpdated);
	}
}
