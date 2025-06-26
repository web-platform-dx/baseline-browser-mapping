/* scripts/compress-data.ts */
import { writeFileSync } from "fs";
import { features } from "web-features";
import bcd from "@mdn/browser-compat-data" with { type: "json" };
import other from "../src/data/downstream-browsers.json" with { type: "json" };

const featuresOutput = Object.entries(features)
  .filter(([, feature]) => feature.status?.baseline_low_date)
  .map(([featureId, feature]) => [
    featureId,
    feature.name,
    feature.status?.baseline_low_date ?? "",
    feature.status?.support ?? {},
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

const bcdOutput = {};
Object.entries(bcd.browsers).forEach(([browser, data]) => {
  if (bcdBrowserNames.includes(browser)) {
    let releases = Object.entries(data.releases).map(
      ([releaseId, releaseData]) => {
        return [
          releaseId,
          releaseData.release_date,
          releaseData.status,
          releaseData.engine,
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
        releaseData.release_date,
        releaseData.status,
        releaseData.engine,
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

writeFileSync(
  "./src/data/data.js",
  `export default ${JSON.stringify(dataOut)}`,
);

// const templateFile = readFileSync("./scripts/compress-data-template.txt", {
//   encoding: "utf8",
// });

// const outputFile = `const featuresFlat: FeatureFlat[] = ${JSON.stringify(featuresOutput)}
// const bcdBrowsersFlat: { [browser: string]: { [releases: string]: browserVersionFlat[] } } = ${JSON.stringify(bcdOutput)}
// const otherBrowsersFlat: { [browser: string]: { [releases: string]: browserVersionFlat[] } } =  ${JSON.stringify(otherOutput)}
// ${templateFile}`;

// writeFileSync("./src/data.ts", outputFile, {
//   encoding: "utf8",
// });
