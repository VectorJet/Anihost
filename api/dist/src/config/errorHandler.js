import { HiAnimeError } from "aniwatch";
import { log } from "./logger.js";
const errResp = {
    status: 500,
    message: "Internal Server Error",
};
export const errorHandler = (err, c) => {
    log.error(JSON.stringify(err));
    if (err instanceof HiAnimeError) {
        errResp.status = err.status;
        errResp.message = err.message;
    }
    return c.json(errResp, errResp.status);
};
export const notFoundHandler = (c) => {
    errResp.status = 404;
    errResp.message = "Not Found";
    log.error(JSON.stringify(errResp));
    return c.json(errResp, errResp.status);
};
//# sourceMappingURL=errorHandler.js.map