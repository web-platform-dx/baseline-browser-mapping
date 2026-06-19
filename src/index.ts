import {
  CondensedTimeline,
  CondensedTimelineEntry,
  lastUpdated,
  timelineString,
} from "./data/timeline.js";

const timeline: CondensedTimeline = {};

let changeDate = "";

timelineString.split("\n").forEach((line) => {
  if (!line) {
    return;
  }
  if (line.startsWith("20")) {
    line = line.trim();
    changeDate = line;
    timeline[changeDate] = [];
    return;
  } else {
    const parts = line.split(",");
    if (parts.length >= 3) {
      const [shortName, version, releaseDate, engineVersion] = parts;
      const entry: CondensedTimelineEntry = [
        shortName! as any,
        version!,
        releaseDate!.trim(),
      ];
      if (engineVersion) {
        entry.push(engineVersion.trim());
      }
      if (!timeline[changeDate]) {
        throw new Error(
          `Timeline entry for date ${changeDate} is undefined. This should not happen.`,
        );
      }
      timeline[changeDate]!.push(entry);
    }
  }
});

let hasWarned = false;

export function _resetHasWarned() {
  hasWarned = false;
}

const checkUpdate = (targetDate: Date, lastUpdatedOverride?: number) => {
  if (
    hasWarned ||
    (typeof process !== "undefined" &&
      process.env &&
      (process.env.BROWSERSLIST_IGNORE_OLD_DATA ||
        process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA))
  ) {
    return;
  }

  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const lastUpdatedToUse = lastUpdatedOverride ?? lastUpdated;

  if (targetDate > twoMonthsAgo && lastUpdatedToUse < twoMonthsAgo.getTime()) {
    console.warn(
      "[baseline-browser-mapping] The data in this module is over two months old and you are targetting a recent feature cut off date of " +
        targetDate.toISOString().slice(0, 10) +
        ". To ensure accurate Baseline data, please update to the latest version of this module using the package manager of your choice." +
        "You can suppress these warnings using the environment variables `BROWSERSLIST_IGNORE_OLD_DATA=true` or `BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA=true` or by passing `suppressWarnings: true` when you call `getCompatibleVersions()` or `getAllVersions()`.",
    );
    hasWarned = true;
  }
};

const nameMappings: {
  [shortName: string]: { longName: string; engine?: string };
} = {
  c: { longName: "chrome" },
  ca: { longName: "chrome_android" },
  e: { longName: "edge" },
  f: { longName: "firefox" },
  fa: { longName: "firefox_android" },
  s: { longName: "safari" },
  si: { longName: "safari_ios" },
  o: { longName: "opera", engine: "Blink" },
  oa: { longName: "opera_android", engine: "Blink" },
  sa: { longName: "samsunginternet_android", engine: "Blink" },
  wva: { longName: "webview_android", engine: "Blink" },
  y: { longName: "ya_android", engine: "Blink" },
  u: { longName: "uc_android", engine: "Blink" },
  q: { longName: "qq_android", engine: "Blink" },
  k: { longName: "kai_os", engine: "Gecko" },
  fb: { longName: "facebook_android", engine: "Blink" },
  ia: { longName: "instagram_android", engine: "Blink" },
};

const coreBrowsers = Object.entries(nameMappings)
  .filter(([, { engine }]) => engine === undefined)
  .map(([shortName, { longName }]) => {
    return { shortName: shortName, longName: longName };
  });

type BrowserVersion = {
  browser: string;
  version: string;
  release_date?: string;
  engine?: string;
  engine_version?: string;
};

type NestedBrowserVersions = {
  [browser: string]: {
    [version: string]: AllBrowsersBrowserVersion;
  };
};

interface AllBrowsersBrowserVersion extends BrowserVersion {
  year: number | string;
  supports?: string;
  wa_compatible?: boolean;
}

type versionsObject = {
  [browser: string]: BrowserVersion;
};

type YearVersions = {
  [year: string]: versionsObject;
};

let suppressPre2015Warning: boolean = false;

const kaiOSWarning = (
  // options: Options | AllVersionsOptions
  options: Options,
) => {
  if (
    options.includeDownstreamBrowsers === false &&
    options.includeKaiOS === true
  ) {
    throw new Error(
      "KaiOS is a downstream browser and can only be included if you include other downstream browsers. Please ensure you use `includeDownstreamBrowsers: true`.",
    );
  }
};

