import {
  getCompatibleVersions,
  getAllVersions,
} from "baseline-browser-mapping";

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

  it("Includes KaiOS when includeKaiOS: true is used", () => {
    expect(
      getCompatibleVersions({
        includeDownstreamBrowsers: true,
        includeKaiOS: true,
      }).find((browser) => browser.browser === "kai_os"),
    ).not.toBe(undefined);
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
