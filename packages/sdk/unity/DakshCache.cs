using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Collections.Generic;

namespace Daksh.SDK
{
    public class DakshCache
    {
        private static readonly byte[] DefaultKey = Encoding.UTF8.GetBytes("daksh_unity_secure_local_key_32"); // 32 bytes

        public static string EncryptString(string plainText)
        {
            using (Aes aes = Aes.Create())
            {
                aes.Key = DefaultKey;
                aes.GenerateIV();
                using (MemoryStream ms = new MemoryStream())
                {
                    ms.Write(aes.IV, 0, aes.IV.Length);
                    using (CryptoStream cs = new CryptoStream(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
                    using (StreamWriter sw = new StreamWriter(cs))
                    {
                        sw.Write(plainText);
                    }
                    return Convert.ToBase64String(ms.ToArray());
                }
            }
        }

        public static string DecryptString(string cipherText)
        {
            byte[] fullBytes = Convert.FromBase64String(cipherText);
            using (Aes aes = Aes.Create())
            {
                aes.Key = DefaultKey;
                byte[] iv = new byte[16];
                Array.Copy(fullBytes, 0, iv, 0, 16);
                aes.IV = iv;

                using (MemoryStream ms = new MemoryStream(fullBytes, 16, fullBytes.Length - 16))
                using (CryptoStream cs = new CryptoStream(ms, aes.CreateDecryptor(), CryptoStreamMode.Read))
                using (StreamReader sr = new StreamReader(cs))
                {
                    return sr.ReadToEnd();
                }
            }
        }
    }

    [Serializable]
    public class QueuedOfflineAction
    {
        public string actionId;
        public string actionType;
        public string payloadJson;
        public long timestamp;
    }
}
