"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Print instructions on setting up dev environment
 * @author Gabe Abrams
 */
var printInstructions = function () {
    console.log([
        'How to set up your dev environment:',
        '1. Create /config/devEnvironment.json',
        '2. Make a test Canvas course and populate it with test users',
        '3. Add the test course id as "courseId" in the json file',
        '4. Add the teacher\'s access token as "teacherAccessToken"',
        '5. If you have test TAs, add a "taAccessTokens" array',
        '6. If you have test students, add a "studentAccessTokens" array',
        '7. If your app has custom LTI params, add a "customParams" map',
        '',
        'Example /config/devEnvironment.json:',
        '{',
        '  "courseId": 153948,',
        '  "teacherAccessToken": "1253~3js09egjlaiewjfew9uglgk",',
        '  "taAccessTokens": [',
        '    "1253~xjf02gcnv09g2kjdfgs4bvksdhf",',
        '    "1253~aavvhdfg6e8fhkdhfufsp09ehf7"',
        '  ],',
        '  "studentAccessTokens": [',
        '    "1253~1h78dh9g0f98gn87fga6glhpakn"',
        '  ],',
        '  "customParams": {',
        '    "tool": "discussions"',
        '  }',
        '}',
        '',
        'How to generate access tokens:',
        '1. Log in as the user, click the profile picture, click "Settings"',
        '2. Scroll down, click "+ New Access Token", follow instructions',
    ].join('\n'));
    process.exit(0);
};
exports.default = printInstructions;
//# sourceMappingURL=printInstructionsAndExit.js.map