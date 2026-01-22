import type { BlankInput } from "hono/types";
import type { Context, MiddlewareHandler, Handler } from "hono";
import type { ServerContext } from "../config/context.js";
export declare const cacheControl: MiddlewareHandler;
export declare function cacheConfigSetter(keySliceIndex: number): MiddlewareHandler;
export declare function withCache<T, P extends string = string>(getData: (c: Context<ServerContext, P, BlankInput>) => Promise<T>): Handler<ServerContext, P, BlankInput>;
