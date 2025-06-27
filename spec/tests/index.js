import { getCompatibleVersions, getAllVersions } from "../../dist/index.js";

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

  it("Includes Chrome 87 and Safari 14 for Baseline 2020", () => {
    expect(
      getCompatibleVersions({ targetYear: 2020 }).find(
        (version) => version.browser == "chrome",
      ).version,
    ).toBe("87");
    expect(
      getCompatibleVersions({ targetYear: 2020 }).find(
        (version) => version.browser == "safari",
      ).version,
    ).toBe("14");
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
