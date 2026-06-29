import { features as featuresObject } from "web-features";
import bcd from "@mdn/browser-compat-data";
import downstreamBrowsers from "../src/data/downstream-browsers.json" with { type: "json" };
import { writeFileSync } from "fs";
import { compareVersions } from "../src/utils.js";
import { BrowserVersion } from "../src/types.js";

const normalizeReleaseDate = (date?: string | null): string => {
  if (!date || date === "unknown" || date === "u") {
    return "u";
  }
  let normalized = date;
  if (date.startsWith("20")) {
    normalized = date.slice(2);
  }
  return normalized.replace(/-/g, "");
};

const bcdBrowsers = bcd.browsers as BrowserData;
const otherBrowsers = downstreamBrowsers.browsers as BrowserData;

const features: RawFeature[] = Object.entries(featuresObject).reduce(
  (prev: RawFeature[], [, feature]) => {
    const f = feature as any;
    if (f.kind === "feature" && f.status?.baseline_low_date) {
      prev.push(f as RawFeature);
    }
    return prev;
  },
  [],
);

const bcdCoreBrowserNames: string[] = [
  "chrome",
  "chrome_android",
  "edge",
  "firefox",
  "firefox_android",
  "safari",
  "safari_ios",
];

type Browser = {
  releases: {
    [version: string]: {
      status: string;
      release_date?: string;
      engine?: string;
      engine_version?: string;
    };
  };
};

type BrowserData = {
  [key: string]: Browser;
};

// BrowserVersion is now imported from utils.ts

type RawFeature = {
  kind: "feature";
  status: {
    baseline: string;
    baseline_low_date: string;
    support: Record<string, string>;
  };
};

type Feature = {
  baseline_low_date: string;
  support: Record<string, string>;
};

const coreBrowserData: [string, Browser][] = Object.keys(
  bcdBrowsers as BrowserData,
)
  .map((key) => [key, (bcdBrowsers as BrowserData)[key]] as [string, Browser])
  .filter(([browserName]) => bcdCoreBrowserNames.includes(browserName));

const bcdDownstreamBrowserNames: string[] = [
  "webview_android",
  "samsunginternet_android",
  "opera_android",
  "opera",
];
const downstreamBrowserData: [string, Browser][] = [
  ...Object.keys(bcdBrowsers as BrowserData)
    .map((key) => [key, (bcdBrowsers as BrowserData)[key]] as [string, Browser])
    .filter(([browserName]) => bcdDownstreamBrowserNames.includes(browserName)),
  ...(Object.keys(otherBrowsers as BrowserData).map((key) => [
    key,
    (otherBrowsers as BrowserData)[key],
  ]) as [string, Browser][]),
];

const acceptableStatuses: string[] = [
  "current",
  "esr",
  "retired",
  "unknown",
  "beta",
  "nightly",
];

const stripLTEPrefix = (str: string): string => {
  if (!str) {
    return str;
  }
  if (!str.startsWith("≤")) {
    return str;
  }
  return str.slice(1);
};

const getCompatibleFeaturesByDate = (date: Date): Feature[] => {
  return features
    .filter(
      (feature: RawFeature) =>
        feature.status.baseline_low_date &&
        new Date(feature.status.baseline_low_date) <= date,
    )
    .map((feature: RawFeature): Feature => {
      return {
        baseline_low_date: feature.status.baseline_low_date,
        support: feature.status.support,
      };
    });
};

const getMinimumVersionsFromFeatures = (
  features: Feature[],
): BrowserVersion[] => {
  let minimumVersions: { [key: string]: BrowserVersion } = {};

  coreBrowserData.forEach((browserData) => {
    minimumVersions[browserData[0]] = {
      browser: browserData[0],
      version: "0",
      release_date: "",
    };
  });

  features.forEach((feature) => {
    Object.keys(feature.support).forEach((browserName) => {
      const versionStr = feature.support[browserName];
      if (!versionStr) {
        return;
      }
      const version = stripLTEPrefix(versionStr);
      if (
        minimumVersions[browserName] &&
        compareVersions(
          version,
          stripLTEPrefix(minimumVersions[browserName].version),
        ) === 1
      ) {
        minimumVersions[browserName] = {
          browser: browserName,
          version: version,
          release_date: coreBrowserData.find(
            (bcdBrowser) => bcdBrowser[0] === browserName,
          )?.[1].releases[version]?.release_date,
        };
      }
    });
  });

  return Object.keys(minimumVersions).map(
    (key) => minimumVersions[key],
  ) as BrowserVersion[];
};