const reconstructBrowserVersion = (
  shortName: string,
  longName: string,
  version: string,
  releaseDate: string,
  engineVersion?: string,
) => {
  const browserVersion: BrowserVersion = {
    browser: longName,
    version: version,
    release_date: releaseDate,
  };
  if (engineVersion) {
    browserVersion.engine_version = engineVersion;
    browserVersion.engine = nameMappings[shortName]?.engine;
  }
  return browserVersion;
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
  overrideLastUpdated?: number;
  /**
   * Pass a boolean to suppress the warning about stale data.
   * Defaults to `false`.
   */
  suppressWarnings?: boolean;
};

/**
 * Returns browser versions compatible with specified Baseline targets.
 * Defaults to returning the minimum versions of the core browser set that support Baseline Widely available.
 * Takes an optional configuration `Object` with four optional properties:
 * - `listAllCompatibleVersions`: `false` (default) or `true`
 * - `includeDownstreamBrowsers`: `false` (default) or `true`
 * - `widelyAvailableOnDate`: date in format `YYYY-MM-DD`
 * - `targetYear`: year in format `YYYY`
 * - `supressWarnings`: `false` (default) or `true`
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
    overrideLastUpdated: incomingOptions.overrideLastUpdated ?? undefined,
    suppressWarnings: incomingOptions.suppressWarnings ?? false,
  };

  let targetDate: Date = new Date();

  if (!options.widelyAvailableOnDate && !options.targetYear) {
    targetDate = new Date();
  } else if (options.targetYear && options.widelyAvailableOnDate) {
    throw new Error(
      "You cannot use targetYear and widelyAvailableOnDate at the same time.  Please remove one of these options and try again.",
    );
  } else if (options.widelyAvailableOnDate) {
    targetDate = new Date(options.widelyAvailableOnDate);
  } else if (options.targetYear) {
    targetDate = new Date(`${options.targetYear}-12-31`);
  }

  // Sets a cutoff date for feature interoperability 30 months before the stated date
  if (options.widelyAvailableOnDate || options.targetYear === undefined) {
    targetDate.setMonth(targetDate.getMonth() - 30);
  }

  if (!options.suppressWarnings) {
    checkUpdate(targetDate, options.overrideLastUpdated);
    kaiOSWarning(options);
    if (targetDate.getFullYear() < 2015 && !suppressPre2015Warning) {
      console.warn(
        new Error(
          "There are no browser versions compatible with Baseline before 2015.  You may receive unexpected results.",
        ),
      );
    }

    if (targetDate.getFullYear() < 2002) {
      throw new Error(
        "None of the browsers in the core set were released before 2002.  Please use a date after 2002.",
      );
    }

    if (targetDate.getFullYear() > new Date().getFullYear()) {
      throw new Error(
        "There are no browser versions compatible with Baseline in the future",
      );
    }
  }

  let condensedBrowserVersions: CondensedTimelineEntry[] = [];

  Object.entries(nameMappings).forEach(([shortName]) => {
    const reducedTimeline = Object.entries(timeline).reduce<
      Record<string, CondensedTimelineEntry | undefined>
    >((output, [changeDate, changeList]) => {
      const match = changeList.find((change) => change[0] === shortName);
      if (match) {
        output[changeDate] = match;
      }
      return output;
    }, {});

    if (Object.keys(reducedTimeline).length === 0) {
      return;
    }

    const afterChangeIndex = Object.keys(reducedTimeline).findIndex(
      (changeDate) => new Date(changeDate) > targetDate,
    );

    const beforeChangeDate =
      Object.keys(reducedTimeline)[afterChangeIndex - 1] ?? "2015-07-29";

    if (
      options.listAllCompatibleVersions &&
      reducedTimeline[beforeChangeDate]
    ) {
      const beforeChangeIndex =
        Object.keys(reducedTimeline).indexOf(beforeChangeDate);

      if (beforeChangeIndex !== -1) {
        const entries = Object.values(reducedTimeline)
          .slice(beforeChangeIndex)
          .filter(
            (entry): entry is CondensedTimelineEntry => entry !== undefined,
          );
        condensedBrowserVersions.push(...entries);
      }
    } else {
      const entry = reducedTimeline[beforeChangeDate];
      if (entry) {
        condensedBrowserVersions.push(entry);
      }
    }
  });

  let browsers: BrowserVersion[] = condensedBrowserVersions
    .filter(([shortName]) => {
      if (!options.includeKaiOS && shortName === "k") {
        return false;
      }
      if (
        !options.includeDownstreamBrowsers &&
        coreBrowsers.map((b) => b.shortName).indexOf(shortName) === -1
      ) {
        return false;
      }
      return true;
    })
    .map(([shortName, version, releaseDate, engineVersion]) => {
      const longName = nameMappings[shortName]
        ? nameMappings[shortName].longName
        : shortName;

      let browserVersion = reconstructBrowserVersion(
        shortName,
        longName,
        version,
        releaseDate,
        engineVersion,
      );

      return browserVersion;
    });

  return browsers as BrowserVersion[];
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
  /**
   * Pass a boolean to suppress the warning about old data.
   * Defaults to `false`.
   */
  suppressWarnings?: boolean;
};

