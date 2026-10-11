using System;
using UnityEditor;
using UnityEngine;
using UnityEngine.Networking;

namespace Daksh.SDK.Editor
{
    public class DakshSettingsWindow : EditorWindow
    {
        private const string PrefTitleId = "Daksh_Editor_TitleId";
        private const string PrefServerUrl = "Daksh_Editor_ServerUrl";
        private const string PrefKey = "Daksh_Editor_EncryptionKey";

        private string _titleId = "demo_title";
        private string _serverUrl = "http://localhost:3000";
        private string _encryptionKey = "daksh_unity_secure_local_key_32";
        private string _statusMessage = "Ready";

        [MenuItem("Window/Daksh/Settings", false, 100)]
        public static void ShowWindow()
        {
            var window = GetWindow<DakshSettingsWindow>("Daksh Settings");
            window.minSize = new Vector2(400, 320);
            window.Show();
        }

        private void OnEnable()
        {
            _titleId = EditorPrefs.GetString(PrefTitleId, "demo_title");
            _serverUrl = EditorPrefs.GetString(PrefServerUrl, "http://localhost:3000");
            _encryptionKey = EditorPrefs.GetString(PrefKey, "daksh_unity_secure_local_key_32");
        }

        private void OnGUI()
        {
            EditorGUILayout.Space(10);
            GUILayout.Label("Daksh Game BaaS SDK Settings", EditorStyles.boldLabel);
            EditorGUILayout.HelpBox("Configure project title credentials and test local connectivity against Daksh BaaS.", MessageType.Info);

            EditorGUILayout.Space(10);
            _titleId = EditorGUILayout.TextField("Title ID", _titleId);
            _serverUrl = EditorGUILayout.TextField("Server URL", _serverUrl);
            _encryptionKey = EditorGUILayout.TextField("AES-256 Key", _encryptionKey);

            EditorGUILayout.Space(15);
            if (GUILayout.Button("Save Settings", GUILayout.Height(30)))
            {
                EditorPrefs.SetString(PrefTitleId, _titleId);
                EditorPrefs.SetString(PrefServerUrl, _serverUrl);
                EditorPrefs.SetString(PrefKey, _encryptionKey);
                _statusMessage = "Settings saved successfully.";
                Debug.Log("[Daksh.Editor] Saved Daksh SDK settings.");
            }

            EditorGUILayout.Space(5);
            EditorGUILayout.BeginHorizontal();

            if (GUILayout.Button("Test Server Ping"))
            {
                TestPing();
            }

            if (GUILayout.Button("Clear Local Cache"))
            {
                var cache = new DakshCache(_encryptionKey);
                cache.ClearAll();
                _statusMessage = "Encrypted local cache and persistent data wiped.";
                Debug.Log("[Daksh.Editor] Wiped local Daksh cache.");
            }

            EditorGUILayout.EndHorizontal();

            EditorGUILayout.Space(15);
            EditorGUILayout.LabelBox($"Status: {_statusMessage}", EditorStyles.helpBox);
        }

        private void TestPing()
        {
            _statusMessage = "Testing server connection...";
            string url = _serverUrl.TrimEnd('/') + $"/api/titles/{_titleId}/economy/catalog";

            var req = UnityWebRequest.Get(url);
            var op = req.SendWebRequest();
            op.completed += _ =>
            {
                if (req.result == UnityWebRequest.Result.Success || req.responseCode == 200 || req.responseCode == 304)
                {
                    _statusMessage = $"Success! Connected to Daksh server (HTTP {req.responseCode}).";
                    Debug.Log($"[Daksh.Editor] Ping successful: {url} (HTTP {req.responseCode})");
                }
                else
                {
                    _statusMessage = $"Ping failed: HTTP {req.responseCode} - {req.error}";
                    Debug.LogWarning($"[Daksh.Editor] Ping failed: {req.error}");
                }
                Repaint();
                req.Dispose();
            };
        }
    }
}
