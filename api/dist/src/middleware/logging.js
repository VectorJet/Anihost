import { logger as honoLogger } from "hono/logger";
import { log } from "../config/logger.js";
export const logging = honoLogger((msg, ...rest) => {
    log.info(msg, ...rest);
});
//# sourceMappingURL=logging.js.map