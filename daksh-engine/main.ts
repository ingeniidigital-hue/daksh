let InitModule: nkruntime.InitModule = function(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, initializer: nkruntime.Initializer) {
    logger.info("=========================================");
    logger.info("🚀 DAKSH ENGINE INITIALIZED");
    logger.info("=========================================");

    // Register a test RPC function
    initializer.registerRpc("healthcheck", rpcHealthcheck);
}

function rpcHealthcheck(context: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    logger.info("Healthcheck RPC called");
    return JSON.stringify({ status: "ok", message: "Daksh Server is running perfectly." });
}
