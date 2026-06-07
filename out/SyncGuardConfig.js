define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.DEFAULT_SYNC_GUARD_CONFIG = void 0;
    exports.emptySyncGuardStats = emptySyncGuardStats;
    exports.mergeSyncGuardConfig = mergeSyncGuardConfig;
    exports.DEFAULT_SYNC_GUARD_CONFIG = {
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
    function emptySyncGuardStats() {
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
    function mergeSyncGuardConfig(config) {
        return {
            ...exports.DEFAULT_SYNC_GUARD_CONFIG,
            ...config,
        };
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY0d1YXJkQ29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL1N5bmNHdWFyZENvbmZpZy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7O0lBc0RBLGtEQVVDO0lBRUQsb0RBS0M7SUEvQlksUUFBQSx5QkFBeUIsR0FBcUI7UUFDMUQsZUFBZSxFQUFFLElBQUk7UUFDckIsZ0JBQWdCLEVBQUUsQ0FBQztRQUNuQixhQUFhLEVBQUUsQ0FBQztRQUNoQixlQUFlLEVBQUUsRUFBRTtRQUNuQixlQUFlLEVBQUUsSUFBSTtRQUNyQixjQUFjLEVBQUUsR0FBRztRQUNuQixrQkFBa0IsRUFBRSxHQUFHO1FBQ3ZCLG1CQUFtQixFQUFFLEdBQUc7UUFDeEIsY0FBYyxFQUFFLElBQUk7UUFDcEIsVUFBVSxFQUFFLElBQUk7UUFDaEIsa0JBQWtCLEVBQUUsSUFBSTtLQUN4QixDQUFDO0lBRUYsU0FBZ0IsbUJBQW1CO1FBQ2xDLE9BQU87WUFDTixjQUFjLEVBQUUsQ0FBQztZQUNqQixTQUFTLEVBQUUsQ0FBQztZQUNaLFlBQVksRUFBRSxDQUFDO1lBQ2YsU0FBUyxFQUFFLENBQUM7WUFDWixnQkFBZ0IsRUFBRSxDQUFDO1lBQ25CLFdBQVcsRUFBRSxDQUFDO1lBQ2QsZ0JBQWdCLEVBQUUsQ0FBQztTQUNuQixDQUFDO0lBQ0gsQ0FBQztJQUVELFNBQWdCLG9CQUFvQixDQUFDLE1BQWtDO1FBQ3RFLE9BQU87WUFDTixHQUFHLGlDQUF5QjtZQUM1QixHQUFHLE1BQU07U0FDVCxDQUFDO0lBQ0gsQ0FBQyJ9