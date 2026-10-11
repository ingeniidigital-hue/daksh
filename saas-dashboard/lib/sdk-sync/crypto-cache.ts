import crypto from "crypto";

export interface EncryptedBlob {
  ciphertext: string;
  iv: string;
  tag: string;
}

function normalizeKey(key: string): Buffer {
  return crypto.createHash("sha256").update(key).digest(); // Exactly 32 bytes
}

export function encryptLocalCache(data: any, secretKey: string): EncryptedBlob {
  const key = normalizeKey(secretKey);
  const iv = crypto.randomBytes(12); // 12-byte IV for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const plaintext = typeof data === "string" ? data : JSON.stringify(data);
  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return {
    ciphertext,
    iv: iv.toString("hex"),
    tag
  };
}

export function decryptLocalCache(encrypted: EncryptedBlob, secretKey: string): any {
  const key = normalizeKey(secretKey);
  const iv = Buffer.from(encrypted.iv, "hex");
  const tag = Buffer.from(encrypted.tag, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted.ciphertext, "hex", "utf8");
  decrypted += decipher.final("utf8");

  try {
    return JSON.parse(decrypted);
  } catch {
    return decrypted;
  }
}
