const bcdBrowsers = await fetch(
  "https://unpkg.com/@mdn/browser-compat-data",
).then((response) => response.json());

const features = await fetch("https://unpkg.com/web-features/data.json")
  .then((response) => response.json())
  .then((data) => data.features);

const otherBrowsers = await fetch(
  "https://unpkg.com/baseline-browser-mapping/dist/data/downstream-browsers.json",
).then((response) => response.json());

const bcdCoreBrowserNames: string[] = [
  "chrome",
  "chrome_android",
  "edge",
  "firefox",
  "firefox_android",
  "safari",
  "safari_ios",
];

type WebFeature = {
  compat_features: string[];
  description: string;
  description_html: string;
  group: string;
  name: string;
  spec: string;
  status: {
    baseline: string;
    baseline_low_date?: string;
    baseline_hight_date?: string;
    support: object;
  };
};

type Features = WebFeature[];

type BrowserData = {
  [key: string]: {
    releases: {
      [key: string]: {
        status: string;
        release_date?: string;
      };
    };
  };
};

type Browser = {
  name: string;
  releases: {
    [version: string]: {
      status: string;
      release_date?: string;
      engine?: string;
      engine_version?: string;
    };
  };
};

type BrowserVersion = {
  browser: string;
  version: string;
  release_date: string;
  engine?: string;
  engine_version?: string;
};

interface AllBrowsersBrowserVersion extends BrowserVersion {
  year: number;
  supports?: string;
  wa_compatible?: boolean;
}

type NestedBrowserVersions = {
  [browser: string]: {
    [version: string]: AllBrowsersBrowserVersion;
  };
};

type Feature = {
  id: string;
  name: string;
  baseline_low_date: string;
  support: object;
};

const coreBrowserData: [string, Browser][] = Object.entries(
  bcdBrowsers.browsers as BrowserData,
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
  ...(Object.entries(bcdBrowsers.browsers as BrowserData).filter(
    ([browserName]) => bcdDownstreamBrowserNames.includes(browserName),
  ) as [string, Browser][]),
  ...(Object.entries(otherBrowsers.browsers as BrowserData) as [
    string,
    Browser,
  ][]),
];

const acceptableStatuses: string[] = [
  "current",
  "esr",
  "retired",
  "unknown",
  "beta",
  "nightly",
];
let suppressPre2016Warning: boolean = false;

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
  incomingVersionString: string,
  previousVersionString: string,
): number => {
  if (incomingVersionString === previousVersionString) {
    return 0;
  }

  let [incomingVersionStringMajor, incomingVersionStringMinor] =
    incomingVersionString.split(".");
  let [previousVersionStringMajor, previousVersionStringMinor] =
    previousVersionString.split(".");

  if (!incomingVersionStringMajor || !previousVersionStringMajor) {
    throw new Error(
      "One of these version strings is broken: " +
      incomingVersionString +
      " or " +
      previousVersionString +
      "",
    );
  }

  if (
    parseInt(incomingVersionStringMajor) > parseInt(previousVersionStringMajor)
  ) {
    return 1;
  }

  if (incomingVersionStringMinor) {
    if (
      parseInt(incomingVersionStringMajor) ==
      parseInt(previousVersionStringMajor) &&
      (!previousVersionStringMinor ||
        parseInt(incomingVersionStringMinor) >
        parseInt(previousVersionStringMinor))
    ) {
      return 1;
    }
  }
  return -1;
};

