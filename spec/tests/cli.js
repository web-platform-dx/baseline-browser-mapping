import { exec } from "child_process";

describe("CLI", () => {
  it("should show help", (done) => {
    exec("npx baseline-browser-mapping --help", (error, stdout, stderr) => {
      expect(error).toBe(null);
      expect(stdout).toContain("Usage: baseline-browser-mapping [options]");
      done();
    });
  });

  it("should get compatible versions by target year", (done) => {
    exec(
      "npx baseline-browser-mapping --target-year 2020",
      (error, stdout, stderr) => {
        expect(error).toBe(null);
        expect(stdout).toContain(
          "{ browser: 'chrome', version: '87', release_date: '2020-11-19' }",
        );
        done();
      },
    );
  });

  it("should get compatible versions by widely available on date", (done) => {
    exec(
      "npx baseline-browser-mapping --widely-available-on-date 2023-04-05",
      (error, stdout, stderr) => {
        expect(error).toBe(null);
        expect(stdout).toContain(
          "{ browser: 'chrome', version: '85', release_date: '2020-09-16' }",
        );
        done();
      },
    );
  });
});
