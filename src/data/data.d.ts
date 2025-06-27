type FeatureFlat = [id: string, baseline_low_date: string, support: object];

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
export { data, BrowserVersionFlat, FeatureFlat };
