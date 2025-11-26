import {
  features,
  bcdBrowsers,
  otherBrowsers,
  lastUpdated,
} from "./scripts/expose-data.js";
import process from "process";

try {
  // @ts-ignore
  if (typeof process.loadEnvFile === "function") {
    // @ts-ignore
    process.loadEnvFile();
  }
} catch (e) {
  // ignore
}

let hasWarned = false;
// let browserslistIgnoreOldData =
//   process.env.BROWSERSLIST_IGNORE_OLD_DATA === "true";
// let bbmIgnoreOldData =
//   process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA === "true";

// console.log(browserslistIgnoreOldData);
// console.log(bbmIgnoreOldData);

const checkUpdate = (targetDate: Date) => {
  if (
    hasWarned ||
    process.env.BROWSERSLIST_IGNORE_OLD_DATA ||
    process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA
  ) {
    return;
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  if (targetDate > sixMonthsAgo && lastUpdated < sixMonthsAgo.getTime()) {
    console.warn(
      "[baseline-browser-mapping] The data in this module is over six months old. To ensure accurate Baseline data, please update: `npm i baseline-browser-mapping@latest -D`",
    );
    hasWarned = true;
  }
};

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

type BrowserVersion = {
  browser: string;
  version: string;
  release_date?: string;
  engine?: string;
  engine_version?: string;
};

interface AllBrowsersBrowserVersion extends BrowserVersion {
  year: number | string;
  supports?: string;
  wa_compatible?: boolean;
}

type NestedBrowserVersions = {
  [browser: string]: {
    [version: string]: AllBrowsersBrowserVersion;
  };
};

type Feature = {
  baseline_low_date: string;
  support: object;
};

const coreBrowserData: [string, Browser][] = Object.entries(
  bcdBrowsers as BrowserData,
).filter(([browserName]) => bcdCoreBrowserNames.includes(browserName)) as [
  string,
  Browser,
][];

type versionsObject = {
  [browser: string]: BrowserVersion;
};

type YearVersions = {
  [year: string]: versionsObject;
};

const bcdDownstreamBrowserNames: string[] = [
  "webview_android",
  "samsunginternet_android",
  "opera_android",
  "opera",
];
const downstreamBrowserData: [string, Browser][] = [
  ...(Object.entries(bcdBrowsers as BrowserData).filter(([browserName]) =>
    bcdDownstreamBrowserNames.includes(browserName),
  ) as [string, Browser][]),
  ...(Object.entries(otherBrowsers as BrowserData) as [string, Browser][]),
];

const acceptableStatuses: string[] = [
  "current",
  "esr",
  "retired",
  "unknown",
  "beta",
  "nightly",
];
let suppressPre2015Warning: boolean = false;

const kaiOSWarning = (options: Options | AllVersionsOptions) => {
  if (
    options.includeDownstreamBrowsers === false &&
    options.includeKaiOS === true
  ) {
    console.log(
      new Error(
        "KaiOS is a downstream browser and can only be included if you include other downstream browsers. Please ensure you use `includeDownstreamBrowsers: true`.",
      ),
    );
    process.exit(1);
  }
};

const stripLTEPrefix = (str: string): string => {
  if (!str) {
    return str;
  }
  if (!str.startsWith("≤")) {
    return str;
  }
  return str.slice(1);
};

const compareVersions = (
  nextVersion: string,
  prevVersion: string,
): 1 | 0 | -1 => {
  if (nextVersion === prevVersion) {
    return 0;
  }

  const [nextMajor = 0, nextMinor = 0] = nextVersion.split(".", 2).map(Number);
  const [prevMajor = 0, prevMinor = 0] = prevVersion.split(".", 2).map(Number);

  if (isNaN(nextMajor) || isNaN(nextMinor)) {
    throw new Error(`Invalid version: ${nextVersion}`);
  }
  if (isNaN(prevMajor) || isNaN(prevMinor)) {
    throw new Error(`Invalid version: ${prevVersion}`);
  }

  if (nextMajor !== prevMajor) {
    return nextMajor > prevMajor ? 1 : -1;
  }
  if (nextMinor !== prevMinor) {
    return nextMinor > prevMinor ? 1 : -1;
  }
  return 0;
};

const getCompatibleFeaturesByDate = (date: Date): Feature[] => {
  return features
    .filter(
      (feature) =>
        feature.status.baseline_low_date &&
        new Date(feature.status.baseline_low_date) <= date,
    )
    .map((feature) => {
      return {
        baseline_low_date: feature.status.baseline_low_date as string,
        support: feature.status.support,
      };
    });
};

const getMinimumVersionsFromFeatures = (
  features: Feature[],
): BrowserVersion[] => {
  let minimumVersions: { [key: string]: BrowserVersion } = {};

  Object.entries(coreBrowserData).forEach(([, browserData]) => {
    minimumVersions[browserData[0]] = {
      browser: browserData[0],
      version: "0",
      release_date: "",
    };
  });

  features.forEach((feature) => {
    Object.entries(feature.support).forEach((browser) => {
      const browserName = browser[0];
      const version = stripLTEPrefix(browser[1]);
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
          release_date: feature.baseline_low_date,
        };
      }
    });
  });

  return Object.values(minimumVersions);
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
      let sortedVersions = Object.entries(bcdBrowser[1].releases)
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
              : "unknown",
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
  if (date.getFullYear() < 2015 && !suppressPre2015Warning) {
    console.warn(
      new Error(
        "There are no browser versions compatible with Baseline before 2015.  You may receive unexpected results.",
      ),
    );
  }

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
      let sortedAndFilteredVersions = Object.entries(browserData.releases)
        .filter(([, versionData]) => {
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
        .sort((a, b) => compareVersions(a[0], b[0]));

      for (let i = 0; i < sortedAndFilteredVersions.length; i++) {
        const versionEntry = sortedAndFilteredVersions[i];
        if (versionEntry) {
          const [versionNumber, versionData] = versionEntry;
          let outputArray: BrowserVersion = {
            browser: browserName,
            version: versionNumber,
            release_date: versionData.release_date ?? "unknown",
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

type Options = {
  /**
   * Whether to include only the minimum compatible browser versions or all compatible versions.
   * Defaults to `false`.
   */
  listAllCompatibleVersions?: boolean;
  /**
   * Whether to include browsers that use the same engines as a core Baseline browser.
   * Defaults to `false`.
   */
  includeDownstreamBrowsers?: boolean;
  /**
   * Pass a date in the format 'YYYY-MM-DD' to get versions compatible with Widely available on the specified date.
   * If left undefined and a `targetYear` is not passed, defaults to Widely available as of the current date.
   * > NOTE: cannot be used with `targetYear`.
   */
  widelyAvailableOnDate?: string | number;
  /**
   * Pass a year between 2015 and the current year to get browser versions compatible with all
   * Newly Available features as of the end of the year specified.
   * > NOTE: cannot be used with `widelyAvailableOnDate`.
   */
  targetYear?: number;
  /**
   * Pass a boolean that determines whether KaiOS is included in browser mappings.  KaiOS implements
   * the Gecko engine used in Firefox.  However, KaiOS also has a different interaction paradigm to
   * other browsers and requires extra consideration beyond simple feature compatibility to provide
   * an optimal user experience.  Defaults to `false`.
   */
  includeKaiOS?: boolean;
};

/**
 * Returns browser versions compatible with specified Baseline targets.
 * Defaults to returning the minimum versions of the core browser set that support Baseline Widely available.
 * Takes an optional configuration `Object` with four optional properties:
 * - `listAllCompatibleVersions`: `false` (default) or `false`
 * - `includeDownstreamBrowsers`: `false` (default) or `false`
 * - `widelyAvailableOnDate`: date in format `YYYY-MM-DD`
 * - `targetYear`: year in format `YYYY`
 */
export function getCompatibleVersions(userOptions?: Options): BrowserVersion[] {
  let incomingOptions = userOptions ?? {};

  let options: Options = {
    listAllCompatibleVersions:
      incomingOptions.listAllCompatibleVersions ?? false,
    includeDownstreamBrowsers:
      incomingOptions.includeDownstreamBrowsers ?? false,
    widelyAvailableOnDate: incomingOptions.widelyAvailableOnDate ?? undefined,
    targetYear: incomingOptions.targetYear ?? undefined,
    includeKaiOS: incomingOptions.includeKaiOS ?? false,
  };

  let targetDate: Date = new Date();

  kaiOSWarning(options);

  if (!options.widelyAvailableOnDate && !options.targetYear) {
    targetDate = new Date();
  } else if (options.targetYear && options.widelyAvailableOnDate) {
    console.log(
      new Error(
        "You cannot use targetYear and widelyAvailableOnDate at the same time.  Please remove one of these options and try again.",
      ),
    );
    process.exit(1);
  } else if (options.widelyAvailableOnDate) {
    targetDate = new Date(options.widelyAvailableOnDate);
  } else if (options.targetYear) {
    targetDate = new Date(`${options.targetYear}-12-31`);
  }

  // Sets a cutoff date for feature interoperability 30 months before the stated date
  if (options.widelyAvailableOnDate || options.targetYear === undefined) {
    targetDate.setMonth(targetDate.getMonth() - 30);
  }

  let coreBrowserArray = getCoreVersionsByDate(
    targetDate,
    options.listAllCompatibleVersions,
  );

  checkUpdate(targetDate);

  if (options.includeDownstreamBrowsers === false) {
    return coreBrowserArray;
  } else {
    return [
      ...coreBrowserArray,
      ...getDownstreamBrowsers(
        coreBrowserArray,
        options.listAllCompatibleVersions,
        options.includeKaiOS,
      ),
    ];
  }
}

type AllVersionsOptions = {
  /**
   * Whether to return the output as a JavaScript `Array` (`"array"`), `Object` (`"object"`) or a CSV string (`"csv"`).
   * Defaults to `"array"`.
   */
  outputFormat?: string;
  /**
   * Whether to include browsers that use the same engines as a core Baseline browser.
   * Defaults to `false`.
   */
  includeDownstreamBrowsers?: boolean;
  /**
   * Whether to use the new "supports" property in place of "wa_compatible"
   * Defaults to `false`
   */
  useSupports?: boolean;
  /**
   * Whether to include KaiOS in the output. KaiOS implements the Gecko engine used in Firefox.
   * However, KaiOS also has a different interaction paradigm to other browsers and requires extra
   * consideration beyond simple feature compatibility to provide an optimal user experience.
   */
  includeKaiOS?: boolean;
};

/**
 * Returns all browser versions known to this module with their level of Baseline support as a JavaScript `Array` (`"array"`), `Object` (`"object"`) or a CSV string (`"csv"`).
 * Takes an optional configuration `Object` with three optional properties:
 * - `includeDownstreamBrowsers`: `true` (default) or `false`
 * - `outputFormat`: `"array"` (default), `"object"` or `"csv"`
 * - `useSupports`: `false` (default) or `true`, replaces `wa_compatible` property with optional `supports` property which returns `widely` or `newly` available when present.
 */
export function getAllVersions(
  userOptions?: AllVersionsOptions,
): AllBrowsersBrowserVersion[] | NestedBrowserVersions | string {
  suppressPre2015Warning = true;

  let incomingOptions = userOptions ?? {};

  let options: AllVersionsOptions = {
    outputFormat: incomingOptions.outputFormat ?? "array",
    includeDownstreamBrowsers:
      incomingOptions.includeDownstreamBrowsers ?? false,
    useSupports: incomingOptions.useSupports ?? false,
    includeKaiOS: incomingOptions.includeKaiOS ?? false,
  };

  kaiOSWarning(options);

  let nextYear = new Date().getFullYear() + 1;

  const yearArray = [...Array(nextYear).keys()].slice(2002);
  const yearMinimumVersions: YearVersions = {};
  yearArray.forEach((year: number) => {
    yearMinimumVersions[year] = {};
    getCompatibleVersions({ targetYear: year }).forEach((version) => {
      if (yearMinimumVersions[year])
        yearMinimumVersions[year][version.browser] = version;
    });
  });

  const waMinimumVersions = getCompatibleVersions({});
  const waObject: versionsObject = {};
  waMinimumVersions.forEach((version: BrowserVersion) => {
    waObject[version.browser] = version;
  });

  const thirtyMonthsFromToday = new Date();
  thirtyMonthsFromToday.setMonth(thirtyMonthsFromToday.getMonth() + 30);
  const naMinimumVersions = getCompatibleVersions({
    widelyAvailableOnDate: thirtyMonthsFromToday.toISOString().slice(0, 10),
  });

  const naObject: versionsObject = {};
  naMinimumVersions.forEach((version: BrowserVersion) => {
    naObject[version.browser] = version;
  });

  const allVersions = getCompatibleVersions({
    targetYear: 2002,
    listAllCompatibleVersions: true,
  });

  const outputArray: AllBrowsersBrowserVersion[] = [];

  bcdCoreBrowserNames.forEach((browserName) => {
    let thisBrowserAllVersions = allVersions
      .filter((version) => version.browser == browserName)
      .sort((a, b) => {
        return compareVersions(a.version, b.version);
      });

    let waVersion = waObject[browserName]?.version ?? "0";
    let naVersion = naObject[browserName]?.version ?? "0";

    yearArray.forEach((year) => {
      if (yearMinimumVersions[year]) {
        let minBrowserVersionInfo = yearMinimumVersions[year][browserName] ?? {
          version: "0",
        };
        let minBrowserVersion = minBrowserVersionInfo.version;
        let sliceIndex = thisBrowserAllVersions.findIndex(
          (element) =>
            compareVersions(element.version, minBrowserVersion) === 0,
        );

        let subArray =
          year === nextYear - 1
            ? thisBrowserAllVersions
            : thisBrowserAllVersions.slice(0, sliceIndex);

        subArray.forEach((version) => {
          let isWaCompatible = compareVersions(version.version, waVersion) >= 0;
          let isNaCompatible = compareVersions(version.version, naVersion) >= 0;

          let versionToPush: AllBrowsersBrowserVersion = {
            ...version,
            year: year <= 2015 ? "pre_baseline" : year - 1,
          };

          if (options.useSupports) {
            if (isWaCompatible) versionToPush.supports = "widely";
            if (isNaCompatible) versionToPush.supports = "newly";
          } else {
            versionToPush = {
              ...versionToPush,
              wa_compatible: isWaCompatible,
            };
          }

          outputArray.push(versionToPush);
        });

        thisBrowserAllVersions = thisBrowserAllVersions.slice(
          sliceIndex,
          thisBrowserAllVersions.length,
        );
      }
    });
  });

  if (options.includeDownstreamBrowsers) {
    let downstreamBrowsers = getDownstreamBrowsers(
      outputArray,
      true,
      options.includeKaiOS,
    );

    downstreamBrowsers.forEach((version: BrowserVersion) => {
      let correspondingChromiumVersion = outputArray.find(
        (upstreamVersion) =>
          upstreamVersion.browser === "chrome" &&
          upstreamVersion.version === version.engine_version,
      );
      if (correspondingChromiumVersion) {
        if (options.useSupports) {
          outputArray.push({
            ...version,
            year: correspondingChromiumVersion.year,
            supports: correspondingChromiumVersion.supports,
          });
        } else {
          outputArray.push({
            ...version,
            year: correspondingChromiumVersion.year,
            wa_compatible: correspondingChromiumVersion.wa_compatible,
          });
        }
      }
    });
  }

  outputArray.sort((a, b) => {
    // Sort by year: "pre_baseline" first, then numerical year in ascending order
    if (a.year === "pre_baseline" && b.year !== "pre_baseline") {
      return -1;
    }
    if (b.year === "pre_baseline" && a.year !== "pre_baseline") {
      return 1;
    }
    if (a.year !== "pre_baseline" && b.year !== "pre_baseline") {
      if (a.year < b.year) {
        return -1;
      }
      if (a.year > b.year) {
        return 1;
      }
    }

    // Sort by browser alphabetically
    if (a.browser < b.browser) {
      return -1;
    }
    if (a.browser > b.browser) {
      return 1;
    }

    // Sort by version using compareVersions
    return compareVersions(a.version, b.version);
  });

  if (options.outputFormat === "object") {
    const outputObject: NestedBrowserVersions = {};

    outputArray.forEach((version: AllBrowsersBrowserVersion) => {
      if (!outputObject[version.browser]) {
        outputObject[version.browser] = {};
      }
      let versionToAdd = {
        year: version.year,
        release_date: version.release_date,
        engine: version.engine,
        engine_version: version.engine_version,
      };

      if (options.useSupports) {
        //@ts-ignore
        outputObject[version.browser][version.version] = version.supports
          ? { ...versionToAdd, supports: version.supports }
          : versionToAdd;
      } else {
        //@ts-ignores
        outputObject[version.browser][version.version] = {
          ...versionToAdd,
          wa_compatible: version.wa_compatible,
        };
      }
    });

    return outputObject ?? {};
  }

  if (options.outputFormat === "csv") {
    let outputString =
      `"browser","version","year",` +
      `"${options.useSupports ? "supports" : "wa_compatible"}",` +
      `"release_date","engine","engine_version"`;

    outputArray.forEach((version) => {
      let outputs: {
        browser: string;
        version: string;
        year: number | string;
        release_date: string;
        engine: string;
        engine_version: string;
        supports?: string;
        wa_compatible?: boolean;
      } = {
        browser: version.browser,
        version: version.version,
        year: version.year,
        release_date: version.release_date ?? "NULL",
        engine: version.engine ?? "NULL",
        engine_version: version.engine_version ?? "NULL",
      };

      outputs = options.useSupports
        ? { ...outputs, supports: version.supports ?? "" }
        : { ...outputs, wa_compatible: version.wa_compatible };

      outputString +=
        `\n"${outputs.browser}","` +
        `${outputs.version}","` +
        `${outputs.year}","` +
        `${options.useSupports ? outputs.supports : outputs.wa_compatible}","` +
        `${outputs.release_date}","` +
        `${outputs.engine}","` +
        `${outputs.engine_version}"`;
    });

    return outputString;
  }

  return outputArray;
}
