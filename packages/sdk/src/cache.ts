export interface CachedCatalog<T = any> {
  etag: string;
  data: T;
  cachedAt: number;
}

export class DakshClientCache {
  private memoryCache: Map<string, CachedCatalog> = new Map();

  set(key: string, data: any, etag: string): void {
    this.memoryCache.set(key, {
      etag,
      data,
      cachedAt: Date.now()
    });
  }

  get(key: string): CachedCatalog | null {
    return this.memoryCache.get(key) || null;
  }

  getEtag(key: string): string | null {
    const entry = this.get(key);
    return entry ? entry.etag : null;
  }

  clear(): void {
    this.memoryCache.clear();
  }
}
