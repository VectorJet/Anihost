import { cache } from "./config/cache.js";
export function execGracefulShutdown(server) {
    process.stdout.write("\naniwatch-api SHUTTING DOWN gracefully...\n");
    cache.closeConnection();
    server.close((err) => {
        process.stdout.write("\naniwatch-api SHUTDOWN complete.\n");
        err ? console.error(err) : null;
        process.exit(err ? 1 : 0);
    });
    process.exit(0);
}
//# sourceMappingURL=utils.js.map