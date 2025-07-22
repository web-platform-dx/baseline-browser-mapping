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
        expect(stdout).toContain("chrome");
        done();
      },
    );
  });

  it("should get compatible versions by widely available on date", (done) => {
    exec(
      "npx baseline-browser-mapping --widely-available-on-date 2023-04-05",
      (error, stdout, stderr) => {
        expect(error).toBe(null);
        expect(stdout).toContain("chrome");
        done();
      },
    );
  });
});
