"use strict";
/* eslint-disable no-console */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var clear_1 = __importDefault(require("clear"));
// Import caccl libs
var caccl_api_forwarder_1 = __importDefault(require("caccl-api-forwarder"));
var caccl_api_1 = __importDefault(require("caccl-api"));
var caccl_dev_server_1 = __importDefault(require("caccl-dev-server"));
var Group_1 = __importDefault(require("./shared/types/Group"));
// Import shared constants
var CACCL_SIM_TOOL_ID_1 = __importDefault(require("./shared/constants/CACCL_SIM_TOOL_ID"));
// Import helpers
var initLaunches_1 = __importDefault(require("./initLaunches"));
var initOAuth_1 = __importDefault(require("./initOAuth"));
var parallelLimit_1 = __importDefault(require("./helpers/parallelLimit"));
var printInstructionsAndExit_1 = __importDefault(require("./printInstructionsAndExit"));
var currentUser_1 = __importDefault(require("./currentUser"));
/*----------------------------------------*/
/*                 Helpers                */
/*----------------------------------------*/
// Printing helpers
var W = process.stdout.columns;
/**
 * Calculate the number of spaces on the left of a centered line
 * @author Gabe Abrams
 * @param message the centered message
 * @returns number of spaces on the left
 */
var leftBuffer = function (message) {
    return (Math.floor(W / 2) - 1 - Math.ceil(message.length / 2));
};
/**
 * Calculate the number of spaces on the right of a centered line
 * @author Gabe Abrams
 * @param message the centered message
 * @returns number of spaces on the right
 */
var rightBuffer = function (message) {
    return (Math.ceil(W / 2) - 1 - Math.floor(message.length / 2));
};
/**
 * Center and surround text with a border (on left and right)
 * @author Gabe Abrams
 * @param str text to print
 */
var printMiddleLine = function (str) {
    console.log('\u2551'
        + ' '.repeat(leftBuffer(str))
        + str
        + ' '.repeat(rightBuffer(str))
        + '\u2551');
};
/**
 * Center text
 * @author Gabe Abrams
 * @param str text to print
 */
var printCenteredLine = function (str) {
    console.log(' '
        + ' '.repeat(leftBuffer(str))
        + str
        + ' '.repeat(rightBuffer(str))
        + ' ');
};
/**
 * Print the top of a box
 * @author Gabe Abrams
 */
var printBoxTop = function () {
    // Print top of box
    console.log('\u2554' + '\u2550'.repeat(W - 2) + '\u2557');
};
/**
 * Print the bottom of a box
 * @author Gabe Abrams
 */
var printBoxBottom = function () {
    console.log('\u255A' + '\u2550'.repeat(W - 2) + '\u255D');
};
/**
 * Print an alert
 * @author Gabe Abrams
 * @param text message
 */
var printAlert = function (text) {
    (0, clear_1.default)();
    printBoxTop();
    printMiddleLine(text);
    printBoxBottom();
    console.log('');
};
/*----------------------------------------*/
/*                 Set Up                 */
/*----------------------------------------*/
// Get the current working directory
var workingDir = ((process && process.env)
    ? (process.env.INIT_CWD || process.env.PWD)
    : '.');
// Get dev environment
var devEnvironment;
try {
    // Read the file
    devEnvironment = require("".concat(workingDir, "/config/devEnvironment.json"));
    if (!devEnvironment) {
        throw new Error();
    }
}
catch (err) {
    printAlert('Dev Environment Not Found!');
    (0, printInstructionsAndExit_1.default)();
}
// Make sure required fields are included
if (!devEnvironment.teacherAccessToken) {
    printAlert('Dev Environment Has No "teacherAccessToken"');
    (0, printInstructionsAndExit_1.default)();
}
if (!devEnvironment.courseId) {
    printAlert('Dev Environment Has No "courseId"');
    (0, printInstructionsAndExit_1.default)();
}
// Get app package.json
var packageJSON;
try {
    // Read the file
    packageJSON = require("".concat(workingDir, "/package.json"));
}
catch (err) {
    printAlert('Missing package.json File');
    console.log('Make sure you\'re starting the app from the top-level directory, which must also be an npm project.');
    process.exit(0);
}
if (!packageJSON.name) {
    printAlert('Invalid package.json File');
    console.log('Make sure your package.json includes a "name" parameter.');
    process.exit(0);
}
/**
 * Initialize a simulated Canvas environment that automatically responds to
 *   OAuth authorization requests and forwards all other requests
 * @author Gabe Abrams
 */
