export default {
  spec_dir: "spec",
  helpers: ["helpers/**/*.?(m)js"],
  spec_files: [
    "tests/index.js",
    "tests/index.fetch.js",
    "tests/index.fetchWithLocalFallback.js",
  ],
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true,
  },
};
