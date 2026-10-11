import crypto from "crypto";

export function computeETag(data: any): string {
  const content = typeof data === "string" ? data : JSON.stringify(data);
  const hash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 32);
  return `"${hash}"`;
}

export interface ConditionalCacheResult {
  status: 200 | 304;
  body: any | null;
  etag: string;
}

export function evaluateConditionalCache(
  data: any,
  incomingIfNoneMatch?: string | null
): ConditionalCacheResult {
  const currentEtag = computeETag(data);

  if (incomingIfNoneMatch && incomingIfNoneMatch.trim() === currentEtag) {
    return {
      status: 304,
      body: null,
      etag: currentEtag
    };
  }

  return {
    status: 200,
    body: data,
    etag: currentEtag
  };
}
