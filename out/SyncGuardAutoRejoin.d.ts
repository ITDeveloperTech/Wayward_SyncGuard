export interface ISyncGuardAutoRejoinCallbacks {
    logInfo: (message: string) => void;
    logError: (message: string) => void;
    notifyLocalPlayer?: () => void;
}
export declare function scheduleSyncGuardAutoRejoin(callbacks: ISyncGuardAutoRejoinCallbacks): void;
export declare function cancelSyncGuardAutoRejoin(): void;
export declare function isSyncGuardAutoRejoinPending(): boolean;
