type FeatureFlat = [
  id: string,
  baseline_low_date: string,
  support: CompressedSupportObject,
];

type CompressedSupportObject = {
  c: string;
  ca: string;
  e: string;
  f: string;
  fa: string;
  s: string;
  si: string;
};

type BrowserVersionFlat = [
  version: string,
  release_date: string,
  status: string,
  engine: string | undefined,
  engine_version: string | undefined,
];

declare const data: {
  features: FeatureFlat[];
  bcdBrowsers: { [browser: string]: { releases: BrowserVersionFlat[] } };
  otherBrowsers: { [browser: string]: { releases: BrowserVersionFlat[] } };
};

declare const lastUpdated: number;

export {
  data,
  BrowserVersionFlat,
  FeatureFlat,
  CompressedSupportObject,
  lastUpdated,
};
