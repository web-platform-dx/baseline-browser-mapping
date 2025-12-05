import fs from "fs";
import path from "path";
import { execSync } from "child_process";

describe("Browserslist Integration", () => {
  const tempDir = path.resolve("test-browserslist-temp");

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("Works with .browserslistrc targeting baseline widely available", () => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir);

    const browserslistRcPath = path.join(tempDir, ".browserslistrc");
    fs.writeFileSync(browserslistRcPath, "baseline widely available");

    // Create a dummy package.json to avoid warnings or issues
    fs.writeFileSync(path.join(tempDir, "package.json"), "{}");

    try {
      // Use npx -y to avoid interactive prompts
      const output = execSync("npx -y browserslist", {
        cwd: tempDir,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"], // Capture stdout/stderr
      });

      // Verify output contains expected browsers
      expect(output).toContain("chrome");
      expect(output).toContain("firefox");
      expect(output).toContain("safari");
      expect(output).not.toContain("not found"); // Basic error check
    } catch (error) {
      // If it fails, fail the test with the error output
      fail(
        `Browserslist execution failed: ${error.message}\nStderr: ${error.stderr}`,
      );
    }
  });

  it("Works with .browserslistrc targeting baseline 2020 with downstream including kaios", () => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir);

    const browserslistRcPath = path.join(tempDir, ".browserslistrc");
    fs.writeFileSync(
      browserslistRcPath,
      "baseline 2020 with downstream including kaios",
    );

    // Create a dummy package.json to avoid warnings or issues
    fs.writeFileSync(path.join(tempDir, "package.json"), "{}");

    try {
      // Use npx -y to avoid interactive prompts
      const output = execSync("npx -y browserslist", {
        cwd: tempDir,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"], // Capture stdout/stderr
      });

      // Verify output contains expected browsers
      expect(output).toContain("kaios");
      expect(output).toContain("chrome");
      expect(output).toContain("firefox");
      expect(output).not.toContain("not found"); // Basic error check
    } catch (error) {
      // If it fails, fail the test with the error output
      fail(
        `Browserslist execution failed: ${error.message}\nStderr: ${error.stderr}`,
      );
    }
  });
});
