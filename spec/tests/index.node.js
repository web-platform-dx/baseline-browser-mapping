import {
  getCompatibleVersions,
  getAllVersions,
  getTimeline,
  _resetHasWarned,
} from "baseline-browser-mapping";
import fs from "fs";
import path from "path";

describe("getCompatibleVersions default", () => {
  it("Returns 7 browsers by default", () => {
    expect(getCompatibleVersions().length).toBe(7);
  });

  it("Returns more than 7 browsers when including downstream", () => {
    expect(
      getCompatibleVersions({ includeDownstreamBrowsers: true }).length,
    ).toBeGreaterThan(7);
  });

  it("Preserves canonical array order: core browsers first, then downstream browsers", () => {
    const versions = getCompatibleVersions({ includeDownstreamBrowsers: true });
    const coreNames = [
      "chrome",
      "chrome_android",
      "edge",
      "firefox",
      "firefox_android",
      "safari",
      "safari_ios",
    ];
    const firstSeven = versions.slice(0, 7).map((v) => v.browser);
    expect(firstSeven).toEqual(coreNames);
  });

  it("Doesn't have 0 as the version for any browser", () => {
    const arrayOfVersions = getCompatibleVersions().map((version) => {
      return version.version;
    });
    expect(arrayOfVersions.indexOf("0")).toBe(-1);
    expect(arrayOfVersions.indexOf(0)).toBe(-1);
  });

  const versions202WithDownstream = getCompatibleVersions({
    targetYear: 2020,
    includeDownstreamBrowsers: true,
  });

  it("Includes Chrome 87 and Safari 14 for Baseline 2020", () => {
    expect(
      versions202WithDownstream.find((version) => version.browser == "chrome")
        .version,
    ).toBe("87");
    expect(
      versions202WithDownstream.find((version) => version.browser == "safari")
        .version,
    ).toBe("14");
  });

  it("Includes Opera 73 and Yandex 20.12 for Baseline 2020 with downstream", () => {
    expect(
      versions202WithDownstream.find((version) => version.browser == "opera")
        .version,
    ).toBe("73");
    expect(
      versions202WithDownstream.find(
        (version) => version.browser == "ya_android",
      ).version,
    ).toBe("20.12");
  });

  it("Includes KaiOS 3.0 in Baseline 2020 when includeKaiOS: true is used", () => {
    expect(
      getCompatibleVersions({
        includeDownstreamBrowsers: true,
        includeKaiOS: true,
        targetYear: 2020,
      }),
    ).toContain({
      browser: "kai_os",
      version: "3.0",
      release_date: "2021-09-01",
      engine: "Gecko",
      engine_version: "84",
    });
  });

  it("Warns when targeting newly available versions with old data", () => {
    spyOn(console, "warn");
    const thirtyMonthsFromNow = new Date();
    thirtyMonthsFromNow.setMonth(thirtyMonthsFromNow.getMonth() + 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    _resetHasWarned();
    getCompatibleVersions({
      widelyAvailableOnDate: thirtyMonthsFromNow.toISOString().slice(0, 10),
      overrideLastUpdated: ninetyDaysAgo.getTime(),
    });
    expect(console.warn).toHaveBeenCalled();
  });

  it("Does not warn when BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA is set in .env and process.loadEnvFile is called", () => {
    spyOn(console, "warn");
    const thirtyMonthsFromNow = new Date();
    thirtyMonthsFromNow.setMonth(thirtyMonthsFromNow.getMonth() + 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    _resetHasWarned();

    const envPath = path.join(process.cwd(), ".env");
    fs.writeFileSync(envPath, "BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA=true");

    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(envPath);
    }

    getCompatibleVersions({
      widelyAvailableOnDate: thirtyMonthsFromNow.toISOString().slice(0, 10),
      overrideLastUpdated: ninetyDaysAgo.getTime(),
    });

    if (typeof process.loadEnvFile === "function") {
      expect(console.warn).not.toHaveBeenCalled();
    } else {
      expect(console.warn).toHaveBeenCalled();
    }

    if (fs.existsSync(envPath)) {
      fs.unlinkSync(envPath);
    }
    delete process.env.BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA;
  });

  it("Does not warn when suppressWarnings is true", () => {
    spyOn(console, "warn");
    const thirtyMonthsFromNow = new Date();
    thirtyMonthsFromNow.setMonth(thirtyMonthsFromNow.getMonth() + 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    _resetHasWarned();
    getCompatibleVersions({
      widelyAvailableOnDate: thirtyMonthsFromNow.toISOString().slice(0, 10),
      overrideLastUpdated: ninetyDaysAgo.getTime(),
      suppressWarnings: true,
    });
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe("getAllVersions default", () => {
  const csvExport = getAllVersions({ outputFormat: "csv" });
  const csvExportLines = csvExport.split("\n");

  it("Includes a header row in the CSV export", () => {
    expect(csvExportLines[0].startsWith('"browser","version","year",')).toBe(
      true,
    );
  });

  it("Includes Chrome 0 with pre_baseline as the first row of data", () => {
    expect(csvExportLines[1].startsWith('"chrome","0","pre_baseline"')).toBe(
      true,
    );
  });
});

describe("getTimeline", () => {
  it("Returns a timeline array of events", () => {
    const timeline = getTimeline();
    expect(timeline).toBeDefined();
    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBeGreaterThan(0);

    const firstEvent = timeline[0];
    expect(firstEvent.date).toBeDefined();
    expect(Array.isArray(firstEvent.browsers)).toBe(true);
    expect(firstEvent.browsers.length).toBeGreaterThan(0);

    // Verify chronological order
    for (let i = 1; i < timeline.length; i++) {
      expect(new Date(timeline[i].date) > new Date(timeline[i - 1].date)).toBe(
        true,
      );
    }
  });

  it("By default, each event only contains core browsers that changed on that date", () => {
    const timeline = getTimeline();
    // In default settings, downstream and KaiOS are excluded
    timeline.forEach((event) => {
      event.browsers.forEach((browser) => {
        expect(browser.engine).toBeUndefined(); // core browsers have no engine property
        expect(browser.browser).not.toBe("kai_os");
      });
    });

    // Verify a specific date, e.g. 2015-09-22, where only Firefox / Firefox Android changed.
    const event = timeline.find((e) => e.date === "2015-09-22");
    expect(event).toBeDefined();
    expect(event.browsers.length).toBe(2);
    const browserNames = event.browsers.map((b) => b.browser);
    expect(browserNames).toContain("firefox");
    expect(browserNames).toContain("firefox_android");
  });

  it("listAllBrowsers option returns all compatible browsers at each point in time", () => {
    const timeline = getTimeline({ listAllBrowsers: true });

    // Every event should have all active core browsers
    timeline.forEach((event) => {
      const browserNames = event.browsers.map((b) => b.browser);
      // There are 7 core browsers
      expect(browserNames.length).toBe(7);
      expect(browserNames).toContain("chrome");
      expect(browserNames).toContain("chrome_android");
      expect(browserNames).toContain("edge");
      expect(browserNames).toContain("firefox");
      expect(browserNames).toContain("firefox_android");
      expect(browserNames).toContain("safari");
      expect(browserNames).toContain("safari_ios");
    });

    // On 2015-09-22, Firefox should be version 41, but Chrome should still be version 38 (from 2015-07-29)
    const event = timeline.find((e) => e.date === "2015-09-22");
    expect(event).toBeDefined();

    const chrome = event.browsers.find((b) => b.browser === "chrome");
    const firefox = event.browsers.find((b) => b.browser === "firefox");

    expect(chrome.version).toBe("38");
    expect(firefox.version).toBe("41");
  });

  it("includeDownstreamBrowsers option includes downstream browsers", () => {
    const timeline = getTimeline({ includeDownstreamBrowsers: true });

    // There should be downstream browsers in the events
    let hasDownstream = false;
    timeline.forEach((event) => {
      event.browsers.forEach((browser) => {
        if (browser.engine !== undefined) {
          hasDownstream = true;
        }
      });
    });
    expect(hasDownstream).toBe(true);
  });

  it("includeKaiOS option includes KaiOS when downstream is also enabled", () => {
    const timeline = getTimeline({
      includeKaiOS: true,
      includeDownstreamBrowsers: true,
    });

    let hasKaiOS = false;
    timeline.forEach((event) => {
      event.browsers.forEach((browser) => {
        if (browser.browser === "kai_os") {
          hasKaiOS = true;
        }
      });
    });
    expect(hasKaiOS).toBe(true);
  });

  it("Throws an error if includeKaiOS is true but includeDownstreamBrowsers is false", () => {
    expect(() => {
      getTimeline({ includeKaiOS: true });
    }).toThrowError(/KaiOS is a downstream browser/);
  });

  describe("groupBy: 'browser'", () => {
    it("Returns an object grouped by browser with chronological version histories", () => {
      const timeline = getTimeline({ groupBy: "browser" });
      expect(timeline).toBeDefined();
      expect(typeof timeline).toBe("object");
      expect(Array.isArray(timeline)).toBe(false);

      // Should have keys for core browsers
      expect(Array.isArray(timeline.chrome)).toBe(true);
      expect(Array.isArray(timeline.safari)).toBe(true);
      expect(Array.isArray(timeline.firefox)).toBe(true);

      // Entries should be sorted by date and have correct structure
      const chromeHistory = timeline.chrome;
      expect(chromeHistory.length).toBeGreaterThan(0);
      expect(chromeHistory[0].date).toBeDefined();
      expect(chromeHistory[0].version).toBeDefined();
      expect(chromeHistory[0].release_date).toBeDefined();

      for (let i = 1; i < chromeHistory.length; i++) {
        expect(
          new Date(chromeHistory[i].date) > new Date(chromeHistory[i - 1].date),
        ).toBe(true);
      }
    });

    it("Only lists dates when that browser actually changed by default", () => {
      const timeline = getTimeline({ groupBy: "browser" });

      // On 2015-09-22, only Firefox / Firefox Android changed.
      // So Chrome's history should NOT contain an entry for 2015-09-22.
      // Firefox's history SHOULD contain an entry for 2015-09-22.
      const chromeHistory = timeline.chrome;
      const firefoxHistory = timeline.firefox;

      expect(chromeHistory.some((entry) => entry.date === "2015-09-22")).toBe(
        false,
      );
      expect(firefoxHistory.some((entry) => entry.date === "2015-09-22")).toBe(
        true,
      );
    });

    it("Includes downstream browsers when includeDownstreamBrowsers is true", () => {
      const timeline = getTimeline({
        groupBy: "browser",
        includeDownstreamBrowsers: true,
      });

      // Should have keys for downstream browsers (e.g. opera)
      expect(Array.isArray(timeline.opera)).toBe(true);
      expect(timeline.opera.length).toBeGreaterThan(0);
    });

    it("Lists all dates when listAllBrowsers is true", () => {
      const timeline = getTimeline({
        groupBy: "browser",
        listAllBrowsers: true,
      });

      // With listAllBrowsers, every browser gets an entry on every date.
      // So both Chrome and Firefox should have an entry for 2015-09-22.
      const chromeHistory = timeline.chrome;
      const firefoxHistory = timeline.firefox;

      expect(chromeHistory.some((entry) => entry.date === "2015-09-22")).toBe(
        true,
      );
      expect(firefoxHistory.some((entry) => entry.date === "2015-09-22")).toBe(
        true,
      );

      // The version of Chrome on 2015-09-22 should still be 38
      const chromeEntry = chromeHistory.find(
        (entry) => entry.date === "2015-09-22",
      );
      expect(chromeEntry.version).toBe("38");
    });
  });
});
