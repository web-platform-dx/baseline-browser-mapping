import modify from "rollup-plugin-modify";
import typescript from "@rollup/plugin-typescript";
import copy from "rollup-plugin-copy";
import terser from "@rollup/plugin-terser";

export default [
  // Default export for node.js contexts
  {
    input: "src/index.ts",
    output: {
      format: "es",
      file: "dist/index.js",
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
    external: [
      "@mdn/browser-compat-data",
      "web-features",
      "./scripts/downstream-browsers.js",
      "node:module",
    ],
  },
  // Fetch version that loads from web and falls back to local
  {
    input: "src/index.fetchWithLocalFallback.ts",
    output: {
      format: "es",
      dir: "dist",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json" }),
      // terser(),
    ],
    external: [
      "@mdn/browser-compat-data",
      "web-features",
      "./scripts/downstream-browsers.js",
      "./scripts/import-local.js",
      "./scripts/import-local-legacy.js",
      "compare-versions",
    ],
  },
  {
    input: "src/index.fetch.ts",
    output: {
      format: "es",
      dir: "dist",
    },
    plugins: [typescript({ tsconfig: "./tsconfig.json" }), terser()],
  },
  {
    input: "src/scripts/import-local.ts",
    output: {
      format: "es",
      file: "dist/scripts/import-local.js",
      importAttributesKey: "with",
    },
    plugins: [typescript({ outDir: "dist/scripts" })],
    external: [
      "node:module",
      "web-features",
      "@mdn/browser-compat-data",
      "../data/downstream-browsers.json",
    ],
  },
  {
    input: "src/scripts/import-local-legacy.ts",
    output: {
      format: "es",
      file: "dist/scripts/import-local-legacy.js",
      importAttributesKey: "assert",
    },
    plugins: [typescript({ outDir: "dist/scripts" })],
    external: [
      "node:module",
      "web-features",
      "@mdn/browser-compat-data",
      "../data/downstream-browsers.json",
    ],
  },
];
