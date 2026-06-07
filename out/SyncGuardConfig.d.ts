export interface ISyncGuardConfig {
    throttleEnabled: boolean;
    logBulkThreshold: number;
    bulkThreshold: number;
    maxItemsPerMove: number;
    batchLargeMoves: boolean;
    moveCooldownMs: number;
    bulkMoveCooldownMs: number;
    itemOrderCooldownMs: number;
    verboseLogging: boolean;
    autoRejoin: boolean;
    suppressDesyncKick: boolean;
}
export interface ISyncGuardStats {
    containerMoves: number;
    bulkMoves: number;
    batchedMoves: number;
    throttled: number;
    itemOrderUpdates: number;
    disconnects: number;
    desyncSuppressed: number;
}
export interface ISyncGuardGlobalData {
    config: ISyncGuardConfig;
    lifetimeStats: ISyncGuardStats;
}
export declare const DEFAULT_SYNC_GUARD_CONFIG: ISyncGuardConfig;
export declare function emptySyncGuardStats(): ISyncGuardStats;
export declare function mergeSyncGuardConfig(config?: Partial<ISyncGuardConfig>): ISyncGuardConfig;
