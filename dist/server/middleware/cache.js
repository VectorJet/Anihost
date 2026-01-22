import { env } from "../config/env.js";
import { AniwatchAPICache, cache } from "../config/cache.js";
export const cacheControl = async (c, next) => {
    const sMaxAge = env.ANIWATCH_API_S_MAXAGE;
    const staleWhileRevalidate = env.ANIWATCH_API_STALE_WHILE_REVALIDATE;
    c.header("Cache-Control", `s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`);
    await next();
};
export function cacheConfigSetter(keySliceIndex) {
    return async (c, next) => {
        const { pathname, search } = new URL(c.req.url);
        const duration = Number(c.req.header(AniwatchAPICache.CACHE_EXPIRY_HEADER_NAME) ||
            AniwatchAPICache.DEFAULT_CACHE_EXPIRY_SECONDS);
        c.set("CACHE_CONFIG", {
            key: `${pathname.slice(keySliceIndex) + search}`,
            duration,
        });
        if (AniwatchAPICache.enabled) {
            c.res.headers.set(AniwatchAPICache.CACHE_EXPIRY_HEADER_NAME, duration.toString());
        }
        await next();
    };
}
export function withCache(getData) {
    return async (c) => {
        const cacheConfig = c.get("CACHE_CONFIG");
        const data = await cache.getOrSet(() => getData(c), cacheConfig.key, cacheConfig.duration);
        return c.json({ status: 200, data }, { status: 200 });
    };
}
//# sourceMappingURL=cache.js.map