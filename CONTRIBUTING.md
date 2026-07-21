# Contributing to `baseline-browser-mapping`

## Bugs

If you find a functional bug in `baseline-browser-mapping`, please create an issue in this repository. Any detail you can include, including as console errors, expected and actual output, is welcome. If you've already figured out how to solve the issue, please create a PR.

## Downstream browser data accuracy and completeness

The data for [Chromium downstream browsers](/README.md#limitations) not included in `@mdn/browser-compat-data` is provided on a best effort basis in [`src/data/downstream-browsers.json`](src/data/downstream-browsers.json). If you have an accurate source for the Chromium versions implemented by the browsers already in this module (UC Mobile, QQ Mobile, Yandex Browser), or if you have data for a browser not included in this module, we welcome issues or PRs to discuss including that data.

## Working with `baseline-browser-mapping` locally

To work with `baseline-browser-mapping` locally, clone this repository and install its dependencies:

```bash
git clone https://github.com/web-platform-dx/baseline-browser-mapping
cd baseline-browser-mapping
npm install
```

If you make changes to the code, make sure to run `npm run build` before you test your changes from another package.

## Data Generation & Architecture

The module uses a highly minified, zero-dependency timeline database to determine browser versions and Baseline support status at runtime.

### How Data is Generated

The raw data is compiled at build-time from two main sources:

1. **MDN Browser Compatibility Data:** Upstream browser support data from `@mdn/browser-compat-data`.
2. **Downstream Browser Mapping:** Custom browser engine mappings and metadata stored in [`src/data/downstream-browsers.json`](src/data/downstream-browsers.json).

The compression script [`scripts/create-timeline.ts`](scripts/create-timeline.ts) processes this data to generate the timeline file [`src/data/timeline.js`](src/data/timeline.js). You can run this script locally using:

```bash
npm run update-timeline
```

### The Timeline Database Structure

The timeline file [`src/data/timeline.js`](src/data/timeline.js) consists of three main parts:

1. **List of pre-Baseline browser versions (`pre_baseline`)**: A list of all versions of the core browser set that were released before 2015-07-29, the earliest date that the Baseline definition applies.
2. **Chronological Timeline (entries starting `20YY-MM-DD`):** A list of all Baseline Newly available browser version minimums that changed on a given day.
3. **Releases Section (`releases`):** A compressed listing containing all other valid browser versions (e.g., intermediate releases that never changed a target minimum, or future/unreleased versions).

### Runtime Reconstruction

On module load, the library parses the timeline string and automatically merges the chronological entries with the optimized `releases` section to reconstruct the complete set of all releases in memory. This provides 100% data completeness for queries like `getAllVersions()`.

## GitHub Workflows

The repository uses several automated GitHub Actions workflows to keep data up-to-date and ensure package quality:

1. **Refresh Data Sources (`refresh_timeline.yml`):** Runs daily at 14:00 UTC.

   - Updates `@mdn/browser-compat-data` and `web-features` to the latest releases.
   - Refreshes downstream browser metadata from external user-agent APIs.
   - Recompiles the timeline database using `npm run update-timeline`.
   - If changes are detected, runs the test suite, commits/pushes the changes to `main`, tags a new patch version, and triggers the publication workflow.

2. **Refresh Static Assets (`refresh_static.yml`):** Runs daily at 15:00 UTC (one hour after data refresh).

   - Executes `npm run refresh-static` to regenerate all static JSON and CSV files in the `./static/` folder.
   - Commits and pushes any changes to `main`.
   - Deploys the updated static files to GitHub Pages by triggering the following workflow.

3. **Deploy Static Content (`deploy_static.yml`):**

   - Automatically triggers on pushes to `main` that modify files under the `./static/` folder.
   - Deploys the static assets to GitHub Pages.

4. **Run Tests (`run_tests.yml`):**

   - Triggered automatically on Pull Requests targeting `main` or via manual dispatch.
   - Executes the test suite across a comprehensive compatibility matrix of Node.js versions from `6` to `24`.
   - For Node < 18, it runs legacy compatibility smoke tests. For Node >= 18, it runs the full Jasmine and Jasmine-browser test suites (verifying formatting, linting, and functional specs).

5. **Publish (`publish.yml`):**

   - Runs automatically when a version tag matching `v2.*.*` is pushed.
   - Builds the library bundles, runs the multi-Node test matrix, and publishes the package to npm with provenance.

   > **NOTE**: the Publish workflow is scoped to only accept tags that start with `v2` to make sure that any change to version 3 only happens very intentionally and not as part of an automated process.ß
