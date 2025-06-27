import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default [
  // Default export for node.js contexts
  {
    input: "src/index.ts",
    output: {
      format: "es",
      dir: "dist",
    },
    plugins: [typescript({ tsconfig: "./tsconfig.json" })],
    external: ["./expose-data.js"],
  },
  {
    input: "src/scripts/expose-data.ts",
    output: {
      file: "dist/scripts/expose-data.js",
      format: "es",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json", outDir: "dist/scripts" }),
    ],
  },
  {
    input: "src/index.ts",
    output: {
      format: "es",
      file: "dist/index.min.js",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json", outDir: "dist" }),
      terser(),
    ],
  },
];
