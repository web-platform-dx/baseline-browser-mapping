import {
  data,
  BrowserVersionFlat,
  CompressedSupportObject,
} from "../data/data.js";

const featuresFlat = data.features;

type FeatureKeyed = {
  id: string;
  status: {
    baseline_low_date: string;
    support: { [key: string]: string };
  };
};

type BrowserVersionKeyed = {
  version: string;
  release_date: string | undefined;
  status: string | undefined;
  engine: string | undefined;
  engine_version: string | undefined;
};

const expandSupportObject = (object: CompressedSupportObject) => {
  return {
    chrome: object.c,
    chrome_android: object.ca,
    edge: object.e,
    firefox: object.f,
    firefox_android: object.fa,
    safari: object.s,
    safari_ios: object.si,
  };
};

const expandFeatures = () => {
  const featuresOutObject: { [key: string]: FeatureKeyed } = {};
  featuresFlat.forEach((feature) => {
    featuresOutObject[feature[0]] = {
      id: feature[0],
      status: {
        baseline_low_date: feature[1],
        support: expandSupportObject(feature[2]),
      },
    };
  });
  return featuresOutObject;
};

const engineMapping: { [key: string]: string } = {
  W: "WebKit",
  G: "Gecko",
  P: "Presto",
  B: "Blink",
};

const statusMapping: { [key: string]: string } = {
  r: "retired",
  c: "current",
  b: "beta",
  n: "nightly",
  p: "planned",
  u: "unknown",
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
          release_date: release[1] == "u" ? "unknown" : release[1],
          status: statusMapping[release[2]],
          engine: release[3] ? engineMapping[release[3]] : undefined,
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
