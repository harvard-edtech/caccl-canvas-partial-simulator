const initCACCL = require('caccl/script');
const genLTILaunch = require('caccl-authorizer/genLTILaunch');
const path = require('path');
const oauth = require('oauth-signature');

/**
 * Initializes simulated LTI launch functionality
 * @param {object} app - the express app to add routes to
 * @param {string} canvasHost - the actual Canvas host
 * @param {string} accessToken - an access token to use to get course and user
 *   info
 * @param {string} launchURL - the URL to launch to when simulating an LTI
 *   launch
 * @param {string} consumerKey - the consumer key of the installation for the
 *   created OAuth message
 * @param {string} consumerSecret - the consumer secret of the installation so
 *   we can encrypt the OAuth message
 */
module.exports = (config) => {
  config.app.get('/courses/:course', (req, res) => {
    return res.render(path.join(__dirname, 'launchPage'), {
      launchURL: config.launchURL,
      launchDataURL: req.url + '/launchdata',
    });
  });

  config.app.get('/courses/:course/launchdata', (req, res) => {
    const api = initCACCL({
      canvasHost: config.canvasHost,
      accessToken: config.accessToken,
    });
    return Promise.all([
      api.course.get({ courseId: req.params.course }),
      api.user.self.getProfile(),
    ])
      .then(([course, profile]) => {
        // Create a simulated launch
        const simulatedLTILaunchBody = genLTILaunch({
          course,
          profile,
          appName: 'Simulated App',
          canvasHost: 'localhost:8088',
        });

        // Add consumer id
        simulatedLTILaunchBody.oauth_consumer_key = config.consumerKey;

        // Create signature
        simulatedLTILaunchBody.oauth_signature = decodeURIComponent(
          oauth.generate(
            'POST',
            config.launchURL,
            simulatedLTILaunchBody,
            config.consumerSecret
          )
        );
        return res.json(simulatedLTILaunchBody);
      })
      .catch((err) => {
        return res.json({
          error: err.message,
          code: err.code,
        });
      });
  });
};
