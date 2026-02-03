/* eslint-disable */
var path = require('path');

try {
  var distPath = path.resolve(__dirname, '../dist/index.cjs');
  console.log('Loading module from:', distPath);

  var lib = require(distPath);
  var getCompatibleVersions = lib.getCompatibleVersions;

  if (typeof getCompatibleVersions !== 'function') {
    console.error('ERROR: getCompatibleVersions is not a function');
    process.exit(1);
  }

  console.log('getCompatibleVersions loaded successfully.');

  var result = getCompatibleVersions();
  console.log('Result length:', result.length);

  if (!Array.isArray(result)) {
    console.error('ERROR: Result is not an array');
    process.exit(1);
  }

  if (result.length === 0) {
    console.error('WARNING: Result length is 0, expected default items');
    // Not failing explicitly if defaults change, but logging warning.
  }

  // Basic validation of one item
  if (result.length > 0) {
    var item = result[0];
    if (!item.browser || !item.version) {
      console.error('ERROR: Invalid item structure:', item);
      process.exit(1);
    }
    console.log('Sample item:', item);
  }

  console.log('Legacy smoke test passed!');
  process.exit(0);
} catch (e) {
  console.error('ERROR: Exception during test execution');
  console.error(e);
  process.exit(1);
}
