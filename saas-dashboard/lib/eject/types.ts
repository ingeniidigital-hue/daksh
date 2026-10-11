export interface EjectOptions {
  titleName?: string;
  environment?: string;
  includeSampleData?: boolean;
  customDomain?: string;
  dbPassword?: string;
}

export interface EjectManifest {
  titleId: string;
  titleName: string;
  exportedAt: string;
  chartVersion: string;
  files: string[];
  sizeBytes: number;
}
