import { Redis } from "ioredis";
import { env } from "./env.js";
export class AniwatchAPICache {
    static instance = null;
    client;
    enabled = false;
    static enabled = false;
    static DEFAULT_CACHE_EXPIRY_SECONDS = 300;
    static CACHE_EXPIRY_HEADER_NAME = "Aniwatch-Cache-Expiry";
    constructor() {
        const redisConnURL = env.ANIWATCH_API_REDIS_CONN_URL;
        this.enabled = AniwatchAPICache.enabled = Boolean(redisConnURL);
        this.client = this.enabled ? new Redis(String(redisConnURL)) : null;
    }
    static getInstance() {
        if (!AniwatchAPICache.instance) {
            AniwatchAPICache.instance = new AniwatchAPICache();
        }
        return AniwatchAPICache.instance;
    }
    async getOrSet(dataGetter, key, expirySeconds = AniwatchAPICache.DEFAULT_CACHE_EXPIRY_SECONDS) {
        const cachedData = this.enabled
            ? (await this.client?.get?.(key)) || null
            : null;
        let data = JSON.parse(String(cachedData));
        if (!data) {
            data = await dataGetter();
            await this.client?.set?.(key, JSON.stringify(data), "EX", expirySeconds);
        }
        return data;
    }
    closeConnection() {
        this.client
            ?.quit()
            ?.then(() => {
            this.client = null;
            AniwatchAPICache.instance = null;
            console.info("aniwatch-api redis connection closed and cache instance reset");
        })
            .catch((err) => {
            console.error(`aniwatch-api error while closing redis connection: ${err}`);
        });
    }
}
export const cache = AniwatchAPICache.getInstance();
//# sourceMappingURL=cache.js.map