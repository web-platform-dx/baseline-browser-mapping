export default {
  spec_dir: "spec",
  helpers: ["helpers/**/*.?(m)js"],
  spec_files: ["tests/index.js"],
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true,
  },
};
