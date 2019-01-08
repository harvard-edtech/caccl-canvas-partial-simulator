const initAPIForwarding = require('caccl-api-forwarder');

const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const https = require('https');
const randomstring = require('randomstring');

const initLaunches = require('./initLaunches');
const initOAuth = require('./initOAuth');

/**
 * Initialize a simulated Canvas environment that automatically responds to
 *   OAuth authorization requests and forwards all other requests
 * @author Gabriel Abrams
 * @param {string} accessToken - the access token to send to requester
 * @param {string} [canvasHost=canvas.instructure.com] - the Canvas host to
 *   forward requests to
 * @param {string} [consumerKey=consumer_key] - the consumer key of the
 *   installation for the created OAuth message
 * @param {string} [consumerSecret=consumer_secret] - the consumer secret of the
 *   installation so we can encrypt the OAuth message
 * @param {string} [launchURL=https://localhost/launch] - the url to visit for
 *   simulated LTI launches
 * @param {function} [onSuccess] - a handler function to call when the
 *   simulation has been started successfully
 */

module.exports = (config = {}) => {
  const { onSuccess } = config;

  const app = express();
  const port = 8088;

  const canvasHost = config.canvasHost || 'canvas.instructure.com';

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
    res.header('Access-Control-Allow-Origin', 'localhost');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    next();
  });

  // Start Server
  // Use self-signed certificates
  const sslKey = path.join(__dirname, 'ssl/key.pem');
  const sslCertificate = path.join(__dirname, 'ssl/cert.pem');

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

  // Start HTTPS server
  const server = https.createServer({
    key,
    cert,
  }, app);
  server.listen(port, (err) => {
    console.log('Success', port, err);
    if (err) {
      console.log(`An error occurred while trying to listen and use SSL on port ${port}:`, err);
    } else if (onSuccess) {
      onSuccess(port);
    } else {
      console.log(`Now partially simulating Canvas on port ${port}`);
    }
  });

  // Initialize LTI launches
  initLaunches({
    app,
    canvasHost,
    accessToken: config.accessToken,
    launchURL: config.launchURL || 'https://localhost/launch',
    consumerKey: config.consumerKey,
    consumerSecret: config.consumerSecret,
  });

  // Initialize OAuth
  initOAuth({
    app,
    canvasHost,
    accessToken: config.accessToken,
  });

  // Initialize the API
  initAPIForwarding({
    app,
    canvasHost,
    apiForwardPathPrefix: null,
    numRetries: 1,
  });
};
