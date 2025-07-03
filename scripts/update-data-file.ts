import { writeFileSync } from "fs";
import { data } from "../src/data/data.js";
import { dataOut } from "./compress-data.js";

if (JSON.stringify(dataOut) == JSON.stringify(data)) {
  console.log("no data changes detected");
} else {
  console.log("data changes detected");
  const now = new Date().getTime();
  writeFileSync(
    "./src/data/data.js",
    `const data = ${JSON.stringify(dataOut)};const lastUpdated = ${now};export {data, lastUpdated}`,
  );
}

process.exit();
