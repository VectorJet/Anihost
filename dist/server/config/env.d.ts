export declare enum DeploymentEnv {
    NODEJS = "nodejs",
    DOCKER = "docker",
    VERCEL = "vercel",
    CLOUDFLARE_WORKERS = "cloudflare-workers",
    RENDER = "render"
}
export declare const API_DEPLOYMENT_ENVIRONMENTS: DeploymentEnv[];
export declare const SERVERLESS_ENVIRONMENTS: DeploymentEnv[];
export declare const env: Readonly<{
    ANIWATCH_API_PORT: number;
    ANIWATCH_API_WINDOW_MS: number;
    ANIWATCH_API_MAX_REQS: number;
    ANIWATCH_API_CORS_ALLOWED_ORIGINS: string | undefined;
    ANIWATCH_API_DEPLOYMENT_ENV: DeploymentEnv;
    ANIWATCH_API_HOSTNAME: string | undefined;
    ANIWATCH_API_REDIS_CONN_URL: string | undefined;
    ANIWATCH_API_S_MAXAGE: number;
    ANIWATCH_API_STALE_WHILE_REVALIDATE: number;
    NODE_ENV: "development" | "production" | "test" | "staging";
} & import("envalid").CleanedEnvAccessors>;