const getSubsequentVersions = (
  minimumVersions: BrowserVersion[],
): BrowserVersion[] => {
  let subsequentVersions: BrowserVersion[] = [];

  minimumVersions.forEach((minimumVersion: BrowserVersion) => {
    let bcdBrowser = coreBrowserData.find(
      (bcdBrowser) => bcdBrowser[0] === minimumVersion.browser,
    );
    if (bcdBrowser) {
      let sortedVersions = Object.keys(bcdBrowser[1].releases)
        .map(
          (key) =>
            [key, bcdBrowser[1].releases[key]] as [
              string,
              {
                status: string;
                release_date?: string;
                engine?: string;
                engine_version?: string;
              },
            ],
        )
        .filter(([, versionData]) => {
          return acceptableStatuses.includes(versionData.status);
        })
        .sort((a, b) => {
          return compareVersions(a[0], b[0]);
        });

      sortedVersions.forEach(([version, versionData]) => {
        if (!acceptableStatuses.includes(versionData.status)) {
          return false;
        }
        if (compareVersions(version, minimumVersion.version) === 1) {
          subsequentVersions.push({
            browser: minimumVersion.browser,
            version: version,
            release_date: versionData.release_date
              ? versionData.release_date
              : "u",
          });
          return true;
        }
        return false;
      });
    }
  });
  return subsequentVersions;
};

const getCoreVersionsByDate = (
  date: Date,
  listAllCompatibleVersions: boolean = false,
): BrowserVersion[] => {
  if (date.getFullYear() < 2002) {
    throw new Error(
      "None of the browsers in the core set were released before 2002.  Please use a date after 2002.",
    );
  }

  if (date.getFullYear() > new Date().getFullYear()) {
    throw new Error(
      "There are no browser versions compatible with Baseline in the future",
    );
  }

  const compatibleFeatures = getCompatibleFeaturesByDate(date);
  const minimumVersions = getMinimumVersionsFromFeatures(compatibleFeatures);

  if (!listAllCompatibleVersions) {
    return minimumVersions;
  } else {
    return [...minimumVersions, ...getSubsequentVersions(minimumVersions)].sort(
      (a, b) => {
        if (a.browser < b.browser) {
          return -1;
        } else if (a.browser > b.browser) {
          return 1;
        } else {
          return compareVersions(a.version, b.version);
        }
      },
    );
  }
};

