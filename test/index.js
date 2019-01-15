const initCACCL = require('caccl/script');
const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const https = require('https');
const lti = require('ims-lti');
const initCanvasSimulation = require('..');

const { exec } = require('child_process');

/* eslint-disable no-console */

/*------------------------------------------------------------------------*/
/*                          Read dev environment                          */
/*------------------------------------------------------------------------*/

if (!fs.existsSync(path.join(__dirname, 'devEnvironment.js'))) {
  // No dev environment
  console.log('Before running tests, you need to add the following config:');
  console.log('test/devEnvironment.js');
  console.log('See instructions at test/devEnvironment.md');
  process.exit(0);
}

const devEnvironment = require('./devEnvironment');

if (
  !devEnvironment.accessToken
  || !devEnvironment.canvasHost
  || !devEnvironment.courseId
) {
  // devEnvironment not valid
  console.log('Your test/devEnvironment.js config is not complete!');
  console.log('See instructions at test/devEnvironment.md');
  process.exit(0);
}
const {
  accessToken,
  canvasHost,
  courseId,
} = devEnvironment;

console.log('\nWe are starting up a fake LTI app and a Canvas simulator so we can test...');

/*------------------------------------------------------------------------*/
/*                          Set up lti validator                          */
/*------------------------------------------------------------------------*/

const provider = new lti.Provider('consumer_key', 'consumer_secret');
const isValid = (req) => {
  return new Promise((resolve) => {
    provider.valid_request(req, (err, valid) => {
      resolve(!err && valid);
    });
  });
};


/*------------------------------------------------------------------------*/
/*                     Initialize and create constants                    */
/*------------------------------------------------------------------------*/

// Use self-signed certificates
// cy.log('- Reading in SSL certificates');
const sslKey = path.join(__dirname, '..', 'ssl/key.pem');
const sslCertificate = path.join(__dirname, '..', 'ssl/cert.pem');

// Read in files if they're not already read in
let key;
try {
  key = fs.readFileSync(sslKey, 'utf-8');
} catch (err) {
  key = sslKey;
}
let cert;
try {
  cert = fs.readFileSync(sslCertificate, 'utf-8');
} catch (err) {
  cert = sslCertificate;
}

/*------------------------------------------------------------------------*/
/*                             Ready function                             */
/*------------------------------------------------------------------------*/

// Keep track of everything that needs to be initialized
let appInitialized;
let simInitialized;
let canvasDataFetched;

const checkIfReady = () => {
  if (!appInitialized || !simInitialized || !canvasDataFetched) {
    return;
  }

  console.log('');
  console.log('Once we launch Cypress, you need to:');
  console.log('Click the "Run all specs" button on the top right');
  console.log('');
  console.log('When done running the tests, return to this window and press ctrl+c.');
  exec('$(npm bin)/cypress open', { stdio: 'inherit' });
};

/*------------------------------------------------------------------------*/
/*                         Fetch data from Canvas                         */
/*------------------------------------------------------------------------*/

let course;
let user;

const api = initCACCL({
  accessToken,
  canvasHost,
});

Promise.all([
  api.user.self.getProfile(),
  api.course.get({ courseId }),
])
  .then((data) => {
    ([user, course] = data);
    canvasDataFetched = true;
    console.log('- Fetched Canvas information');
    checkIfReady();
  })
  .catch((err) => {
    console.log('Encountered an error while attempting to fetch test data from Canvas: ', err.message);
    process.exit(0);
  });


/*------------------------------------------------------------------------*/
/*                           Initialize Fake App                          */
/*------------------------------------------------------------------------*/

const app = express();

// Set up body json parsing
app.use(bodyParser.json({
  limit: '5mb',
}));

// Set up body application/x-www-form-urlencoded parsing
app.use(bodyParser.urlencoded({
  extended: true,
  limit: '5mb',
}));

// Allow connections from localhost
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'localhost');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Start Server

// Add route for verifying self-signed certificate
app.get('/verifycert', (req, res) => {
  return res.send('Certificate accepted!');
});

