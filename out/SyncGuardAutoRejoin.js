define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.scheduleSyncGuardAutoRejoin = scheduleSyncGuardAutoRejoin;
    exports.cancelSyncGuardAutoRejoin = cancelSyncGuardAutoRejoin;
    exports.isSyncGuardAutoRejoinPending = isSyncGuardAutoRejoinPending;
    const AUTO_REJOIN_DELAY_MS = 750;
    let autoRejoinTimer;
    let autoRejoinPending = false;
    function scheduleSyncGuardAutoRejoin(callbacks) {
        cancelSyncGuardAutoRejoin();
        autoRejoinPending = true;
        autoRejoinTimer = setTimeout(() => {
            autoRejoinTimer = undefined;
            void attemptSyncGuardAutoRejoin(callbacks);
        }, AUTO_REJOIN_DELAY_MS);
    }
    function cancelSyncGuardAutoRejoin() {
        autoRejoinPending = false;
        if (autoRejoinTimer !== undefined) {
            clearTimeout(autoRejoinTimer);
            autoRejoinTimer = undefined;
        }
    }
    function isSyncGuardAutoRejoinPending() {
        return autoRejoinPending;
    }
    function logInfo(callbacks, message) {
        try {
            callbacks.logInfo(message);
        }
        catch {
            console.info(`[Sync Guard] ${message}`);
        }
    }
    function logError(callbacks, message) {
        try {
            callbacks.logError(message);
        }
        catch {
            console.error(`[Sync Guard] ${message}`);
        }
    }
    function getMultiplayerRole() {
        if (!multiplayer.isConnected) {
            return "singleplayer";
        }
        return multiplayer.isServer ? "server" : "client";
    }
    async function attemptSyncGuardAutoRejoin(callbacks) {
        if (!autoRejoinPending) {
            return;
        }
        autoRejoinPending = false;
        if (multiplayer.isConnected) {
            logInfo(callbacks, "[SyncGuard] auto-rejoin skipped (already connected)");
            return;
        }
        logInfo(callbacks, `[SyncGuard] auto-rejoin starting role=${getMultiplayerRole()}`);
        try {
            callbacks.notifyLocalPlayer?.();
        }
        catch {
        }
        try {
            const success = await multiplayer.rejoinServer({
                automaticallyRetry: true,
                enableSteamNetworkConnections: true,
            });
            logInfo(callbacks, `[SyncGuard] auto-rejoin ${success ? "succeeded" : "failed"}`);
        }
        catch (error) {
            logError(callbacks, `[SyncGuard] auto-rejoin error: ${error}`);
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY0d1YXJkQXV0b1Jlam9pbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9TeW5jR3VhcmRBdXRvUmVqb2luLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztJQVdBLGtFQVFDO0lBRUQsOERBTUM7SUFFRCxvRUFFQztJQS9CRCxNQUFNLG9CQUFvQixHQUFHLEdBQUcsQ0FBQztJQUVqQyxJQUFJLGVBQTBELENBQUM7SUFDL0QsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFROUIsU0FBZ0IsMkJBQTJCLENBQUMsU0FBd0M7UUFDbkYseUJBQXlCLEVBQUUsQ0FBQztRQUM1QixpQkFBaUIsR0FBRyxJQUFJLENBQUM7UUFFekIsZUFBZSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEVBQUU7WUFDakMsZUFBZSxHQUFHLFNBQVMsQ0FBQztZQUM1QixLQUFLLDBCQUEwQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzVDLENBQUMsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFFRCxTQUFnQix5QkFBeUI7UUFDeEMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO1FBQzFCLElBQUksZUFBZSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQ25DLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUM5QixlQUFlLEdBQUcsU0FBUyxDQUFDO1FBQzdCLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBZ0IsNEJBQTRCO1FBQzNDLE9BQU8saUJBQWlCLENBQUM7SUFDMUIsQ0FBQztJQUVELFNBQVMsT0FBTyxDQUFDLFNBQXdDLEVBQUUsT0FBZTtRQUN6RSxJQUFJLENBQUM7WUFDSixTQUFTLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVCLENBQUM7UUFBQyxNQUFNLENBQUM7WUFDUixPQUFPLENBQUMsSUFBSSxDQUFDLGdCQUFnQixPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQ3pDLENBQUM7SUFDRixDQUFDO0lBRUQsU0FBUyxRQUFRLENBQUMsU0FBd0MsRUFBRSxPQUFlO1FBQzFFLElBQUksQ0FBQztZQUNKLFNBQVMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUFDLE1BQU0sQ0FBQztZQUNSLE9BQU8sQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDMUMsQ0FBQztJQUNGLENBQUM7SUFFRCxTQUFTLGtCQUFrQjtRQUMxQixJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQzlCLE9BQU8sY0FBYyxDQUFDO1FBQ3ZCLENBQUM7UUFDRCxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDO0lBQ25ELENBQUM7SUFFRCxLQUFLLFVBQVUsMEJBQTBCLENBQUMsU0FBd0M7UUFDakYsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDeEIsT0FBTztRQUNSLENBQUM7UUFDRCxpQkFBaUIsR0FBRyxLQUFLLENBQUM7UUFFMUIsSUFBSSxXQUFXLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDN0IsT0FBTyxDQUFDLFNBQVMsRUFBRSxxREFBcUQsQ0FBQyxDQUFDO1lBQzFFLE9BQU87UUFDUixDQUFDO1FBRUQsT0FBTyxDQUNOLFNBQVMsRUFDVCx5Q0FBeUMsa0JBQWtCLEVBQUUsRUFBRSxDQUMvRCxDQUFDO1FBRUYsSUFBSSxDQUFDO1lBQ0osU0FBUyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsQ0FBQztRQUNqQyxDQUFDO1FBQUMsTUFBTSxDQUFDO1FBRVQsQ0FBQztRQUVELElBQUksQ0FBQztZQUNKLE1BQU0sT0FBTyxHQUFHLE1BQU0sV0FBVyxDQUFDLFlBQVksQ0FBQztnQkFDOUMsa0JBQWtCLEVBQUUsSUFBSTtnQkFDeEIsNkJBQTZCLEVBQUUsSUFBSTthQUNuQyxDQUFDLENBQUM7WUFDSCxPQUFPLENBQUMsU0FBUyxFQUFFLDJCQUEyQixPQUFPLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQztRQUNuRixDQUFDO1FBQUMsT0FBTyxLQUFLLEVBQUUsQ0FBQztZQUNoQixRQUFRLENBQUMsU0FBUyxFQUFFLGtDQUFrQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ2hFLENBQUM7SUFDRixDQUFDIn0=