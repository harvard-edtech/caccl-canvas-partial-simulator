#!/usr/bin/env node
/**
 * This code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-var */
/* eslint-disable strict */
/* eslint-disable no-console */
/* eslint-disable global-require */
/* eslint-disable import/no-unresolved */
'use strict';
var nodeVersion = process.versions.node;
var parts = nodeVersion.split('.');
var majorVersion = Number.parseInt(parts[0], 10);
if (majorVersion < 10) {
    console.log('Oops! You are running node version ' + majorVersion + '.');
    console.log('The CACCL Canvas Partial Simulator requires Node 10 or higher. Please update your version of Node.');
}
else {
    require('./start.js')();
}
//# sourceMappingURL=index.js.map