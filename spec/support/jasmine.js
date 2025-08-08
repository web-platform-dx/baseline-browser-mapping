export default {
  spec_dir: "spec",
  helpers: ["helpers/**/*.?(m)js"],
  spec_files: ["tests/*.js"],
  env: {
    stopSpecOnExpectationFailure: false,
    random: true,
    forbidDuplicateNames: true,
  },
};
