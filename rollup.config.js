import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default [
  {
    input: "src/index.ts",
    output: {
      format: "es",
      dir: "dist",
    },
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: "dist",
        target: "es2015",
      }),
      terser(),
    ],
  },
  {
    input: "src/index.ts",
    output: {
      format: "cjs",
      file: "dist/index.cjs",
    },
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        outDir: "dist",
        target: "es2015",
      }),
      terser(),
    ],
  },
  {
    input: "src/cli.ts",
    output: {
      format: "es",
      file: "dist/cli.js",
    },
    plugins: [
      typescript({ tsconfig: "./tsconfig.json", outDir: "dist" }),
      terser(),
    ],
    external: ["node:util", "node:process", "./index.js"],
  },
];
