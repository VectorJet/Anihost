import { Hono } from "hono";
declare const hianimeRouter: Hono<{
    Variables: {
        CACHE_CONFIG: {
            key: string;
            duration: number;
        };
    };
}, import("hono/types").BlankSchema, "/">;
export { hianimeRouter };
