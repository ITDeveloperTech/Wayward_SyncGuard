export interface ISyncGuardConfig {
	/** Master switch for move throttling. */
	throttleEnabled: boolean;
	/** Log container moves at or above this item count. */
	logBulkThreshold: number;
	/** Item count treated as a bulk move for longer cooldowns. */
	bulkThreshold: number;
	/** Max items per action; larger moves are split into batches when batchLargeMoves is enabled. */
	maxItemsPerMove: number;
	/** Split oversized moves into sequential batches instead of blocking them. */
	batchLargeMoves: boolean;
	/** Minimum milliseconds between ordinary container moves per player. */
	moveCooldownMs: number;
	/** Minimum milliseconds between bulk container moves per player. */
	bulkMoveCooldownMs: number;
	/** Minimum milliseconds between inventory order updates per player. */
	itemOrderCooldownMs: number;
	/** Write a log line for every container add/update at or above logBulkThreshold. */
	verboseLogging: boolean;
	/** Automatically rejoin the last server after an unexpected client disconnect. */
	autoRejoin: boolean;
	/** Block desync kicks via packet/disconnect interception (client and server). */
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

export const DEFAULT_SYNC_GUARD_CONFIG: ISyncGuardConfig = {
	throttleEnabled: true,
	logBulkThreshold: 3,
	bulkThreshold: 5,
	maxItemsPerMove: 25,
	batchLargeMoves: true,
	moveCooldownMs: 150,
	bulkMoveCooldownMs: 400,
	itemOrderCooldownMs: 200,
	verboseLogging: true,
	autoRejoin: true,
	suppressDesyncKick: true,
};

export function emptySyncGuardStats(): ISyncGuardStats {
	return {
		containerMoves: 0,
		bulkMoves: 0,
		batchedMoves: 0,
		throttled: 0,
		itemOrderUpdates: 0,
		disconnects: 0,
		desyncSuppressed: 0,
	};
}

export function mergeSyncGuardConfig(config?: Partial<ISyncGuardConfig>): ISyncGuardConfig {
	return {
		...DEFAULT_SYNC_GUARD_CONFIG,
		...config,
	};
}
