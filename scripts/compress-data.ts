import { features } from "web-features";
import bcd from "@mdn/browser-compat-data" with { type: "json" };
import other from "../src/data/downstream-browsers.json" with { type: "json" };

type InputSupportObject = {
  chrome?: string;
  chrome_android?: string;
  edge?: string;
  firefox?: string;
  firefox_android?: string;
  safari?: string;
  safari_ios?: string;
};

type OutputSupportObject = {
  c: string;
  ca: string;
  e: string;
  f: string;
  fa: string;
  s: string;
  si: string;
};

const compressSupportObject = (
  object: InputSupportObject,
): OutputSupportObject => {
  return {
    c: object.chrome ?? "",
    ca: object.chrome_android ?? "",
    e: object.edge ?? "",
    f: object.firefox ?? "",
    fa: object.firefox_android ?? "",
    s: object.safari ?? "",
    si: object.safari_ios ?? "",
  };
};

const featuresOutput = Object.entries(features)
  .filter(([, feature]) => feature.status?.baseline_low_date)
  .map(([, feature]) => [
    feature.status?.baseline_low_date ?? "",
    feature.status.support ? compressSupportObject(feature.status.support) : {},
  ]);

const bcdBrowserNames: string[] = [
  "chrome",
  "chrome_android",
  "edge",
  "firefox",
  "firefox_android",
  "safari",
  "safari_ios",
  "webview_android",
  "samsunginternet_android",
  "opera_android",
  "opera",
];

const engineMapping: object = {
  WebKit: "w",
  Gecko: "g",
  Presto: "p",
  Blink: "b",
};

const statusMapping: object = {
  retired: "r",
  current: "c",
  beta: "b",
  nightly: "n",
  planned: "p",
  unknown: "u",
  esr: "e",
};

const bcdOutput = {};
Object.entries(bcd.browsers).forEach(([browser, data]) => {
  if (bcdBrowserNames.includes(browser)) {
    let releases = Object.entries(data.releases).map(
      ([releaseId, releaseData]) => {
        return [
          releaseId,
          releaseData.release_date == "unknown"
            ? "u"
            : releaseData.release_date,
          releaseData.status
            ? statusMapping[releaseData.status]
            : releaseData.status,
          releaseData.engine
            ? engineMapping[releaseData.engine]
            : releaseData.engine,
          releaseData.engine_version,
        ];
      },
    );
    bcdOutput[browser] = {};
    bcdOutput[browser]["releases"] = releases;
  }
});

const otherOutput = {};
Object.entries(other.browsers).forEach(([browser, data]) => {
  let releases = Object.entries(data.releases).map(
    ([releaseId, releaseData]) => {
      return [
        releaseId,
        releaseData.release_date == "unknown" ? "u" : releaseData.release_date,
        releaseData.status
          ? statusMapping[releaseData.status]
          : releaseData.status,
        releaseData.engine
          ? engineMapping[releaseData.engine]
          : releaseData.engine,
        releaseData.engine_version,
      ];
    },
  );
  otherOutput[browser] = {};
  otherOutput[browser]["releases"] = releases;
});

const dataOut = {
  bcdBrowsers: bcdOutput,
  otherBrowsers: otherOutput,
  features: featuresOutput,
};

export { dataOut };
