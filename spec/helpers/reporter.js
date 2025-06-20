import SpecReporter from "jasmine-spec-reporter";

jasmine.getEnv().clearReporters(); // remove default reporter logs
jasmine.getEnv().addReporter(
  new SpecReporter.SpecReporter({
    // add jasmine-spec-reporter
    spec: {
      displayPending: true,
    },
  }),
);
