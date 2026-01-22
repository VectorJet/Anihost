import { Hono } from "hono";
declare const app: Hono<{
    Variables: {
        CACHE_CONFIG: {
            key: string;
            duration: number;
        };
    };
}, import("hono/types").BlankSchema, "/">;
export default app;
