import modify from "rollup-plugin-modify";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";

export default [
  {
    input: "src/index.ts",
    output: {
      format: "es",
      file: "dist/index.node.js",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json" }),
      modify({
        find: "../data",
        replace: "./data",
      }),
      copy({
        targets: [
          { src: "src/data/downstream-browsers.json", dest: "dist/data" },
        ],
      }),
    ],
  },
  {
    input: "src/scripts/baseline-browser-versions.ts",
    output: {
      format: "es",
      file: "dist/index.js",
    },
    plugins: [
      modify({
        find: 'import { createRequire } from "node:module";\nconst require = createRequire(import.meta.url);\n',
        replace: "",
      }),
      modify({
        find: 'import { features } from "web-features";',
        replace:
          'const webFeatures = await fetch("https://cdn.jsdelivr.net/npm/web-features/data.json").then(response => response.json())\nconst features = webFeatures.features;',
      }),
      modify({
        find: 'const bcdBrowsers = require("@mdn/browser-compat-data");',
        replace:
          'const bcdBrowsers = await fetch("https://cdn.jsdelivr.net/npm/@mdn/browser-compat-data").then(response => response.json())',
      }),
      modify({
        find: 'const otherBrowsers = require("../data/downstream-browsers.json");',
        replace:
          'const otherBrowsers = await fetch("https://cdn.jsdelivr.net/npm/baseline-browser-mapping/dist/data/downstream-browsers.json").then(response => response.json())',
      }),
      typescript({ tsconfig: "./tsconfig.json" }),
    ],
  },
];