/**
 * Returns all browser versions known to this module with their level of Baseline support as a JavaScript `Array` (`"array"`), `Object` (`"object"`) or a CSV string (`"csv"`).
 * Takes an optional configuration `Object` with three optional properties:
 * - `includeDownstreamBrowsers`: `false` (default) or `true`
 * - `outputFormat`: `"array"` (default), `"object"` or `"csv"`
 * - `useSupports`: `false` (default) or `true`, replaces `wa_compatible` property with optional `supports` property which returns `widely` or `newly` available when present.
 * - `supressWarnings`: `false` (default) or `true`
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
    suppressWarnings: incomingOptions.suppressWarnings ?? false,
  };

  kaiOSWarning(options);

  let nextYear = new Date().getFullYear() + 1;

  const yearArray = [...Array(nextYear).keys()].slice(2002);
  const yearMinimumVersions: YearVersions = {};
  yearArray.forEach((year: number) => {
    yearMinimumVersions[year] = {};
    getCompatibleVersions({
      targetYear: year,
      suppressWarnings: options.suppressWarnings,
    }).forEach((version) => {
      if (yearMinimumVersions[year])
        yearMinimumVersions[year][version.browser] = version;
    });
  });

  const waMinimumVersions = getCompatibleVersions({
    suppressWarnings: options.suppressWarnings,
  });
  const waObject: versionsObject = {};
  waMinimumVersions.forEach((version: BrowserVersion) => {
    waObject[version.browser] = version;
  });

  const thirtyMonthsFromToday = new Date();
  thirtyMonthsFromToday.setMonth(thirtyMonthsFromToday.getMonth() + 30);
  const naMinimumVersions = getCompatibleVersions({
    widelyAvailableOnDate: thirtyMonthsFromToday.toISOString().slice(0, 10),
    suppressWarnings: options.suppressWarnings,
  });

  const naObject: versionsObject = {};
  naMinimumVersions.forEach((version: BrowserVersion) => {
    naObject[version.browser] = version;
  });

  const allVersions = getCompatibleVersions({
    targetYear: 2002,
    listAllCompatibleVersions: true,
    suppressWarnings: options.suppressWarnings,
  });

  const outputArray: AllBrowsersBrowserVersion[] = [];

  coreBrowsers
    .map((browser) => browser.longName)
    .forEach((browserName) => {
      let thisBrowserAllVersions = allVersions
        .filter((version) => version.browser == browserName)
        .sort((a, b) => {
          return compareVersions(a.version, b.version);
        });

      let waVersion = waObject[browserName]?.version ?? "0";
      let naVersion = naObject[browserName]?.version ?? "0";

      yearArray.forEach((year) => {
        if (yearMinimumVersions[year]) {
          let minBrowserVersionInfo = yearMinimumVersions[year][
            browserName
          ] ?? {
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
            let isWaCompatible =
              compareVersions(version.version, waVersion) >= 0;
            let isNaCompatible =
              compareVersions(version.version, naVersion) >= 0;

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
    let downstreamBrowsers = getCompatibleVersions({
      listAllCompatibleVersions: true,
      includeDownstreamBrowsers: true,
      includeKaiOS: options.includeKaiOS,
      suppressWarnings: options.suppressWarnings,
    }).filter(
      (version) =>
        !coreBrowsers.map((b) => b.longName).includes(version.browser),
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
