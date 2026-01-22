export declare class AniwatchAPICache {
    private static instance;
    private client;
    enabled: boolean;
    static enabled: boolean;
    static DEFAULT_CACHE_EXPIRY_SECONDS: 300;
    static CACHE_EXPIRY_HEADER_NAME: "Aniwatch-Cache-Expiry";
    constructor();
    static getInstance(): AniwatchAPICache;
    getOrSet<T>(dataGetter: () => Promise<T>, key: string, expirySeconds?: number): Promise<T>;
    closeConnection(): void;
}
export declare const cache: AniwatchAPICache;