const getDownstreamBrowsers = (
  inputArray: BrowserVersion[] = [],
  listAllCompatibleVersions: boolean = true,
  includeKaiOS: boolean = false,
): BrowserVersion[] => {
  const getMinimumVersion = (browserName: string): string | undefined => {
    return inputArray && inputArray.length > 0
      ? inputArray
          .filter((browser: BrowserVersion) => browser.browser === browserName)
          .sort((a, b) => compareVersions(a.version, b.version))[0]?.version
      : undefined;
  };

  const minimumChromeVersion = getMinimumVersion("chrome");
  const minimumFirefoxVersion = getMinimumVersion("firefox");

  if (!minimumChromeVersion && !minimumFirefoxVersion) {
    throw new Error(
      "There are no browser versions compatible with Baseline before Chrome and Firefox",
    );
  }

  let downstreamArray: BrowserVersion[] = [];

  downstreamBrowserData
    .filter(([browser]) => {
      if (browser === "kai_os" && !includeKaiOS) {
        return false;
      }
      return true;
    })
    .forEach(([browserName, browserData]) => {
      if (!browserData.releases) return;
      // Only include versions with Blink or Gecko engine and engine_version >= minimum core version
      let sortedAndFilteredVersions = Object.keys(browserData.releases)
        .map(
          (key) =>
            [key, browserData.releases[key]] as [
              string,
              {
                status: string;
                release_date?: string;
                engine?: string;
                engine_version?: string;
              },
            ],
        )
        .filter(([, versionData]) => {
          // @ts-ignore
          const { engine, engine_version } = versionData;
          if (!engine || !engine_version) return false;

          if (engine === "Blink" && minimumChromeVersion) {
            return compareVersions(engine_version, minimumChromeVersion) >= 0;
          }
          if (engine === "Gecko" && minimumFirefoxVersion) {
            return compareVersions(engine_version, minimumFirefoxVersion) >= 0;
          }
          return false;
        })
        .sort((a, b) => {
          // @ts-ignore
          return compareVersions(a[0], b[0]);
        });

      for (let i = 0; i < sortedAndFilteredVersions.length; i++) {
        const versionEntry = sortedAndFilteredVersions[i];
        if (versionEntry) {
          const [versionNumber, versionData] = versionEntry;
          let outputArray: BrowserVersion = {
            browser: browserName,
            version: versionNumber,
            release_date: versionData.release_date ?? "u",
          };

          if (versionData.engine && versionData.engine_version) {
            outputArray.engine = versionData.engine;
            outputArray.engine_version = versionData.engine_version;
          }

          downstreamArray.push(outputArray);

          if (!listAllCompatibleVersions) {
            break;
          }
        }
      }
    });

  return downstreamArray;
};

export type TimelineEntry = BrowserVersion[];

export type CondensedTimelineEntry = [
  string, // browser (using shorthand)
  string, // version
  string, // release date
  string?, // engine version
];

export type Timeline = {
  [date: string]: TimelineEntry;
};

export type CondensedTimeline = {
  [date: string]: CondensedTimelineEntry[];
};

const incrementDate = (dateString: string): string => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const getChangedBrowserVersions = (
  previousVersions: BrowserVersion[],
  currentVersions: BrowserVersion[],
) => {
  const changed: BrowserVersion[] = [];

  currentVersions.forEach((curr) => {
    if (
      previousVersions.find(
        (prev) => prev.browser === curr.browser && prev.version != curr.version,
      )
    ) {
      changed.push(curr);
    }
  });

  return changed;
};

const nameMappings: Record<string, string> = {
  chrome: "c",
  chrome_android: "ca",
  edge: "e",
  firefox: "f",
  firefox_android: "fa",
  safari: "s",
  safari_ios: "si",
  webview_android: "wva",
  samsunginternet_android: "sa",
  opera_android: "oa",
  opera: "o",
  kai_os: "k",
  ya_android: "y",
  uc_android: "u",
  qq_android: "q",
  facebook_android: "fb",
  instagram_android: "ia",
};

