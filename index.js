const initAPIForwarding = require('caccl-api-forwarder');

const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const https = require('https');
const randomstring = require('randomstring');

// Import CACCL
const initCACCL = require('caccl/script');

// Local modules
const currentUser = require('./currentUser');
const initLaunches = require('./initLaunches');
const initOAuth = require('./initOAuth');

/* eslint-disable no-console */

/**
 * Initialize a simulated Canvas environment that automatically responds to
 *   OAuth authorization requests and forwards all other requests
 */

module.exports = async () => {
  /* -------------------- Config Pre-processing ------------------- */

  // Read config file
  // Attempt to get the environment config
  const launchDirectory = process.env.INIT_CWD || process.env.PWD;
  const devEnvPath = path.join(launchDirectory, 'config/devEnvironment.js');
  let config;
  try {
    config = require(devEnvPath); // eslint-disable-line global-require, import/no-dynamic-require, max-len
  } catch (err) {
    // Could not read the dev environment!
    console.log('\nNo /config/devEnvironment.js file found. Now quitting.');
    process.exit(0);
  }

  // Set up default values and make sure required values exist
  const canvasHost = config.canvasHost || 'canvas.instructure.com';
  const students = config.students || [];
  const tas = config.tas || [];
  const launchURL = config.launchURL || 'https://localhost/launch';
  const consumerKey = config.consumerKey || 'consumer_key';
  const consumerSecret = config.consumerSecret || 'consumer_secret';
  const { accessToken } = config;
  if (!accessToken) {
    // No default user
    console.log('\nNo instructor access token found in /config/devEnvironment.js. Now quitting.');
    process.exit(0);
  }
  const { courseId } = config;
  if (!courseId) {
    // No course
    console.log('\nNo courseId found in /config/devEnvironment.js. Now quitting.');
    process.exit(0);
  }

  /* --------------------------- Express -------------------------- */

  // Set up Express
  const app = express();
  const port = 8088;

  // Set up ejs
  app.set('view engine', 'ejs');

  // Set up body json parsing
  app.use(bodyParser.json({
    limit: '5mb',
  }));

  // Set up body application/x-www-form-urlencoded parsing
  app.use(bodyParser.urlencoded({
    extended: true,
    limit: '5mb',
  }));

  // Set up session (memory-based)
  // > Create random session secret
  const sessionSecret = randomstring.generate(48);
  // > Create cookie name
  const cookieName = 'canvas-sim';
  // > Set session duration to 6 hours
  const sessionDurationMillis = (360 * 60000);
  // > Add session
  app.use(session({
    cookie: {
      maxAge: sessionDurationMillis,
    },
    resave: true,
    name: cookieName,
    saveUninitialized: false,
    secret: sessionSecret,
  }));

  // Allow connections from localhost
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'localhost');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.setHeader('Access-Control-Request-Headers', '*');
    next();
  });

  /* ------------------------ Self Signing ------------------------ */

  // Use self-signed certificates
  const sslKey = path.join(__dirname, 'ssl/key.pem');
  const sslCertificate = path.join(__dirname, 'ssl/cert.pem');

  // Self-signed notice
  console.log('\nNote: we\'re using a self-signed certificate!');
  console.log(`- Please visit https://localhost:${port}/verifycert to make sure the certificate is accepted by your browser\n`);

  // Add route for verifying self-signed certificate
  app.get('/verifycert', (req, res) => {
    return res.send('Certificate accepted!');
  });

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

  /* -------------------- Create API Instances -------------------- */

  // Create a main API object
  const instructorAPI = initCACCL({
    canvasHost,
    accessToken,
  });

  // Create API objects for each student
  const studentAPIs = (students || []).map((studentAccessToken) => {
    return initCACCL({
      canvasHost,
      accessToken: studentAccessToken,
    });
  });

  // Create API objects for each TA
  const taAPIs = (tas || []).map((taAccessToken) => {
    return initCACCL({
      canvasHost,
      accessToken: taAccessToken,
    });
  });

  /* ------------------------ Pull profiles ----------------------- */

  console.log('\nJust a moment...waiting on Canvas.\n');

  let instructorProfile;
  const studentProfiles = [];
  const taProfiles = [];
  try {
    // Instructor profile
    instructorProfile = await instructorAPI.user.self.getProfile();

    // Student profiles
    for (let i = 0; i < studentAPIs.length; i++) {
      studentProfiles.push(await studentAPIs[i].user.self.getProfile());
    }

    // TA profiles
    for (let i = 0; i < taAPIs.length; i++) {
      taProfiles.push(await taAPIs[i].user.self.getProfile());
    }
  } catch (err) {
    console.log(`\nAn error occurred while attempting to get user profiles: ${err.message}. Now exiting.`);
    process.exit(0);
  }

  /* ------------- Store Data for Current User Lookup ------------- */

  currentUser.addData({
    accessToken,
    instructorAPI,
    instructorProfile,
    tas,
    taAPIs,
    taProfiles,
    students,
    studentAPIs,
    studentProfiles,
  });

  /* --------------------- Initialize Services -------------------- */

  // Initialize LTI launches
  await initLaunches({
    app,
    courseId,
    launchURL,
    consumerKey,
    consumerSecret,
    instructorAPI,
    instructorProfile,
    taAPIs,
    taProfiles,
    studentAPIs,
    studentProfiles,
  });

  // Initialize OAuth
  initOAuth({ app });

  /* ----------------- Initialize Canvas Redirects ---------------- */

  // Redirect GET requests that aren't to the API
  app.get('*', (req, res, next) => {
    // Skip if this is an API call
    if (req.path.startsWith('/api')) {
      return next();
    }

    // Redirect to Canvas
    return res.redirect(`https://${canvasHost}${req.originalUrl}`);
  });

  // Initialize the API
  initAPIForwarding({
    app,
    canvasHost,
    apiForwardPathPrefix: null,
    numRetries: 1,
  });

  /* ------------------------ Start Server ------------------------ */

  // Start HTTPS server
  const server = https.createServer({
    key,
    cert,
  }, app);

  server.listen(port);
  server.on('error', (err) => {
    if (err.message.includes('EADDRINUSE')) {
      console.log('\nThe Canvas simulator needs port 8088 but that port is taken. Now quitting.');
      process.exit(0);
    }

    console.log(`\nCould not start simulator because an error occurred: ${err.message}`);
    process.exit(0);
  });

  /* --------------------- Print Start Message -------------------- */

  // Printing helpers
  const W = process.stdout.columns;
  // Calculates the number of spaces on the left of a centered line
  const leftBuffer = (message) => {
    return (Math.floor(W / 2) - 1 - Math.ceil(message.length / 2));
  };
  // Calculates the number of spaces on the right of a centered line
  const rightBuffer = (message) => {
    return (Math.ceil(W / 2) - 1 - Math.floor(message.length / 2));
  };
  // Centers and surrounds text with a border (on left and right)
  const printMiddleLine = (str) => {
    console.log(
      '\u2551'
      + ' '.repeat(leftBuffer(str))
      + str
      + ' '.repeat(rightBuffer(str))
      + '\u2551'
    );
  };

  // Print top line
  console.log('\u2554' + '\u2550'.repeat(W - 2) + '\u2557');

  // Print middle lines
  printMiddleLine('Partially-simulated Canvas environment running!');
  printMiddleLine('To launch your app, visit:');
  printMiddleLine(`https://localhost:${port}/simulator`);

  // Print bottom line
  console.log('\u255A' + '\u2550'.repeat(W - 2) + '\u255D');
};
