/**
 * Shuffles the contents of the given array using the Fisher-Yates Shuffle: https://bost.ocks.org/mike/shuffle/
 * @returns The given array after shuffling its contents.
 */
export declare function shuffle<T>(arr: T[], r?: () => number): T[];
export declare function tuple<T extends any[]>(...items: T): T;
export declare function choice<T>(arr: T[], r?: () => number): T | undefined;
