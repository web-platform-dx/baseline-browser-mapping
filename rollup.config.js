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
      typescript({ tsconfig: "./tsconfig.json", outDir: "dist" }),
      terser(),
    ],
  },
];
