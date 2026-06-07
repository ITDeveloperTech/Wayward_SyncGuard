import { DisconnectReason } from "@wayward/game/multiplayer/IMultiplayer";
import Multiplayer from "@wayward/game/multiplayer/Multiplayer";
import DisconnectPacket from "@wayward/game/multiplayer/packets/shared/DisconnectPacket";
import type DesyncPacket from "@wayward/game/multiplayer/packets/server/DesyncPacket";
import type { IConnection } from "@wayward/game/multiplayer/networking/IConnection";
import { Inject, Injector, InjectionPosition, type IInjectionApi } from "@wayward/game/utilities/Inject";

export interface ISyncGuardDesyncGuardRuntime {
	suppressDesyncKick: boolean;
	onSuppressed?: (details: string) => void;
}

/** Module-level runtime survives world unload; updated from mod config on load. */
export const syncGuardDesyncRuntime: ISyncGuardDesyncGuardRuntime = {
	suppressDesyncKick: true,
};

function shouldSuppressDesyncKick(): boolean {
	return syncGuardDesyncRuntime.suppressDesyncKick;
}

function notifySuppressed(details: string): void {
	syncGuardDesyncRuntime.onSuppressed?.(details);
}

@Injector
export default class SyncGuardDesyncGuard {

	public constructor(
		private readonly log: (message: string) => void,
	) {}

	@Inject(Multiplayer, "processDesyncPacket", InjectionPosition.Pre)
	protected onProcessDesyncPacket(
		api: IInjectionApi<Multiplayer, "processDesyncPacket">,
		_connection: IConnection,
		desyncPacket: DesyncPacket,
	): void {
		if (!shouldSuppressDesyncKick()) {
			return;
		}

		desyncPacket.shouldDisconnect = false;
		api.cancelled = true;
		const details = `processDesyncPacket (${desyncPacket.packetDebugInfo})`;
		this.log(`[SyncGuard] suppressed ${details}`);
		notifySuppressed(details);
	}

	@Inject(Multiplayer, "closeConnection", InjectionPosition.Pre)
	protected onCloseConnection(
		api: IInjectionApi<Multiplayer, "closeConnection">,
		reason: DisconnectReason,
		_connection: IConnection,
	): void {
		if (reason !== DisconnectReason.Desync || !shouldSuppressDesyncKick()) {
			return;
		}

		api.cancelled = true;
		const details = "closeConnection (Desync)";
		this.log(`[SyncGuard] suppressed ${details}`);
		notifySuppressed(details);
	}

	@Inject(Multiplayer, "disconnectAndResetGameState", InjectionPosition.Pre)
	protected onDisconnectAndResetGameState(
		api: IInjectionApi<Multiplayer, "disconnectAndResetGameState">,
		reason: DisconnectReason,
	): void {
		if (reason !== DisconnectReason.Desync || !shouldSuppressDesyncKick()) {
			return;
		}

		api.cancelled = true;
		const details = "disconnectAndResetGameState (Desync)";
		this.log(`[SyncGuard] suppressed ${details}`);
		notifySuppressed(details);
	}

	@Inject(Multiplayer, "disconnect", InjectionPosition.Pre)
	protected onDisconnect(
		api: IInjectionApi<Multiplayer, "disconnect">,
		reason: DisconnectReason,
	): void {
		if (reason !== DisconnectReason.Desync || !shouldSuppressDesyncKick()) {
			return;
		}

		api.cancelled = true;
		const details = "disconnect (Desync)";
		this.log(`[SyncGuard] suppressed ${details}`);
		notifySuppressed(details);
	}

	@Inject(DisconnectPacket, "process", InjectionPosition.Pre)
	protected onDisconnectPacket(
		api: IInjectionApi<DisconnectPacket, "process">,
	): void {
		if (api.executingInstance.reason !== DisconnectReason.Desync || !shouldSuppressDesyncKick()) {
			return;
		}

		api.cancelled = true;
		const details = "DisconnectPacket (Desync)";
		this.log(`[SyncGuard] suppressed ${details}`);
		notifySuppressed(details);
	}
}

let registeredGuard: SyncGuardDesyncGuard | undefined;

export function registerSyncGuardDesyncGuard(guard: SyncGuardDesyncGuard): void {
	if (registeredGuard !== undefined) {
		Injector.deregister(SyncGuardDesyncGuard, registeredGuard);
	}
	registeredGuard = guard;
	Injector.register(SyncGuardDesyncGuard, guard);
}

export function unregisterSyncGuardDesyncGuard(): void {
	if (registeredGuard === undefined) {
		return;
	}
	Injector.deregister(SyncGuardDesyncGuard, registeredGuard);
	registeredGuard = undefined;
}
