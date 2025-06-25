const bbm = await import("./dist/index.js").then((value) => value);

console.log(bbm.getCompatibleVersions());
