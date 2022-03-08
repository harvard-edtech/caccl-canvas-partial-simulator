"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var CACCL_PATHS_1 = __importDefault(require("../shared/constants/CACCL_PATHS"));
/**
 * Template for LTI install XML
 * @author Gabe Abrams
 * @param opts object containing all args
 * @param opts.appName name of the app
 * @param [opts.customParams] map of custom params
 */
var genInstallXML = function (opts) {
    var appName = opts.appName, customParams = opts.customParams;
    var customParamsInsert = '';
    if (customParams) {
        var customParamItems = (Object.entries(customParams)
            .map(function (_a) {
            var name = _a[0], value = _a[1];
            return "<lticm:property name=\"".concat(name, "\">").concat(value, "</lticm:property>\n");
        }));
        customParamsInsert = "<blti:custom>\n".concat(customParamItems.join(''), "</blti:custom>");
    }
    return "\n    <?xml version=\"1.0\" encoding=\"UTF-8\"?>\n    <cartridge_basiclti_link xmlns=\"http://www.imsglobal.org/xsd/imslticc_v1p0\"\n        xmlns:blti=\"http://www.imsglobal.org/xsd/imsbasiclti_v1p0\"\n        xmlns:lticm=\"http://www.imsglobal.org/xsd/imslticm_v1p0\"\n        xmlns:lticp=\"http://www.imsglobal.org/xsd/imslticp_v1p0\"\n        xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"\n        xsi:schemaLocation = \"http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd\n        http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd\n        http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd\n        http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd\">\n        <blti:title>".concat(appName, "</blti:title>\n        <blti:description>CACCL test app (you can remove this)</blti:description>\n        <blti:icon></blti:icon>\n        <blti:launch_url>https://localhost:8080").concat(CACCL_PATHS_1.default.LAUNCH, "</blti:launch_url>\n        ").concat(customParamsInsert, "\n        <blti:extensions platform=\"canvas.instructure.com\">\n          <lticm:property name=\"privacy_level\">public</lticm:property>\n          <lticm:options name=\"homework_submission\">\n            <lticm:property name=\"url\">https://localhost:8080").concat(CACCL_PATHS_1.default.LAUNCH, "</lticm:property>\n            <lticm:property name=\"text\">").concat(appName, "</lticm:property>\n            <lticm:property name=\"selection_width\">400</lticm:property>\n            <lticm:property name=\"selection_height\">300</lticm:property>\n            <lticm:property name=\"enabled\">true</lticm:property>\n            <lticm:property name=\"windowTarget\">_blank</lticm:property>\n          </lticm:options>\n          <lticm:options name=\"course_navigation\">\n            <lticm:property name=\"url\">https://localhost:8080").concat(CACCL_PATHS_1.default.LAUNCH, "</lticm:property>\n            <lticm:property name=\"text\">").concat(appName, "</lticm:property>\n            <lticm:property name=\"visibility\">public</lticm:property>\n            <lticm:property name=\"default\">disabled</lticm:property>\n            <lticm:property name=\"enabled\">false</lticm:property>\n            <lticm:property name=\"windowTarget\">_blank</lticm:property>\n          </lticm:options>\n        </blti:extensions>\n        <cartridge_bundle identifierref=\"BLTI001_Bundle\"/>\n        <cartridge_icon identifierref=\"BLTI001_Icon\"/>\n    </cartridge_basiclti_link>\n  ");
};
exports.default = genInstallXML;
//# sourceMappingURL=genInstallXML.js.map