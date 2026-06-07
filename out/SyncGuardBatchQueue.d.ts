import type Human from "@wayward/game/game/entity/Human";
import { ActionType } from "@wayward/game/game/entity/action/IAction";
import type { IDropItemFilterArgument } from "@wayward/game/game/entity/action/actions/Drop";
import type { IMoveItemFilterArgument } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemFilterArgument";
import type { IMoveItemOptionsArgument } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemOptionsArgument";
import type { MoveItemsSourceArgumentResolvable } from "@wayward/game/game/entity/action/actions/moveItem/MoveItemsSourceArgument";
import type { IContainer } from "@wayward/game/game/item/IItem";
import type Item from "@wayward/game/game/item/Item";
import type { ISyncGuardConfig } from "./SyncGuardConfig";
export interface IBatchMoveRequest {
    executeAs: ActionType.MoveItem | ActionType.Drop;
    sourceAction: ActionType;
    useSourceArgument: boolean;
    moveItemSource?: MoveItemsSourceArgumentResolvable;
    itemSnapshot?: Item[];
    itemOffset: number;
    moveItemTarget?: IContainer;
    moveItemIndex?: number;
    moveItemFilter?: IMoveItemFilterArgument;
    moveItemOptions?: IMoveItemOptionsArgument;
    dropFilter?: IDropItemFilterArgument;
    sourceCountBefore?: number;
    awaitingResult?: boolean;
}
export default class SyncGuardBatchQueue {
    private readonly jobs;
    private readonly timers;
    onStall?: (actor: Human, remaining: number) => void;
    onComplete?: (actor: Human) => void;
    enqueue(actor: Human, request: IBatchMoveRequest, config: ISyncGuardConfig): void;
    clear(): void;
    hasActiveBatch(playerId: number): boolean;
    isAwaitingResult(playerId: number): boolean;
    cancelAwaiting(playerId: number, config: ISyncGuardConfig): void;
    onActionCompleted(playerId: number, config: ISyncGuardConfig): void;
    private runNext;
    private executeNext;
    private beginSourceBatch;
    private executeSnapshotBatch;
    private completeCurrentJob;
    private abortPlayer;
    private clearPlayer;
    private countSourceItems;
    private withMoveLimit;
}
