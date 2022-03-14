"use strict";
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
        while (_) try {
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
// Import shared helpers
var currentUser_1 = __importDefault(require("../currentUser"));
var genInstallXML_1 = __importDefault(require("./genInstallXML"));
// Import shared constants
var TEST_INSTALL_CREDS_1 = __importDefault(require("../shared/constants/TEST_INSTALL_CREDS"));
/* eslint-disable no-console */
/**
 * Initializes simulated LTI launch functionality
 * @author Gabe Abrams
 * @async
 * @param {object} opts object containing all args
 * @param {Express.Application} opts.app the express app to add routes to
 * @param {string} opts.appName the name of the app
 * @param {number} opts.courseId the id of the test Canvas course
 * @param {User} opts.teacher an instructor
 * @param {User[]} opts.tas a list of TAs
 * @param {User[]} opts.students a list of students
 * @param {object} [opts.customParams] map of custom parameters
 */
var initLaunches = function (opts) { return __awaiter(void 0, void 0, void 0, function () {
    var app, appName, courseId, teacher, tas, students, _a, customParams;
    return __generator(this, function (_b) {
        app = opts.app, appName = opts.appName, courseId = opts.courseId, teacher = opts.teacher, tas = opts.tas, students = opts.students, _a = opts.customParams, customParams = _a === void 0 ? {} : _a;
        /* --------------------------- Routes --------------------------- */
        /**
         * Simulator homepage
         * @author Gabe Abrams
         */
        app.get('/simulator', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Render the launch page
                return [2 /*return*/, res.render("".concat(__dirname, "/launchPage"), {
                        teacher: teacher,
                        tas: tas,
                        students: students,
                        isSelfLaunch: (req.query.isSelfLaunch
                            && req.query.isSelfLaunch === 'true'),
                    })];
            });
        }); });
        /**
         * Redirect to launch
         * @author Gabe Abrams
         * @param {number} userId user's Canvas id
         */
        app.get('/simulator/users/:userId/launch', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
            var id, user, api, uniqueAppName, xml, testApp, err_1, sessionlessLaunchURL, err_2, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = Number.parseInt(req.params.userId);
                        // Save the current user
                        currentUser_1.default.set(id);
                        user = currentUser_1.default.get();
                        if (!user || !user.api) {
                            return [2 /*return*/, res.send('Oops! We could not launch as the user you selected. We could not find their credentials.')];
                        }
                        api = user.api;
                        uniqueAppName = "CACCL Test App [".concat(appName, "] [").concat((new Date()).toLocaleDateString(), "]");
                        xml = (0, genInstallXML_1.default)({
                            appName: uniqueAppName,
                            customParams: customParams,
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, teacher.api.course.app.add({
                                courseId: courseId,
                                name: uniqueAppName,
                                key: TEST_INSTALL_CREDS_1.default.key,
                                secret: TEST_INSTALL_CREDS_1.default.secret,
                                xml: xml,
                                description: 'CACCL test app (you can remove this)',
                                launchPrivacy: 'members',
                            })];
                    case 2:
                        testApp = _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        err_1 = _a.sent();
                        return [2 /*return*/, res.send("Oops! We could not launch as the user you selected. We could not create a test app in your sandbox course because an error occurred: ".concat(err_1.message))];
                    case 4:
                        _a.trys.push([4, 6, , 7]);
                        return [4 /*yield*/, api.course.app.getNavLaunchURL({
                                courseId: courseId,
                                appId: testApp.id,
                            })];
                    case 5:
                        sessionlessLaunchURL = _a.sent();
                        // Send user to the launch URL
                        res.redirect(sessionlessLaunchURL);
                        return [3 /*break*/, 7];
                    case 6:
                        err_2 = _a.sent();
                        return [2 /*return*/, res.send("Oops! We ran into an issue while asking Canvas for a launch URL: ".concat(err_2.message))];
                    case 7: 
                    // Wait and then uninstall the test app
                    return [4 /*yield*/, new Promise(function (r) {
                            setTimeout(r, 10000);
                        })];
                    case 8:
                        // Wait and then uninstall the test app
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        _a.trys.push([9, 11, , 12]);
                        return [4 /*yield*/, teacher.api.course.app.remove({
                                courseId: courseId,
                                appId: testApp.id,
                            })];
                    case 10:
                        _a.sent();
                        return [3 /*break*/, 12];
                    case 11:
                        err_3 = _a.sent();
                        console.log('An error occurred when trying to clean up a test app:');
                        console.log(err_3);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        }); });
        return [2 /*return*/];
    });
}); };
exports.default = initLaunches;
//# sourceMappingURL=index.js.map