const createTimeline = () => {
  const preBaselineVersions = getCoreVersionsByDate(
    new Date("2002-01-01"),
    true,
  ).filter(
    (version) =>
      version.release_date &&
      new Date(version.release_date) < new Date("2015-07-29"),
  );

  let previousDateString = "2015-07-29";
  let currentDateString = "2015-07-30";
  const todayString = new Date().toISOString().slice(0, 10);

  const previousDateCoreVersions = getCoreVersionsByDate(
    new Date(previousDateString),
  );
  const previousDateVersions = [
    ...previousDateCoreVersions,
    ...getDownstreamBrowsers(previousDateCoreVersions, false, true),
  ];

  const timeline: Timeline = {
    pre_baseline: preBaselineVersions,
    "2015-07-29": previousDateVersions,
  };

  while (new Date(currentDateString) <= new Date(todayString)) {
    const previousDateCoreVersions = getCoreVersionsByDate(
      new Date(previousDateString),
    );
    const previousDateVersions = [
      ...previousDateCoreVersions,
      ...getDownstreamBrowsers(previousDateCoreVersions, false, true),
    ];

    const currentDateCoreVersions = getCoreVersionsByDate(
      new Date(currentDateString),
    );

    const currentDateVersions = [
      ...currentDateCoreVersions,
      ...getDownstreamBrowsers(currentDateCoreVersions, false, true),
    ];

    if (currentDateString.endsWith("-12-31")) {
      timeline[currentDateString] = currentDateVersions;
    } else if (
      JSON.stringify(previousDateVersions) !=
      JSON.stringify(currentDateVersions)
    ) {
      let changedBrowserVersions = getChangedBrowserVersions(
        previousDateVersions,
        currentDateVersions,
      );
      timeline[currentDateString] = changedBrowserVersions;
    }

    previousDateString = currentDateString;
    currentDateString = incrementDate(currentDateString);
  }

  // nameMappings is now defined at the top level

  const condensedTimeline: CondensedTimeline = {};

  Object.entries(timeline).forEach(([date, versions]) => {
    condensedTimeline[date] = versions.map((version) => {
      const outputEntry: CondensedTimelineEntry = [
        nameMappings[version.browser],
        version.version,
        normalizeReleaseDate(version.release_date),
      ];
      if (version.engine_version) {
        outputEntry.push(version.engine_version);
      }
      return outputEntry;
    });
  });

  return condensedTimeline;
};
const timeline = createTimeline();
let timelineString = ``;
const versionsInTimeline: Record<string, Set<string>> = {};

Object.entries(timeline).forEach(([changeDate, changes]) => {
  timelineString += `${changeDate.replace(/-/g, "")}\n`;
  changes.forEach((change) => {
    const [shortName, version] = change;
    if (!versionsInTimeline[shortName]) {
      versionsInTimeline[shortName] = new Set();
    }
    versionsInTimeline[shortName].add(version);

    timelineString += `${change[0]},${change[1]},${change[2]}`;
    if (change[3]) {
      timelineString += `,${change[3]}`;
    }
    timelineString += `\n`;
  });
});

const allReleases: Record<string, BrowserVersion[]> = {};

// Core browsers
coreBrowserData.forEach(([browserName, browserData]) => {
  allReleases[browserName] = [];
  const shortName = nameMappings[browserName] ?? browserName;
  Object.entries(browserData.releases).forEach(([version, releaseData]) => {
    if (acceptableStatuses.includes(releaseData.status)) {
      if (!versionsInTimeline[shortName]?.has(version)) {
        allReleases[browserName].push({
          browser: browserName,
          version: version,
          release_date: normalizeReleaseDate(releaseData.release_date),
        });
      }
    }
  });
  allReleases[browserName].sort((a, b) =>
    compareVersions(a.version, b.version),
  );
});

// Downstream browsers
downstreamBrowserData.forEach(([browserName, browserData]) => {
  if (!browserData.releases) return;
  allReleases[browserName] = [];
  const shortName = nameMappings[browserName] ?? browserName;
  Object.entries(browserData.releases).forEach(([version, releaseData]) => {
    const { status, engine, engine_version } = releaseData;
    if (status && !acceptableStatuses.includes(status)) {
      return;
    }
    if (
      engine &&
      engine_version &&
      (engine === "Blink" || engine === "Gecko")
    ) {
      if (!versionsInTimeline[shortName]?.has(version)) {
        allReleases[browserName].push({
          browser: browserName,
          version: version,
          release_date: normalizeReleaseDate(releaseData.release_date),
          engine: engine,
          engine_version: engine_version,
        });
      }
    }
  });
  allReleases[browserName].sort((a, b) =>
    compareVersions(a.version, b.version),
  );
});

timelineString += `releases\n`;
Object.entries(allReleases).forEach(([browserName, versions]) => {
  const shortName = nameMappings[browserName] ?? browserName;
  versions.forEach((version) => {
    timelineString += `${shortName},${version.version},${version.release_date}`;
    if (version.engine_version) {
      timelineString += `,${version.engine_version}`;
    }
    timelineString += `\n`;
  });
});

const now = new Date().getTime();
writeFileSync(
  "./src/data/timeline.js",
  `const timelineString = \`${timelineString}\`;const lastUpdated = ${now};export {timelineString, lastUpdated}`,
);
