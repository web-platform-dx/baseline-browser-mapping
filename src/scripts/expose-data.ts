import data from "../data/data.js";

const featuresFlat = data.features;

type FeatureKeyed = {
  id: string;
  name: string;
  status: {
    baseline_low_date: string;
    support: object;
  };
};

type BrowserVersionFlat = [
  version: string,
  release_date: string | null,
  status: string | null,
  engine: string | null,
  engine_version: string | null,
];

type BrowserVersionKeyed = {
  version: string;
  release_date: string | null;
  status: string | null;
  engine: string | null;
  engine_version: string | null;
};

const expandFeatures = () => {
  const featuresOutObject: { [key: string]: FeatureKeyed } = {};
  featuresFlat.forEach((feature) => {
    featuresOutObject[feature[0]] = {
      id: feature[0],
      name: feature[1],
      status: {
        baseline_low_date: feature[2],
        support: feature[3],
      },
    };
  });
  return featuresOutObject;
};

const expandBrowserVersions = (bcdBrowsersFlat: {
  [browser: string]: { releases: BrowserVersionFlat[] };
}): {
  [browser: string]: {
    releases: { [key: string]: BrowserVersionKeyed };
  };
} => {
  const browsersOutObject: {
    [browser: string]: {
      releases: { [key: string]: BrowserVersionKeyed };
    };
  } = {};
  Object.entries(bcdBrowsersFlat).forEach(([browser, data]) => {
    if (data.releases) {
      if (!browsersOutObject[browser]) {
        browsersOutObject[browser] = { releases: {} };
      }
      const releasesObj = browsersOutObject[browser]["releases"];
      data.releases.forEach((release) => {
        const releaseToInsert: BrowserVersionKeyed = {
          version: release[0],
          release_date: release[1],
          status: release[2],
          engine: release[3],
          engine_version: release[4],
        };
        releasesObj[release[0]] = releaseToInsert;
      });
    }
  });
  return browsersOutObject;
};

const features = expandFeatures();

const bcdBrowsers = expandBrowserVersions(data.bcdBrowsers);

const otherBrowsers = expandBrowserVersions(data.otherBrowsers);

export { features, bcdBrowsers, otherBrowsers };
