var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "@wayward/game/multiplayer/IMultiplayer", "@wayward/game/multiplayer/Multiplayer", "@wayward/game/multiplayer/packets/shared/DisconnectPacket", "@wayward/game/utilities/Inject"], function (require, exports, IMultiplayer_1, Multiplayer_1, DisconnectPacket_1, Inject_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.syncGuardDesyncRuntime = void 0;
    exports.registerSyncGuardDesyncGuard = registerSyncGuardDesyncGuard;
    exports.unregisterSyncGuardDesyncGuard = unregisterSyncGuardDesyncGuard;
    Multiplayer_1 = __importDefault(Multiplayer_1);
    DisconnectPacket_1 = __importDefault(DisconnectPacket_1);
    exports.syncGuardDesyncRuntime = {
        suppressDesyncKick: true,
    };
    function shouldSuppressDesyncKick() {
        return exports.syncGuardDesyncRuntime.suppressDesyncKick;
    }
    function notifySuppressed(details) {
        exports.syncGuardDesyncRuntime.onSuppressed?.(details);
    }
    let SyncGuardDesyncGuard = class SyncGuardDesyncGuard {
        constructor(log) {
            this.log = log;
        }
        onProcessDesyncPacket(api, _connection, desyncPacket) {
            if (!shouldSuppressDesyncKick()) {
                return;
            }
            desyncPacket.shouldDisconnect = false;
            api.cancelled = true;
            const details = `processDesyncPacket (${desyncPacket.packetDebugInfo})`;
            this.log(`[SyncGuard] suppressed ${details}`);
            notifySuppressed(details);
        }
        onCloseConnection(api, reason, _connection) {
            if (reason !== IMultiplayer_1.DisconnectReason.Desync || !shouldSuppressDesyncKick()) {
                return;
            }
            api.cancelled = true;
            const details = "closeConnection (Desync)";
            this.log(`[SyncGuard] suppressed ${details}`);
            notifySuppressed(details);
        }
        onDisconnectAndResetGameState(api, reason) {
            if (reason !== IMultiplayer_1.DisconnectReason.Desync || !shouldSuppressDesyncKick()) {
                return;
            }
            api.cancelled = true;
            const details = "disconnectAndResetGameState (Desync)";
            this.log(`[SyncGuard] suppressed ${details}`);
            notifySuppressed(details);
        }
        onDisconnect(api, reason) {
            if (reason !== IMultiplayer_1.DisconnectReason.Desync || !shouldSuppressDesyncKick()) {
                return;
            }
            api.cancelled = true;
            const details = "disconnect (Desync)";
            this.log(`[SyncGuard] suppressed ${details}`);
            notifySuppressed(details);
        }
        onDisconnectPacket(api) {
            if (api.executingInstance.reason !== IMultiplayer_1.DisconnectReason.Desync || !shouldSuppressDesyncKick()) {
                return;
            }
            api.cancelled = true;
            const details = "DisconnectPacket (Desync)";
            this.log(`[SyncGuard] suppressed ${details}`);
            notifySuppressed(details);
        }
    };
    __decorate([
        (0, Inject_1.Inject)(Multiplayer_1.default, "processDesyncPacket", Inject_1.InjectionPosition.Pre)
    ], SyncGuardDesyncGuard.prototype, "onProcessDesyncPacket", null);
    __decorate([
        (0, Inject_1.Inject)(Multiplayer_1.default, "closeConnection", Inject_1.InjectionPosition.Pre)
    ], SyncGuardDesyncGuard.prototype, "onCloseConnection", null);
    __decorate([
        (0, Inject_1.Inject)(Multiplayer_1.default, "disconnectAndResetGameState", Inject_1.InjectionPosition.Pre)
    ], SyncGuardDesyncGuard.prototype, "onDisconnectAndResetGameState", null);
    __decorate([
        (0, Inject_1.Inject)(Multiplayer_1.default, "disconnect", Inject_1.InjectionPosition.Pre)
    ], SyncGuardDesyncGuard.prototype, "onDisconnect", null);
    __decorate([
        (0, Inject_1.Inject)(DisconnectPacket_1.default, "process", Inject_1.InjectionPosition.Pre)
    ], SyncGuardDesyncGuard.prototype, "onDisconnectPacket", null);
    SyncGuardDesyncGuard = __decorate([
        Inject_1.Injector
    ], SyncGuardDesyncGuard);
    exports.default = SyncGuardDesyncGuard;
    let registeredGuard;
    function registerSyncGuardDesyncGuard(guard) {
        if (registeredGuard !== undefined) {
            Inject_1.Injector.deregister(SyncGuardDesyncGuard, registeredGuard);
        }
        registeredGuard = guard;
        Inject_1.Injector.register(SyncGuardDesyncGuard, guard);
    }
    function unregisterSyncGuardDesyncGuard() {
        if (registeredGuard === undefined) {
            return;
        }
        Inject_1.Injector.deregister(SyncGuardDesyncGuard, registeredGuard);
        registeredGuard = undefined;
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY0d1YXJkRGVzeW5jR3VhcmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvU3luY0d1YXJkRGVzeW5jR3VhcmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztJQWdIQSxvRUFNQztJQUVELHdFQU1DOzs7SUFqSFksUUFBQSxzQkFBc0IsR0FBaUM7UUFDbkUsa0JBQWtCLEVBQUUsSUFBSTtLQUN4QixDQUFDO0lBRUYsU0FBUyx3QkFBd0I7UUFDaEMsT0FBTyw4QkFBc0IsQ0FBQyxrQkFBa0IsQ0FBQztJQUNsRCxDQUFDO0lBRUQsU0FBUyxnQkFBZ0IsQ0FBQyxPQUFlO1FBQ3hDLDhCQUFzQixDQUFDLFlBQVksRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ2hELENBQUM7SUFHYyxJQUFNLG9CQUFvQixHQUExQixNQUFNLG9CQUFvQjtRQUV4QyxZQUNrQixHQUE4QjtZQUE5QixRQUFHLEdBQUgsR0FBRyxDQUEyQjtRQUM3QyxDQUFDO1FBR00scUJBQXFCLENBQzlCLEdBQXNELEVBQ3RELFdBQXdCLEVBQ3hCLFlBQTBCO1lBRTFCLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLENBQUM7Z0JBQ2pDLE9BQU87WUFDUixDQUFDO1lBRUQsWUFBWSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztZQUN0QyxHQUFHLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztZQUNyQixNQUFNLE9BQU8sR0FBRyx3QkFBd0IsWUFBWSxDQUFDLGVBQWUsR0FBRyxDQUFDO1lBQ3hFLElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQTBCLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDOUMsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDM0IsQ0FBQztRQUdTLGlCQUFpQixDQUMxQixHQUFrRCxFQUNsRCxNQUF3QixFQUN4QixXQUF3QjtZQUV4QixJQUFJLE1BQU0sS0FBSywrQkFBZ0IsQ0FBQyxNQUFNLElBQUksQ0FBQyx3QkFBd0Is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