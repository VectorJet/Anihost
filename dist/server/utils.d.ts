import type { ServerType } from "@hono/node-server";
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
export declare function execGracefulShutdown(server: ServerType): void;
