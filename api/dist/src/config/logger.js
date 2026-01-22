import { env } from "./env.js";
import { pino } from "pino";
const loggerOptions = {
    redact: env.isProduction ? ["hostname"] : [],
    level: "info",
    transport: env.isDev
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:standard",
            },
        }
        : undefined,
    formatters: {
        level(label) {
            return {
                level: label.toUpperCase(),
            };
        },
    },
};
export const log = pino(loggerOptions);
//# sourceMappingURL=logger.js.map