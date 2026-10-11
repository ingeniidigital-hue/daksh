const IP_V4_REGEX = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function scrubPii(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== "object") return obj;

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();

    // Check specific sensitive key names first
    if (lowerKey === "authorization") {
      result[key] = "[REDACTED_HEADER]";
      continue;
    }

    if (lowerKey.includes("password") || lowerKey.includes("secret") || lowerKey.includes("hash")) {
      result[key] = "[REDACTED_SECRET]";
      continue;
    }

    if (lowerKey.includes("token") || lowerKey.includes("session") || lowerKey.includes("jwt")) {
      result[key] = "[REDACTED_TOKEN]";
      continue;
    }

    if (lowerKey.includes("email")) {
      result[key] = "[REDACTED_EMAIL]";
      continue;
    }

    if (lowerKey === "ip" || lowerKey.includes("ip_address") || lowerKey.includes("client_ip")) {
      result[key] = "[REDACTED_IP]";
      continue;
    }

    // Check string values with regex
    if (typeof value === "string") {
      if (IP_V4_REGEX.test(value)) {
        result[key] = "[REDACTED_IP]";
        continue;
      }
      if (EMAIL_REGEX.test(value)) {
        result[key] = "[REDACTED_EMAIL]";
        continue;
      }
      result[key] = value;
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = scrubPii(value);
    } else {
      result[key] = value;
    }
  }

  return result;
}
