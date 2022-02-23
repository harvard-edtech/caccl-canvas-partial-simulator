/**
 * Template for LTI install XML
 * @author Gabe Abrams
 * @param opts object containing all args
 * @param opts.appName name of the app
 * @param [opts.customParams] map of custom params
 */
declare const genInstallXML: (opts: {
    appName: string;
    customParams: {
        [k: string]: string;
    };
}) => string;
export default genInstallXML;
