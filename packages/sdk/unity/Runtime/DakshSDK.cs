namespace Daksh.SDK
{
    /// <summary>
    /// Static facade providing global, convenient access to the Daksh Game BaaS client and its modular subsystems.
    /// </summary>
    public static class DakshSDK
    {
        public static DakshClient Client => DakshClient.Instance;
        public static DakshAuth Auth => Client.Auth;
        public static DakshCache Cache => Client.Cache;
        public static ETagStore ETag => Client.ETag;
        public static OfflineActionQueue OfflineQueue => Client.OfflineQueue;

        public static DakshEconomy Economy => Client.Economy;
        public static DakshLeaderboards Leaderboards => Client.Leaderboards;
        public static DakshMatchmaking Matchmaking => Client.Matchmaking;
        public static DakshAddressablesDownloader OTA => Client.OTA;
        public static DakshRelayClient Relay => Client.Relay;

        public static void Initialize(DakshConfig config)
        {
            DakshClient.Initialize(config);
        }
    }
}
