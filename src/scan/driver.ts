export interface ScanInput {
  url: string;
}

export interface CapturedResource {
  type:
    | "script"
    | "image"
    | "font"
    | "css"
    | "html"
    | "xhr"
    | "media"
    | "other";
  url: string;
  bytes: number;
  encoded: boolean;
  cached: boolean;
  thirdPartyHost: string | null;
}

export interface ScanResult {
  bytesTotal: number;
  requestCount: number;
  resources: CapturedResource[];
  lcpMs: number | null;
  cls: number | null;
  fcpMs: number | null;
  ttfbMs: number | null;
  status: "ok" | "error" | "timeout" | "blocked";
  errorMessage?: string;
}

export interface ScanDriver {
  scan(input: ScanInput): Promise<ScanResult>;
}