var start = function () { return __awaiter(void 0, void 0, void 0, function () {
    var canvasHost, appName, courseId, teacherAccessToken, taAccessTokens, studentAccessTokens, customParams, customLaunchPaths, app, teacherAPI, teacherProfile, _a, studentObjects, profile, teacherId, i, err_1, teacher, studentAPIs, studentProfiles, err_2, students, taAPIs, taProfiles, err_3, tas;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                canvasHost = String(devEnvironment.canvasHost
                    || 'canvas.instructure.com');
                appName = packageJSON.name;
                courseId = devEnvironment.courseId;
                teacherAccessToken = devEnvironment.teacherAccessToken;
                taAccessTokens = ((_b = devEnvironment.taAccessTokens) !== null && _b !== void 0 ? _b : []);
                studentAccessTokens = ((_c = devEnvironment.studentAccessTokens) !== null && _c !== void 0 ? _c : []);
                customParams = (devEnvironment.customParams);
                customLaunchPaths = ((_d = devEnvironment.customLaunchPaths) !== null && _d !== void 0 ? _d : []);
                app = (0, express_1.default)();
                // Set up ejs
                app.set('view engine', 'ejs');
                // Set up body parsing
                app.use(express_1.default.json());
                app.use(express_1.default.urlencoded({ extended: true, limit: '5mb' }));
                // Allow cross origin connections
                app.use(function (req, res, next) {
                    res.setHeader('Access-Control-Allow-Origin', '*');
                    res.setHeader('Access-Control-Allow-Credentials', 'true');
                    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
                    res.setHeader('Access-Control-Request-Headers', '*');
                    next();
                });
                /* -------- Initialize Users -------- */
                // Show a loader
                (0, clear_1.default)();
                printCenteredLine('Waiting on Canvas...');
                teacherAPI = (0, caccl_api_1.default)({
                    canvasHost: canvasHost,
                    accessToken: teacherAccessToken,
                });
                _e.label = 1;
            case 1:
                _e.trys.push([1, 3, , 4]);
                return [4 /*yield*/, Promise.all([
                        teacherAPI.course.listStudents({ courseId: courseId }),
                        teacherAPI.user.self.getProfile(),
                    ])];
            case 2:
                _a = _e.sent(), studentObjects = _a[0], profile = _a[1];
                // Save profile and id to teacher
                teacherProfile = profile;
                teacherId = profile.id;
                for (i = 0; i < studentObjects.length; i++) {
                    if (studentObjects[i].id === teacherId) {
                        // The "teacher" is a student!
                        console.log('\nOops! The main access token in your /config/devEnvironment.js belongs to a student in the course. The main access token must belong to an teacher in the course.');
                        process.exit(0);
                    }
                }
                return [3 /*break*/, 4];
            case 3:
                err_1 = _e.sent();
                console.log("\nOops! An error occurred while attempting to verify the teacher API: ".concat(err_1.message));
                process.exit(0);
                return [3 /*break*/, 4];
            case 4:
                teacher = {
                    id: teacherProfile.id,
                    group: Group_1.default.Teacher,
                    index: 0,
                    token: teacherAccessToken,
                    api: teacherAPI,
                    profile: teacherProfile,
                };
                studentAPIs = studentAccessTokens.map(function (studentAccessToken) {
                    return (0, caccl_api_1.default)({
                        canvasHost: canvasHost,
                        accessToken: studentAccessToken,
                    });
                });
                _e.label = 5;
            case 5:
                _e.trys.push([5, 7, , 8]);
                return [4 /*yield*/, (0, parallelLimit_1.default)(studentAPIs.map(function (api) {
                        return function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, api.user.self.getProfile()];
                            });
                        }); };
                    }), 10)];
            case 6:
                studentProfiles = _e.sent();
                return [3 /*break*/, 8];
            case 7:
                err_2 = _e.sent();
                console.log("\nOops! An error occurred while attempting to get info on a test student: ".concat(err_2.message));
                process.exit(0);
                return [3 /*break*/, 8];
            case 8:
                students = studentAPIs.map(function (api, i) {
                    return {
                        id: studentProfiles[i].id,
                        group: Group_1.default.Student,
                        index: i,
                        token: studentAccessTokens[i],
                        api: api,
                        profile: studentProfiles[i],
                    };
                });
                taAPIs = taAccessTokens.map(function (taAccessToken) {
                    return (0, caccl_api_1.default)({
                        canvasHost: canvasHost,
                        accessToken: taAccessToken,
                    });
                });
                _e.label = 9;
            case 9:
                _e.trys.push([9, 11, , 12]);
                return [4 /*yield*/, (0, parallelLimit_1.default)(taAPIs.map(function (api) {
                        return function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, api.user.self.getProfile()];
                            });
                        }); };
                    }), 10)];
            case 10:
                taProfiles = _e.sent();
                return [3 /*break*/, 12];
            case 11:
                err_3 = _e.sent();
                console.log("\nOops! An error occurred while attempting to get info on a test ta: ".concat(err_3.message));
                process.exit(0);
                return [3 /*break*/, 12];
            case 12:
                tas = taAPIs.map(function (api, i) {
                    return {
                        id: taProfiles[i].id,
                        group: Group_1.default.TA,
                        index: i,
                        token: taAccessTokens[i],
                        api: api,
                        profile: taProfiles[i],
                    };
                });
                /* --------------------- Initialize Services -------------------- */
                // Initialize LTI launches
                return [4 /*yield*/, (0, initLaunches_1.default)({
                        app: app,
                        appName: appName,
                        courseId: courseId,
                        teacher: teacher,
                        tas: tas,
                        students: students,
                        customParams: customParams,
                        customLaunchPaths: customLaunchPaths,
                    })];
            case 13:
                /* --------------------- Initialize Services -------------------- */
                // Initialize LTI launches
                _e.sent();
                // Initialize OAuth
                (0, initOAuth_1.default)(app);
                // Add data to current user manager
                currentUser_1.default.addData(teacher, tas, students);
                /* ----------------- Initialize Canvas Redirects ---------------- */
                // Self launch intercept
                app.get("/courses/:courseId/external_tools/".concat(CACCL_SIM_TOOL_ID_1.default), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        // Show the launch chooser in self-launch form
                        return [2 /*return*/, res.redirect('/simulator?isSelfLaunch=true')];
                    });
                }); });
                // Redirect GET requests that aren't to the API
                app.get('*', function (req, res, next) {
                    // Skip if this is an API call
                    if (req.path.startsWith('/api')) {
                        return next();
                    }
                    // Redirect to Canvas
                    return res.redirect("https://".concat(canvasHost).concat(req.originalUrl));
                });
                // Initialize the API
                (0, caccl_api_forwarder_1.default)({
                    app: app,
                    numRetries: 1,
                    forwarderPrefix: '',
                    defaultCanvasHost: canvasHost,
                });
                /* ------------------------ Start Server ------------------------ */
                // Start HTTPS server
                return [4 /*yield*/, (0, caccl_dev_server_1.default)({
                        app: app,
                        port: 8088,
                    })];
            case 14:
                /* ------------------------ Start Server ------------------------ */
                // Start HTTPS server
                _e.sent();
                /* --------------------- Print Start Message -------------------- */
                // Print alert
                (0, clear_1.default)();
                printBoxTop();
                printMiddleLine('Semi-simulated Canvas Now Running');
                printBoxBottom();
                console.log('');
                console.log('To launch your app, visit:');
                console.log('https://localhost:8088/simulator');
                // Self-signed message
                console.log('\nYou may need to accept our self-signed certificate');
                return [2 /*return*/];
        }
    });
}); };
exports.default = start;
//# sourceMappingURL=start.js.map