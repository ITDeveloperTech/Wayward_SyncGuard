export interface ISyncGuardConfig {
	/** Master switch for move throttling. */
	throttleEnabled: boolean;
	/** Log container moves at or above this item count. */
	logBulkThreshold: number;
	/** Item count treated as a bulk move for longer cooldowns. */
	bulkThreshold: number;
	/** Reject a single move action that tries to move more than this many items. */
	maxItemsPerMove: number;
	/** Minimum milliseconds between ordinary container moves per player. */
	moveCooldownMs: number;
	/** Minimum milliseconds between bulk container moves per player. */
	bulkMoveCooldownMs: number;
	/** Minimum milliseconds between inventory order updates per player. */
	itemOrderCooldownMs: number;
	/** Write a log line for every container add/update at or above logBulkThreshold. */
	verboseLogging: boolean;
}

export interface ISyncGuardStats {
	containerMoves: number;
	bulkMoves: number;
	throttled: number;
	itemOrderUpdates: number;
	disconnects: number;
}

export interface ISyncGuardGlobalData {
	config: ISyncGuardConfig;
	lifetimeStats: ISyncGuardStats;
}

export const DEFAULT_SYNC_GUARD_CONFIG: ISyncGuardConfig = {
	throttleEnabled: true,
	logBulkThreshold: 3,
	bulkThreshold: 5,
	maxItemsPerMove: 25,
	moveCooldownMs: 150,
	bulkMoveCooldownMs: 400,
	itemOrderCooldownMs: 200,
	verboseLogging: true,
};

export function emptySyncGuardStats(): ISyncGuardStats {
	return {
		containerMoves: 0,
		bulkMoves: 0,
		throttled: 0,
		itemOrderUpdates: 0,
		disconnects: 0,
	};
}

export function mergeSyncGuardConfig(config?: Partial<ISyncGuardConfig>): ISyncGuardConfig {
	return {
		...DEFAULT_SYNC_GUARD_CONFIG,
		...config,
	};
}
