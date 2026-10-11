using System;
using UnityEngine;

namespace Daksh.SDK
{
    /// <summary>
    /// Master client coordinator for the Daksh Game BaaS SDK.
    /// Combines DakshCoreClient with modular subsystem accessors (Economy, Leaderboards, Matchmaking, OTA, Relay).
    /// </summary>
    public class DakshClient : DakshCoreClient
    {
        private static DakshClient _instance;
        public new static DakshClient Instance
        {
            get
            {
                if (_instance == null)
                {
                    var go = new GameObject("[DakshClient]");
                    _instance = go.AddComponent<DakshClient>();
                    DontDestroyOnLoad(go);
                    _instance.Initialize(DakshConfig.Default);
                }
                return _instance;
            }
        }

        // Modular Subsystems
        public DakshEconomy Economy => GetSubsystem<DakshEconomy>();
        public DakshLeaderboards Leaderboards => GetSubsystem<DakshLeaderboards>();
        public DakshMatchmaking Matchmaking => GetSubsystem<DakshMatchmaking>();
        public DakshAddressablesDownloader OTA => GetSubsystem<DakshAddressablesDownloader>();
        public DakshRelayClient Relay => GetSubsystem<DakshRelayClient>();
        public DakshActionReporter Actions => GetSubsystem<DakshActionReporter>();

        public static DakshClient Initialize(DakshConfig config)
        {
            if (_instance == null)
            {
                var go = new GameObject("[DakshClient]");
                _instance = go.AddComponent<DakshClient>();
                DontDestroyOnLoad(go);
            }

            _instance.Setup(config);
            return _instance;
        }

        protected override void Awake()
        {
            if (_instance == null)
            {
                _instance = this;
                _coreInstance = this;
                DontDestroyOnLoad(gameObject);
            }
            else if (_instance != this)
            {
                Destroy(gameObject);
            }
        }

        public void Setup(DakshConfig config)
        {
            SetupCore(config);

            // Register modular subsystems based on feature toggles
            if (Config.enableEconomy)
            {
                RegisterSubsystem(new DakshEconomy(this));
            }

            if (Config.enableLeaderboards)
            {
                RegisterSubsystem(new DakshLeaderboards(this));
            }

            if (Config.enableMatchmaking)
            {
                RegisterSubsystem(new DakshMatchmaking(this));
            }

            if (Config.enableOTA)
            {
                RegisterSubsystem(new DakshAddressablesDownloader(this));
            }

            if (Config.enableRelay)
            {
                RegisterSubsystem(new DakshRelayClient(this));
            }

            // Always register Zero-Trust Server-Authoritative Action Reporter
            RegisterSubsystem(new DakshActionReporter(this));

            Debug.Log($"[Daksh.Client] Daksh Game BaaS SDK v1.0.0 Ready. Active Subsystems: {_subsystems.Count}");
        }
    }
}
