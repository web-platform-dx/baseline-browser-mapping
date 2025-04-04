# [`baseline-browser-mapping`](https://github.com/web-platform-dx/web-features/packages/baseline-browser-mapping)

By the [W3C WebDX Community Group](https://www.w3.org/community/webdx/) and contributors.

`baseline-browser-mapping` exposes arrays of browsers compatible with Baseline Widely available and specified Baseline year feature sets.
You can use `baseline-browser-mapping` to help you determine minimum browser version support for your chosen Baseline feature set.

## Prerequisites

To use this package, you'll need:

- Node.js (a supported [current, active LTS, or maintenance LTS release](https://nodejs.org/en/about/previous-releases))

## Install

To install the package, run:

`npm install --save baseline-browser-mapping`

`baseline-browser-mapping` depends on `web-features` and `@mdn/browser-compat-data` for version selection. It is strongly recommended that you update this module and it's dependencies often to ensure you have the most accurate data. Consider adding a script to your `package.json` and using it as a build step:

```javascript
"scripts": [
  "refresh-baseline-browser-mapping": "npm i --save baseline-browser-mapping@latest web-features@latest @mdn/browser-compat-data@latest"
]
```

## Get Baseline Widely available browser versions or Baseline year browser versions

To get the current list of minimum browser versions compatible with Baseline Widely available features from the core browser set, call the `getCompatibleVersions()` function:

```javascript
import { getCompatibleVersions } from "baseline-browser-mapping";

getCompatibleVersions();
```

Executed on 7th March 2025, the above code returns the following browser versions:

```javascript
[
  { browser: "chrome", version: "105", release_date: "2022-09-02" },
  {
    browser: "chrome_android",
    version: "105",
    release_date: "2022-09-02",
  },
  { browser: "edge", version: "105", release_date: "2022-09-02" },
  { browser: "firefox", version: "104", release_date: "2022-08-23" },
  {
    browser: "firefox_android",
    version: "104",
    release_date: "2022-08-23",
  },
  { browser: "safari", version: "15.6", release_date: "2022-09-02" },
  {
    browser: "safari_ios",
    version: "15.6",
    release_date: "2022-09-02",
  },
];
```

> [!NOTE]  
> The minimum versions of each browser are not strictly the final release before the Widely available cutoff date of `TODAY - 30 MONTHS`. Some earlier versions will have supported the full Widely available feature set.

### `getCompatibleVersions()` configuration options

`getCompatibleVersions()` accepts an `Object` as an argument with configuration options. The defaults are as follows:

```javascript
{
  targetYear: undefined,
  widelyAvailableOnDate: undefined,
  includeDownstreamBrowsers: false,
  listAllCompatibleVersions: false
}
```

#### `targetYear`

The `targetYear` option returns the minimum browser versions compatible with all **Baseline Newly available** features at the end of the specified calendar year. For example, calling:

```javascript
getCompatibleVersions({
  targetYear: 2020,
});
```

Returns the following versions:

```javascript
[
  { browser: "chrome", version: "87", release_date: "2020-11-19" },
  {
    browser: "chrome_android",
    version: "87",
    release_date: "2020-11-19",
  },
  { browser: "edge", version: "87", release_date: "2020-11-19" },
  { browser: "firefox", version: "83", release_date: "2020-11-17" },
  {
    browser: "firefox_android",
    version: "83",
    release_date: "2020-11-17",
  },
  { browser: "safari", version: "14", release_date: "2020-09-16" },
  { browser: "safari_ios", version: "14", release_date: "2020-09-16" },
];
```

> [!NOTE]  
> The minimum version of each browser is not necessarily the final version released in that calendar year. In the above example, Firefox 84 was the final version released in 2020; however Firefox 83 supported all of the features that were interoperable at the end of 2020.  
> [!WARNING]  
> You cannot use `targetYear` and `widelyAavailableDate` together. Please only use one of these options at a time.

#### `widelyAvailableOnDate`

The `widelyAvailableOnDate` option returns the minimum versions compatible with Baseline Widely available on a specified date in the formay `YYYY-MM-DD`:

```javascript
getCompatibleVersions({
  widelyAvailableOnDate: `2023-04-05`,
});
```

> [!TIP]  
> This option is useful if you provide a versioned library that targets Baseline Widely available on each version's release date and you need to provide a statement on minimum supported browser versions in your documentation.

#### `includeDownstreamBrowsers`

Setting `includeDownstreamBrowsers` to `true` will include browsers outside of the Baseline core browser set where it is possible to map those browsers to an upstream Chromium version:

```javascript
getCompatibleVersions({
  widelyAvailableOnDate: `2023-04-05`,
});
```

For more information on downstream browsers, see [the section on downstream browsers](#downstream-browsers) below.

#### `listAllCompatibleVersions`

Setting `listAllCompatibleVersions` to true will include the minimum versions of each compatible browser, and all the subsequent versions:

```javascript
getCompatibleVersions({
  listAllCompatibleVersions: true,
});
```

## Get data for all browser versions

You may want to obtain data on all the browser versions available in this module for use in an analytics solution or dashboard. To get details of each browser version's level of Baseline support, call the `getAllVersions()` function:

```javascript
import { getAllVersions } from "baseline-browser-mapping";

getAllVersions();
```

By default, this function returns an `Array` of `Objects` and excludes downstream browsers:

```javascript
[
  ...
  {
    browser: 'chrome_android', // Browser name
    version: '68', // Browser version as a string
    release_date: '2018-07-24', // Release date
    year: 2019, //Baseline year feature set the version supports
    waCompatible: false // Boolean indicating whether the version is compatible with Baseline Widely available
  },
  ...
]
```

### `getAllVersions()` Configuration options

`getAllVersions()` accepts an `Object` as an argument with configuration options. The defaults are as follows:

```javascript
{
  includeDownstreamBrowsers: false,
  outputFormat: "array"
}
```

#### `includeDownstreamBrowsers` (in `getAllVersions()` output)

As with `getCompatibleVersions()`, you can set `includeDownstreamBrowsers` to `true` to include the Chromium downstream browsers [listed below](#list-of-downstream-browsers).

```javascript
getAllVersions({
  includeDownstreamBrowsers: true,
});
```

Downstream browsers include the same properties as core browsers, as well as the `engine`they use and `engine_version`, for example:

```javascript
[
  ...
  {
    "browser": "samsunginternet_android",
    "version": "18.0",
    "release_date": "2022-08-08",
    "engine": "Blink",
    "engine_version": "99",
    "year": 2021,
    "waCompatible": false
  },
  ...
]
```

#### `outputFormat`

By default, this function returns an `Array` of `Objects` which can be manipulated in Javascript or output to JSON. To return a `String` in CSV format, set `outputFormat` to `csv`:

```javascript
getAllVersions({
  outputFormat: "csv",
});
```

`getAllVersions` returns a `String` with a header row and comma-separated values for each browser version that you can write to a file or pass to another service. Core browsers will have "NULL" as the value for their `engine` and `engine_version`:

```csv
"browser","version","year","waCompatible","release_date","engine","engine_version"
"chrome","53","2016","false","2016-09-07","NULL","NULL"
...
"ya_android","20.12","2020","false","2020-12-20","Blink","87"
...
```

> [!NOTE]
> The above example uses `"includeDownstreamBrowsers": true`

## Downstream browsers

### Limitations

The browser versions in this module come from two different sources:

- MDN's `browser-compat-data` module.
- Parsed user agent strings provided by [useragents.io](https://useragents.io/)

MDN `browser-compat-data` is an authoritative source of information for the browsers it contains. The release dates for the Baseline core browser set and the mapping of downstream browsers to Chromium versions should be considered accurate.

Browser mappings from useragents.io are provided on a best effort basis. They assume that browser vendors are accurately stating the Chromium version they have implemented. The initial set of version mappings was derived from a bulk export in November 2024. This version was iterated over with a Regex match looking for a major Chrome version and a corresponding version of the browser in question, e.g.:

`Mozilla/5.0 (Linux; U; Android 10; en-US; STK-L21 Build/HUAWEISTK-L21) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/100.0.4896.58 UCBrowser/13.8.2.1324 Mobile Safari/537.36`

Shows UC Browser Mobile 13.8 implementing Chromium 100, and:

`Mozilla/5.0 (Linux; arm_64; Android 11; Redmi Note 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.6613.123 YaBrowser/24.10.2.123.00 SA/3 Mobile Safari/537.36`

Shows Yandex Browser Mobile 24.10 implementing Chromium 128. The Chromium version from this string is mapped to the corresponding Chrome version from MDN `browser-compat-data`.

> [!NOTE]  
> Where possible, approximate release dates have been included based on useragents.io "first seen" data. useragents.io does not have "first seen" dates prior to June 2020. However, these browsers' Baseline compatibility is determined by their Chromium version, so their release dates are more informative than critical.

This data is updated on a daily basis using a [script](https://github.com/web-platform-dx/web-features/tree/main/scripts/refresh-downstream.ts) triggered by a GitHub [action](https://github.com/web-platform-dx/web-features/tree/main/.github/workflows/refresh_downstream.yml). Useragents.io provides a private API for this module which exposes the last 7 days of newly seen user agents for the currently tracked browsers. If a new major version of one of the tracked browsers is encountered with a Chromium version that meets or exceeds the previous latest version of that browser, it is added to the [src/data/downstream-browsers.json](src/data/downstream-browsers.json) file with the date it was first seen by useragents.io as its release date.

### List of downstream browsers

| Browser               | ID                        | Core    | Source                    |
| --------------------- | ------------------------- | ------- | ------------------------- |
| Chrome                | `chrome`                  | `true`  | MDN `browser-compat-data` |
| Chrome for Android    | `chrome_android`          | `true`  | MDN `browser-compat-data` |
| Edge                  | `edge`                    | `true`  | MDN `browser-compat-data` |
| Firefox               | `firefox`                 | `true`  | MDN `browser-compat-data` |
| Firefox for Android   | `firefox_android`         | `true`  | MDN `browser-compat-data` |
| Safari                | `safari`                  | `true`  | MDN `browser-compat-data` |
| Safari on iOS         | `safari_ios`              | `true`  | MDN `browser-compat-data` |
| Opera                 | `opera`                   | `false` | MDN `browser-compat-data` |
| Opera Android         | `opera_android`           | `false` | MDN `browser-compat-data` |
| Samsung Internet      | `samsunginternet_android` | `false` | MDN `browser-compat-data` |
| WebView Android       | `webview_android`         | `false` | MDN `browser-compat-data` |
| QQ Browser Mobile     | `qq_android`              | `false` | useragents.io             |
| UC Browser Mobile     | `uc_android`              | `false` | useragents.io             |
| Yandex Browser Mobile | `ya_android`              | `false` | useragents.io             |

> [!NOTE]  
> All the non-core browsers currently included implement Chromium. Their inclusion in any of the above methods is based on the Baseline feature set supported by the Chromium version they implement, not their release date.
