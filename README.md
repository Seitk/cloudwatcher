# cloudwatcher

[![CircleCI](https://circleci.com/gh/Seitk/cloudwatcher/tree/master.svg?style=shield)](https://circleci.com/gh/Seitk/cloudwatcher/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/Seitk/cloudwatcher/badge.svg?branch=master)](https://coveralls.io/github/Seitk/cloudwatcher?branch=master)
[![npm version](https://badge.fury.io/js/cloudwatcher.svg)](https://badge.fury.io/js/cloudwatcher)
[![code style](https://img.shields.io/badge/code_style-airbnb-brightgreen.svg?style=shield)](https://www.npmjs.com/package/eslint-config-airbnb)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f8b92add19c249c29650997cebaace5b)](https://www.codacy.com/app/Seitk/cloudwatcher?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=Seitk/cloudwatcher&amp;utm_campaign=Badge_Grade)
[![Greenkeeper badge](https://badges.greenkeeper.io/Seitk/cloudwatcher.svg)](https://greenkeeper.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-brightgreen.svg)](LICENSE)
  
## Installation
  
```bash
$ npm install -g cloudwatcher
```
  
## Features
  
* Tail logs from AWS CloudWatch and see incoming output
* Read logs from multiple groups and even regions, profiles
* And more in dev
  
## Quick Start

Run `cloudwatcher tail` to start tailing logs from CloudWatch, check `cloudwatcher tail --help` for more options.
Use `--include` to indicate profiles and regions you are tapping into.

```bash
$ cloudwatcher tail --include=default:ap-southeast-1 --include=another_profile:us-west-1
```

Then cloudwatcher will find available log groups from given regions and profiles, shown with checkboxs, press enter to confirm selection.  
You might also filter log groups with `--group-name` options, it supports filter with regex or string on log group name.  

```bash
$ cloudwatcher tail --include=default:ap-southeast-1 --group-name=aws
? Select the log groups to tail (Press <space> to select, <a> to toggle all, <i> to invert selection)
 ◯ default:ap-southeast-1:/aws/aes/domains/api/logs
 ◯ default:ap-southeast-1:/aws/lambda/LambdaFunction1
```

Then output are streamed to your console, refreshing in 2 seconds interval.

## Tests

To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## License

[MIT](LICENSE)
