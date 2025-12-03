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

  it("should warn when targeting newly available versions with old data", (done) => {
    const thirtyMonthsFromNow = new Date();
    thirtyMonthsFromNow.setMonth(thirtyMonthsFromNow.getMonth() + 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const dateStr = thirtyMonthsFromNow.toISOString().slice(0, 10);
    const timestamp = ninetyDaysAgo.getTime();

    exec(
      `npx baseline-browser-mapping --widely-available-on-date ${dateStr} --override-last-updated ${timestamp}`,
      (error, stdout, stderr) => {
        expect(error).toBe(null);
        // console.warn goes to stderr in Node.js when run via exec
        expect(stderr).toContain(
          "[baseline-browser-mapping] The data in this module is over two months old",
        );
        done();
      },
    );
  });

  it("should not warn when BROWSERSLIST_IGNORE_OLD_DATA is set", (done) => {
    const thirtyMonthsFromNow = new Date();
    thirtyMonthsFromNow.setMonth(thirtyMonthsFromNow.getMonth() + 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const dateStr = thirtyMonthsFromNow.toISOString().slice(0, 10);
    const timestamp = ninetyDaysAgo.getTime();

    exec(
      `BROWSERSLIST_IGNORE_OLD_DATA=1 npx baseline-browser-mapping --widely-available-on-date ${dateStr} --override-last-updated ${timestamp}`,
      (error, stdout, stderr) => {
        expect(error).toBe(null);
        expect(stderr).not.toContain(
          "[baseline-browser-mapping] The data in this module is over two months old",
        );
        done();
      },
    );
  });
});
