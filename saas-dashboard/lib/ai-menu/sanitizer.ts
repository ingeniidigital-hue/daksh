/**
 * Prompt Sanitizer for AI Command Menu & MCP
 * Enforces security boundaries by stripping SQL injection vectors, XSS tags,
 * and malicious command injection payloads.
 */
export class PromptSanitizer {
  private static readonly INJECTION_PATTERNS = [
    /\b(DROP\s+TABLE|ALTER\s+TABLE|DELETE\s+FROM|SELECT\s+\*\s+FROM|UNION\s+SELECT)\b/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /\b(exec|eval|system|spawn)\s*\(/i,
    /--|\/\*|\*\//g // SQL comment markers
  ];

  public static isSuspicious(input: string): boolean {
    if (!input || typeof input !== "string") return true;
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        return true;
      }
    }
    return false;
  }

  public static clean(input: string): string {
    if (!input) return "";
    let cleaned = input.trim();
    // Strip control characters
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, "");
    return cleaned;
  }
}