const getCompatibleFeaturesByDate = (date: Date): Feature[] => {
  const compatibleFeatures = new Array();
  Object.entries(features as WebFeature[]).forEach(([feature_id, feature]) => {
    if (
      feature.status.baseline_low_date &&
      new Date(feature.status.baseline_low_date) <= date
    ) {
      compatibleFeatures.push({
        id: feature_id,
        name: feature.name,
        baseline_low_date: feature.status.baseline_low_date,
        support: feature.status.support,
      });
    }
  });
  return compatibleFeatures;
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
          if (!acceptableStatuses.includes(versionData.status)) {
            return false;
          }
          return true;
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
  if (date.getFullYear() < 2016 && !suppressPre2016Warning) {
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
): BrowserVersion[] => {
  let minimumChromeVersion: string | undefined = undefined;
  if (inputArray && inputArray.length > 0) {
    minimumChromeVersion = inputArray
      .filter((browser: BrowserVersion) => browser.browser === "chrome")
      .sort((a: BrowserVersion, b: BrowserVersion) => {
        return compareVersions(a.version, b.version);
      })[0]?.version;
  }

  if (!minimumChromeVersion) {
    throw new Error(
      "There are no browser versions compatible with Baseline before Chrome",
    );
  }

  let downstreamArray: BrowserVersion[] = new Array();

  downstreamBrowserData.forEach(([browserName, browserData]) => {
    if (!browserData.releases) return;
    let sortedAndFilteredVersions = Object.entries(browserData.releases)
      .filter(([, versionData]) => {
        if (!versionData.engine) {
          return false;
        }
        if (versionData.engine != "Blink") {
          return false;
        }
        if (
          versionData.engine_version &&
          parseInt(versionData.engine_version) < parseInt(minimumChromeVersion!)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        return compareVersions(a[0], b[0]);
      });

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
   * Pass a year between 2016 and the current year to get browser versions compatible with all
   * Newly Available features as of the end of the year specified.
   * > NOTE: cannot be used with `widelyAvailableOnDate`.
   */
  targetYear?: number;
};

/**
 * Returns browser versions compatible with specified Baseline targets.
 * Defaults to returning the minimum versions of the core browser set that support Baseline Widely available.
 * Takes an optional configuraation object `Object` with four optional properties:
 * - `listAllCompatibleVersions`: `false` (default) or `false`
 * - `includeDownstreamBrowsers`: `false` (default) or `false`
 * - `widelyAvailableOnDate`: date in format `YYYY-MM-DD`
 * - `targetYear`: year in format `YYYY`
 */
export function getCompatibleVersions(userOptions?: Options): BrowserVersion[] {
  suppressPre2016Warning = true;

  let incomingOptions = userOptions ?? {};

  let options: Options = {
    listAllCompatibleVersions:
      incomingOptions.listAllCompatibleVersions ?? false,
    includeDownstreamBrowsers:
      incomingOptions.includeDownstreamBrowsers ?? false,
    widelyAvailableOnDate: incomingOptions.widelyAvailableOnDate ?? undefined,
    targetYear: incomingOptions.targetYear ?? undefined,
  };

  let targetDate: Date = new Date();

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

  if (options.includeDownstreamBrowsers === false) {
    return coreBrowserArray;
  } else {
    return [
      ...coreBrowserArray,
      ...getDownstreamBrowsers(
        coreBrowserArray,
        options.listAllCompatibleVersions,
      ),
    ];
  }
}

type AllVersionsOptions = {
  /**
   * Whether to return the output as a Javascript `Array` (`array`) or a CSV string (`csv`).
   * Defaults to `array`.
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
};

/**
 * Returns all browser versions known to this module with their level of Baseline support either as an `Array` or a `String` CSV.
 * Takes an object as an argument with two optional properties:
 * - `includeDownstreamBrowsers`: `true` (default) or `false`
 * - `outputFormat`: `array` (default), `object` or `csv`
 */
export function getAllVersions(
  userOptions?: AllVersionsOptions,
): AllBrowsersBrowserVersion[] | NestedBrowserVersions | string {
  let incomingOptions = userOptions ?? {};

  let options: AllVersionsOptions = {
    outputFormat: incomingOptions.outputFormat ?? "array",
    includeDownstreamBrowsers:
      incomingOptions.includeDownstreamBrowsers ?? false,
    useSupports: incomingOptions.useSupports ?? false,
  };

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

  const outputArray: AllBrowsersBrowserVersion[] = new Array();

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
          let isWaCcompatible =
            compareVersions(version.version, waVersion) >= 0 ? true : false;
          let isNaCompatible =
            compareVersions(version.version, naVersion) >= 0 ? true : false;

          let versionToPush: AllBrowsersBrowserVersion = {
            ...version,
            year: year <= 2015 ? 0 : year - 1,
          };

          if (options.useSupports) {
            let supports = "year_only";
            if (isWaCcompatible && isNaCompatible) supports = "newly";
            if (isWaCcompatible && !isNaCompatible) supports = "widely";
            versionToPush = {
              ...versionToPush,
              supports: supports,
            };
          } else {
            versionToPush = {
              ...versionToPush,
              wa_compatible: isWaCcompatible,
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
    let downstreamBrowsers = getDownstreamBrowsers(outputArray);

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
    if (a.year < b.year) {
      return -1;
    } else if (a.browser > b.browser) {
      return 1;
    } else {
      return compareVersions(a.version, b.version);
    }
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
      //@ts-ignore
      outputObject[version.browser][version.version] = options.useSupports
        ? { ...versionToAdd, supports: version.supports }
        : { ...versionToAdd, wa_compatible: version.wa_compatible };
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
        year: number;
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
        ? { ...outputs, supports: version.supports }
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
