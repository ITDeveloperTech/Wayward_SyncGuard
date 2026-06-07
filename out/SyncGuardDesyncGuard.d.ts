import { DisconnectReason } from "@wayward/game/multiplayer/IMultiplayer";
import Multiplayer from "@wayward/game/multiplayer/Multiplayer";
import DisconnectPacket from "@wayward/game/multiplayer/packets/shared/DisconnectPacket";
import type DesyncPacket from "@wayward/game/multiplayer/packets/server/DesyncPacket";
import type { IConnection } from "@wayward/game/multiplayer/networking/IConnection";
import { type IInjectionApi } from "@wayward/game/utilities/Inject";
export interface ISyncGuardDesyncGuardRuntime {
    suppressDesyncKick: boolean;
    onSuppressed?: (details: string) => void;
}
export declare const syncGuardDesyncRuntime: ISyncGuardDesyncGuardRuntime;
export default class SyncGuardDesyncGuard {
    private readonly log;
    constructor(log: (message: string) => void);
    protected onProcessDesyncPacket(api: IInjectionApi<Multiplayer, "processDesyncPacket">, _connection: IConnection, desyncPacket: DesyncPacket): void;
    protected onCloseConnection(api: IInjectionApi<Multiplayer, "closeConnection">, reason: DisconnectReason, _connection: IConnection): void;
    protected onDisconnectAndResetGameState(api: IInjectionApi<Multiplayer, "disconnectAndResetGameState">, reason: DisconnectReason): void;
    protected onDisconnect(api: IInjectionApi<Multiplayer, "disconnect">, reason: DisconnectReason): void;
    protected onDisconnectPacket(api: IInjectionApi<DisconnectPacket, "process">): void;
}
export declare function registerSyncGuardDesyncGuard(guard: SyncGuardDesyncGuard): void;
export declare function unregisterSyncGuardDesyncGuard(): void;
