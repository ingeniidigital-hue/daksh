using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using UnityEngine;

namespace Daksh.SDK
{
    /// <summary>
    /// Cryptographically secure client-side storage engine using AES-256 encryption.
    /// Protects cached session credentials, local wallet mirrors, and offline actions.
    /// </summary>
    public class DakshCache
    {
        private readonly byte[] _key;
        private readonly string _cacheDirectory;

        public DakshCache(string customKey = null)
        {
            string keyStr = string.IsNullOrEmpty(customKey) 
                ? "daksh_unity_secure_local_key_32" 
                : customKey;

            // Ensure key is exactly 32 bytes (256 bits) using SHA-256
            using (SHA256 sha = SHA256.Create())
            {
                _key = sha.ComputeHash(Encoding.UTF8.GetBytes(keyStr));
            }

            try
            {
                _cacheDirectory = Path.Combine(Application.persistentDataPath, "DakshCache");
                if (!Directory.Exists(_cacheDirectory))
                {
                    Directory.CreateDirectory(_cacheDirectory);
                }
            }
            catch
            {
                _cacheDirectory = null;
            }
        }

        public string Encrypt(string plainText)
        {
            if (string.IsNullOrEmpty(plainText)) return string.Empty;

            using (Aes aes = Aes.Create())
            {
                aes.Key = _key;
                aes.GenerateIV();

                using (MemoryStream ms = new MemoryStream())
                {
                    ms.Write(aes.IV, 0, aes.IV.Length);
                    using (CryptoStream cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
                    using (StreamWriter sw = new StreamWriter(cs, Encoding.UTF8))
                    {
                        sw.Write(plainText);
                    }
                    return Convert.ToBase64String(ms.ToArray());
                }
            }
        }

        public string Decrypt(string cipherText)
        {
            if (string.IsNullOrEmpty(cipherText)) return string.Empty;

            byte[] fullBytes = Convert.FromBase64String(cipherText);
            using (Aes aes = Aes.Create())
            {
                aes.Key = _key;
                byte[] iv = new byte[16];
                Array.Copy(fullBytes, 0, iv, 0, 16);
                aes.IV = iv;

                using (MemoryStream ms = new MemoryStream(fullBytes, 16, fullBytes.Length - 16))
                using (CryptoStream cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read))
                using (StreamReader sr = new StreamReader(cs, Encoding.UTF8))
                {
                    return sr.ReadToEnd();
                }
            }
        }

        public void SetString(string key, string value)
        {
            string encrypted = Encrypt(value);
            if (!string.IsNullOrEmpty(_cacheDirectory))
            {
                string filePath = GetFilePath(key);
                File.WriteAllText(filePath, encrypted, Encoding.UTF8);
            }
            else
            {
                PlayerPrefs.SetString("daksh_" + key, encrypted);
                PlayerPrefs.Save();
            }
        }

        public string GetString(string key, string defaultValue = null)
        {
            try
            {
                string encrypted = null;
                if (!string.IsNullOrEmpty(_cacheDirectory))
                {
                    string filePath = GetFilePath(key);
                    if (File.Exists(filePath))
                    {
                        encrypted = File.ReadAllText(filePath, Encoding.UTF8);
                    }
                }
                else if (PlayerPrefs.HasKey("daksh_" + key))
                {
                    encrypted = PlayerPrefs.GetString("daksh_" + key);
                }

                if (string.IsNullOrEmpty(encrypted)) return defaultValue;
                return Decrypt(encrypted);
            }
            catch (Exception ex)
            {
                Debug.LogWarning($"[Daksh.Cache] Failed to decrypt key '{key}': {ex.Message}");
                return defaultValue;
            }
        }

        public void SetObject<T>(string key, T obj)
        {
            string json = JsonUtility.ToJson(obj);
            SetString(key, json);
        }

        public T GetObject<T>(string key, T defaultValue = default)
        {
            string json = GetString(key);
            if (string.IsNullOrEmpty(json)) return defaultValue;
            try
            {
                return JsonUtility.FromJson<T>(json);
            }
            catch
            {
                return defaultValue;
            }
        }

        public bool HasKey(string key)
        {
            if (!string.IsNullOrEmpty(_cacheDirectory))
            {
                return File.Exists(GetFilePath(key));
            }
            return PlayerPrefs.HasKey("daksh_" + key);
        }

        public void DeleteKey(string key)
        {
            if (!string.IsNullOrEmpty(_cacheDirectory))
            {
                string filePath = GetFilePath(key);
                if (File.Exists(filePath)) File.Delete(filePath);
            }
            PlayerPrefs.DeleteKey("daksh_" + key);
        }

        public void ClearAll()
        {
            if (!string.IsNullOrEmpty(_cacheDirectory) && Directory.Exists(_cacheDirectory))
            {
                Directory.Delete(_cacheDirectory, true);
                Directory.CreateDirectory(_cacheDirectory);
            }
            PlayerPrefs.Save();
        }

        private string GetFilePath(string key)
        {
            using (SHA256 sha = SHA256.Create())
            {
                byte[] hash = sha.ComputeHash(Encoding.UTF8.GetBytes(key));
                string hex = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();
                return Path.Combine(_cacheDirectory, hex + ".bin");
            }
        }
    }
}
