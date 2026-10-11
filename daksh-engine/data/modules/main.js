"use strict";
let InitModule = function (ctx, logger, nk, initializer) {
    logger.info("=========================================");
    logger.info("🚀 DAKSH ENGINE INITIALIZED");
    logger.info("=========================================");
    // Register a test RPC function
    initializer.registerRpc("healthcheck", rpcHealthcheck);
};
function rpcHealthcheck(context, logger, nk, payload) {
    logger.info("Healthcheck RPC called");
    return JSON.stringify({ status: "ok", message: "Daksh Server is running perfectly." });
}
