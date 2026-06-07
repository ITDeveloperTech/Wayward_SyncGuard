const AUTO_REJOIN_DELAY_MS = 750;

let autoRejoinTimer: ReturnType<typeof setTimeout> | undefined;
let autoRejoinPending = false;

export interface ISyncGuardAutoRejoinCallbacks {
	logInfo: (message: string) => void;
	logError: (message: string) => void;
	notifyLocalPlayer?: () => void;
}

export function scheduleSyncGuardAutoRejoin(callbacks: ISyncGuardAutoRejoinCallbacks): void {
	cancelSyncGuardAutoRejoin();
	autoRejoinPending = true;

	autoRejoinTimer = setTimeout(() => {
		autoRejoinTimer = undefined;
		void attemptSyncGuardAutoRejoin(callbacks);
	}, AUTO_REJOIN_DELAY_MS);
}

export function cancelSyncGuardAutoRejoin(): void {
	autoRejoinPending = false;
	if (autoRejoinTimer !== undefined) {
		clearTimeout(autoRejoinTimer);
		autoRejoinTimer = undefined;
	}
}

export function isSyncGuardAutoRejoinPending(): boolean {
	return autoRejoinPending;
}

function logInfo(callbacks: ISyncGuardAutoRejoinCallbacks, message: string): void {
	try {
		callbacks.logInfo(message);
	} catch {
		console.info(`[Sync Guard] ${message}`);
	}
}

function logError(callbacks: ISyncGuardAutoRejoinCallbacks, message: string): void {
	try {
		callbacks.logError(message);
	} catch {
		console.error(`[Sync Guard] ${message}`);
	}
}

function getMultiplayerRole(): string {
	if (!multiplayer.isConnected) {
		return "singleplayer";
	}
	return multiplayer.isServer ? "server" : "client";
}

async function attemptSyncGuardAutoRejoin(callbacks: ISyncGuardAutoRejoinCallbacks): Promise<void> {
	if (!autoRejoinPending) {
		return;
	}
	autoRejoinPending = false;

	if (multiplayer.isConnected) {
		logInfo(callbacks, "[SyncGuard] auto-rejoin skipped (already connected)");
		return;
	}

	logInfo(
		callbacks,
		`[SyncGuard] auto-rejoin starting role=${getMultiplayerRole()}`,
	);

	try {
		callbacks.notifyLocalPlayer?.();
	} catch {
		// Mod may already be unloaded; rejoin still proceeds.
	}

	try {
		const success = await multiplayer.rejoinServer({
			automaticallyRetry: true,
			enableSteamNetworkConnections: true,
		});
		logInfo(callbacks, `[SyncGuard] auto-rejoin ${success ? "succeeded" : "failed"}`);
	} catch (error) {
		logError(callbacks, `[SyncGuard] auto-rejoin error: ${error}`);
	}
}
