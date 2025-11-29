import {
  getCompatibleVersions,
  getAllVersions,
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

  it("Does not warn when BASELINE_BROWSER_MAPPING_IGNORE_OLD_DATA is set in .env", () => {
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
