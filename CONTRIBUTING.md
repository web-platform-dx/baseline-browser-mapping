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

If you make changes to the code, make sure to run `nmp run prepare` before you test your changes. This module uses rollup to package code for distribution.