// Route to redirect for app simulation
app.get('/simlaunch', (req, res) => {
  return res.redirect(`https://localhost:8088/courses/${courseId}`);
});

// Start HTTPS server
const appServer = https.createServer({
  key,
  cert,
}, app);
appServer.listen(8089, (err) => {
  if (err) {
    console.log('Could not start the test app server:', err);
  } else {
    appInitialized = true;
    console.log('- Test LTI app running on https://localhost:8089/');
    checkIfReady();
  }
});

// Add app routes

// Keep track of nonces
const nonceSeen = {};
const nonceValid = (nonce) => {
  if (!nonce || nonce.trim().length === 0) {
    return false;
  }
  const seen = !!nonceSeen[nonce];
  nonceSeen[nonce] = true;
  return !seen;
};

app.post('/launch', (req, res) => {
  isValid(req)
    .then((valid) => {
      let html = '<style>td {\nborder: 1px solid black;\n}</style>\n';
      html += '<h1>Review, then click play to resume tests</h1>\n';
      html += '<table style="width: 100%">\n<tr><td>Item</td><td>Value</td><td>Expected/Requirement</td><td>Results</td><td>Pass/Fail</td>\n';

      // eslint-disable-next-line max-params
      const addRow = (prop, expected, results, pass) => {
        html += `<tr style="background-color: ${pass ? 'white' : 'red'}; color: ${pass ? 'black' : 'white'}"><td>${prop}</td><td>${req.body[prop]}</td><td>${expected}</td><td>${results}</td><td>${pass ? 'Pass!' : 'Fail!'}</td></tr>\n`;
      };

      // Consumer key
      let pass = (req.body.oauth_consumer_key === 'consumer_key');
      addRow(
        'oauth_consumer_key',
        'Equals',
        'consumer_key',
        pass
      );

      // Request validity
      addRow(
        'request validity (expected will be undefined)',
        'is true',
        valid,
        valid
      );

      // Nonce
      pass = nonceValid(req.body.oauth_nonce);
      addRow(
        'oauth_nonce',
        'Never used',
        pass ? 'Never used' : 'Used',
        pass
      );

      // Timestamp
      const age = (
        (new Date().getTime() / 1000)
        - (req.body.oauth_timestamp || 0)
      );
      pass = (age > -1 && age <= 5);
      addRow(
        'oauth_timestamp',
        'Within last 4s',
        `Age: ${age.toFixed(3)}s`,
        pass
      );

      // Context id
      pass = (req.body.context_id === course.uuid);
      addRow(
        'context_id',
        'Equals the course uuid',
        `Should be: ${course.uuid}`,
        pass
      );
      pass = (req.body.resource_link_id === course.uuid);
      addRow(
        'resource_link_id',
        'Equals the course uuid',
        `Should be: ${course.uuid}`,
        pass
      );

      // Context label
      pass = (req.body.context_label === course.course_code);
      addRow(
        'context_label',
        'Equals the course code',
        `Should be: ${course.course_code}`,
        pass
      );

      // Context title
      pass = (req.body.context_title === course.name);
      addRow(
        'context_title',
        'Equals the course name',
        `Should be: ${course.name}`,
        pass
      );

      // Custom api domain
      pass = (req.body.custom_canvas_api_domain === 'localhost:8088');
      addRow(
        'custom_canvas_api_domain',
        'Equals localhost:8088',
        pass,
        pass
      );

      // Canvas course id
      pass = (String(req.body.custom_canvas_course_id) === String(course.id));
      addRow(
        'custom_canvas_course_id',
        'Equals course id',
        `Should be: ${course.id}`,
        pass
      );

      // custom_canvas_enrollment_state
      pass = (req.body.custom_canvas_enrollment_state === 'active');
      addRow(
        'custom_canvas_enrollment_state',
        'Is active',
        pass,
        pass
      );

      // user id
      pass = (req.body.custom_canvas_user_id === String(user.id));
      addRow(
        'custom_canvas_user_id',
        'Equals user.id',
        user.id,
        pass
      );

      // login id
      pass = (req.body.custom_canvas_user_login_id === user.login_id);
      addRow(
        'custom_canvas_user_login_id',
        'Equals login id',
        user.login_id,
        pass
      );

      // custom_canvas_workflow_state
      pass = (req.body.custom_canvas_workflow_state === 'available');
      addRow(
        'custom_canvas_workflow_state',
        'Is available',
        pass,
        pass
      );

      // ext role
      pass = (req.body.ext_roles.includes(course.enrollments[0].role));
      addRow(
        'ext_roles',
        'Matches course enrollment role',
        `Should be: ${course.enrollments[0].role}`,
        pass
      );

      // launch_presentation_document_target
      pass = (['window', 'iframe'].indexOf(req.body.launch_presentation_document_target) >= 0);
      addRow(
        'launch_presentation_document_target',
        'Is either "iframe" or "window"',
        pass,
        pass
      );

      // locale
      pass = (req.body.launch_presentation_locale === user.effective_locale);
      addRow(
        'launch_presentation_locale',
        'Equals user locale',
        `Should be: ${user.effective_locale}`,
        pass
      );

      // last name
      const lastName = user.sortable_name.split(',')[0].trim();
      pass = (req.body.lis_person_name_family === lastName);
      addRow(
        'lis_person_name_family',
        'Equals user last name',
        `Should be: ${lastName}`,
        pass
      );

      // first name
      const firstName = user.sortable_name.split(',')[1].trim();
      pass = (req.body.lis_person_name_given === firstName);
      addRow(
        'lis_person_name_given',
        'Equals user first name',
        `Should be: ${firstName}`,
        pass
      );

      // full name
      pass = (req.body.lis_person_name_full === user.name);
      addRow(
        'lis_person_name_full',
        'Equals user full name',
        `Should be ${user.name}`,
        pass
      );

      // login id
      pass = (req.body.lis_person_sourcedid === user.login_id);
      addRow(
        'lis_person_sourcedid',
        'Equals user login id',
        `Should be ${user.login_id}`,
        pass
      );

      // lti_message_type: 'basic-lti-launch-request',
      pass = (req.body.lti_message_type === 'basic-lti-launch-request');
      addRow(
        'lti_message_type',
        'Equals:',
        'basic-lti-launch-request',
        pass
      );

      // lti_version: 'LTI-1p0',
      pass = (req.body.lti_version === 'LTI-1p0');
      addRow(
        'lti_version',
        'Equals:',
        'LTI-1p0',
        pass
      );

      // roles
      pass = (req.body.roles.includes(course.enrollments[0].role));
      addRow(
        'roles',
        'Includes',
        course.enrollments[0].role,
        pass
      );

      // tool family
      pass = (req.body.tool_consumer_info_product_family_code === 'canvas');
      addRow(
        'tool_consumer_info_product_family_code',
        'Equals',
        'canvas',
        pass
      );

      // cloud
      pass = (req.body.tool_consumer_info_version === 'cloud');
      addRow(
        'tool_consumer_info_version',
        'Equals',
        'cloud',
        pass
      );

      // user uuid
      pass = (req.body.user_id === user.lti_user_id);
      addRow(
        'user_id',
        'Equals LTI user id',
        user.lti_user_id,
        pass
      );

      // User image
      pass = (req.body.user_image === user.avatar_url);
      addRow(
        'user_image',
        'Equals user.avatar_url',
        user.avatar_url,
        pass
      );

      html += '\n</table>';
      return res.send(html);
    });
});

app.get('/launch', (req, res) => {
  if (req.query.error) {
    // An error occurred
    return res.send(req.query.error);
  }
  if (Object.keys(req.query).length) {
    return res.json(req.query);
  }
  return res.json(req.body);
});

/*------------------------------------------------------------------------*/
/*                     Start Canvas Partial Simulator                     */
/*------------------------------------------------------------------------*/

initCanvasSimulation({
  accessToken,
  canvasHost,
  launchURL: 'https://localhost:8089/launch',
  onSuccess: () => {
    console.log('- Canvas simulation running on https://localhost:8088/');
    simInitialized = true;
    checkIfReady();
  },
});
