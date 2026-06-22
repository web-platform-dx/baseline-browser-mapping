export const compareVersions = (
  nextVersion: string,
  prevVersion: string,
): 1 | 0 | -1 => {
  if (nextVersion === prevVersion) {
    return 0;
  }

  const [nextMajor = 0, nextMinor = 0] = nextVersion.split(".", 2).map(Number);
  const [prevMajor = 0, prevMinor = 0] = prevVersion.split(".", 2).map(Number);

  if (isNaN(nextMajor) || isNaN(nextMinor)) {
    throw new Error(`Invalid version: ${nextVersion}`);
  }
  if (isNaN(prevMajor) || isNaN(prevMinor)) {
    throw new Error(`Invalid version: ${prevVersion}`);
  }

  if (nextMajor !== prevMajor) {
    return nextMajor > prevMajor ? 1 : -1;
  }
  if (nextMinor !== prevMinor) {
    return nextMinor > prevMinor ? 1 : -1;
  }
  return 0;
};
