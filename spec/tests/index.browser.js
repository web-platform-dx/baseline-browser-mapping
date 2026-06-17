import {
  getCompatibleVersions,
  getAllVersions,
  getTimeline,
} from "../../dist/index.js";

describe("baseline-browser-mapping in browser", function () {
  it("should load getCompatibleVersions", function () {
    expect(typeof getCompatibleVersions).toBe("function");
  });

  it("should load getAllVersions", function () {
    expect(typeof getAllVersions).toBe("function");
  });

  it("should load getTimeline", function () {
    expect(typeof getTimeline).toBe("function");
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

  it("getTimeline should return a timeline object", function () {
    const timeline = getTimeline();
    expect(typeof timeline).toBe("object");
    expect(timeline).not.toBeNull();
    expect(Array.isArray(timeline.chrome)).toBe(true);
  });
});
