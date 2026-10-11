/**
 * Daksh SDK - Self-Hosting & 1-Click Eject Module
 * Provides studios with 100% data sovereignty and zero vendor lock-in.
 */

export interface EjectRequestOptions {
  titleName?: string;
  environment?: "self_hosted" | "production" | "staging";
  includeSampleData?: boolean;
  customDomain?: string;
  format?: "blob" | "json";
}

export interface EjectPackageMetadata {
  success: boolean;
  titleId: string;
  sizeBytes: number;
  downloadUrl: string;
  timestamp: string;
}

export class DakshEjectClient {
  private endpoint: string;

  constructor(endpoint: string = "http://localhost:3000") {
    this.endpoint = endpoint.replace(/\/$/, "");
  }

  /**
   * Request eject package metadata and download URL.
   */
  async getEjectMetadata(titleId: string, options: EjectRequestOptions = {}): Promise<EjectPackageMetadata> {
    const res = await fetch(`${this.endpoint}/api/titles/${titleId}/eject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...options, format: "json" })
    });

    if (!res.ok) {
      throw new Error(`Failed to request eject package: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * Download the complete standalone Helm v3 chart and PostgreSQL dump .zip bundle.
   */
  async downloadEjectArchive(titleId: string, options: EjectRequestOptions = {}): Promise<Blob> {
    const params = new URLSearchParams({
      titleName: options.titleName || titleId,
      environment: options.environment || "self_hosted",
      includeSampleData: options.includeSampleData !== false ? "true" : "false"
    });

    if (options.customDomain) {
      params.set("customDomain", options.customDomain);
    }

    const res = await fetch(`${this.endpoint}/api/titles/${titleId}/eject?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Failed to download eject archive: ${res.statusText}`);
    }

    return await res.blob();
  }
}
