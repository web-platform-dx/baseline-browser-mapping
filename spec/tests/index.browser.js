import { getCompatibleVersions, getAllVersions } from "../../dist/index.js";

describe("baseline-browser-mapping in browser", function () {
  it("should load getCompatibleVersions", function () {
    expect(typeof getCompatibleVersions).toBe("function");
  });

  it("should load getAllVersions", function () {
    expect(typeof getAllVersions).toBe("function");
  });

  it("getCompatibleVersions should return an array", function () {
    const versions = getCompatibleVersions();
    expect(Array.isArray(versions)).toBe(true);
  });

  it("getAllVersions should return an object", function () {
    const versions = getAllVersions();
    expect(typeof versions).toBe("object");
    expect(versions).not.toBeNull();
  });
});
