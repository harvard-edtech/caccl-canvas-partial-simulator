import CACCL_PATHS from '../shared/constants/CACCL_PATHS';

/**
 * Template for LTI install XML
 * @author Gabe Abrams
 * @param opts object containing all args
 * @param opts.appName name of the app
 * @param [opts.customParams] map of custom params
 */
const genInstallXML = (
  opts: {
    appName: string,
    customParams: { [k: string]: string },
  },
) => {
  const {
    appName,
    customParams,
  } = opts;

  let customParamsInsert = '';
  if (customParams) {
    const customParamItems: string[] = (
      Object.entries(customParams)
        .map(([name, value]) => {
          return `<lticm:property name="${name}">${value}</lticm:property>\n`;
        })
    );
    customParamsInsert = `<blti:custom>\n${customParamItems.join('')}</blti:custom>`;
  }

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
        xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
        xmlns:lticm="http://www.imsglobal.org/xsd/imslticm_v1p0"
        xmlns:lticp="http://www.imsglobal.org/xsd/imslticp_v1p0"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation = "http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd
        http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0.xsd
        http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd
        http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
        <blti:title>${appName}</blti:title>
        <blti:description>CACCL test app (you can remove this)</blti:description>
        <blti:icon></blti:icon>
        <blti:launch_url>http://localhost:8080${CACCL_PATHS.LAUNCH}</blti:launch_url>
        ${customParamsInsert}
        <blti:extensions platform="canvas.instructure.com">
          <lticm:property name="privacy_level">public</lticm:property>
          <lticm:options name="homework_submission">
            <lticm:property name="url">http://localhost:8080${CACCL_PATHS.LAUNCH}</lticm:property>
            <lticm:property name="text">${appName}</lticm:property>
            <lticm:property name="selection_width">400</lticm:property>
            <lticm:property name="selection_height">300</lticm:property>
            <lticm:property name="enabled">true</lticm:property>
            <lticm:property name="windowTarget">_blank</lticm:property>
          </lticm:options>
          <lticm:options name="course_navigation">
            <lticm:property name="url">http://localhost:8080${CACCL_PATHS.LAUNCH}</lticm:property>
            <lticm:property name="text">${appName}</lticm:property>
            <lticm:property name="visibility">public</lticm:property>
            <lticm:property name="default">disabled</lticm:property>
            <lticm:property name="enabled">false</lticm:property>
            <lticm:property name="windowTarget">_blank</lticm:property>
          </lticm:options>
        </blti:extensions>
        <cartridge_bundle identifierref="BLTI001_Bundle"/>
        <cartridge_icon identifierref="BLTI001_Icon"/>
    </cartridge_basiclti_link>
  `;
};

export default genInstallXML;
