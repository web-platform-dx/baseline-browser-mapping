---
name: Bug report
about: Create a report to help us improve
title: "[BUG]"
labels: ""
assignees: tonypconway
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:

1. Create/clone package and install '...'
2. Add file '...'
3. Run command '...'
4. See error

> **NOTE**: `baseline-browser-mapping` contains a lot of flattened data is heavily minified, so it can help to navigate to whichever file is throwing the error (`dist/index.js`, `dist/index.cjs`) and format the file to isolate which function is throwing the error.

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment (please complete the following information):**

- OS: [e.g. Linux, macOS, Windows]
- Environment: [Node or browser? And if so, which browser?]
- Version: [e.g. Node 16.15.0, Chrome 137]

**Additional context**
Add any other context about the problem here. The more information you can give the better, e.g. which chain of dependencies is calling `baseline-browser-mapping`, whether you're intentionally setting a Baseline target in one of those tools like `"browserslist": "baseline widely available"`.
