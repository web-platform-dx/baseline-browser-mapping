type FeatureFlat = [
  id: string,
  name: string,
  baseline_low_date: string,
  support: object,
];

type BrowserVersionFlat = [
  version: string,
  release_date: string | null,
  status: string | null,
  engine: string | null,
  engine_version: string | null,
];

declare const data: {
  features: FeatureFlat[];
  bcdBrowsers: { [browser: string]: { releases: BrowserVersionFlat[] } };
  otherBrowsers: { [browser: string]: { releases: BrowserVersionFlat[] } };
};
export default data;
