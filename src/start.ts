/* eslint-disable no-console */

import express from 'express';
import bodyParser from 'body-parser';
import https from 'https';
import clear from 'clear';

// Import caccl libs
import initAPIForwarding from 'caccl-api-forwarder';
import initAPI from 'caccl-api';
import CanvasUserProfile from 'caccl-api/lib/types/CanvasUserProfile';

// Import shared types
import User from './shared/types/User';
import Group from './shared/types/Group';
import API from 'caccl-api/lib/types/API';

// Import helpers
import initLaunches from './initLaunches';
import initOAuth from './initOAuth';
import parallelLimit from './helpers/parallelLimit';

// Import ssl
import cert from './ssl/cert';
import key from './ssl/key';

/*----------------------------------------*/
/*                 Set Up                 */
/*----------------------------------------*/

// Get the current working directory
const workingDir = (
  (process && process.env)
    ? (process.env.INIT_CWD || process.env.PWD)
    : '.'
);

// Get dev environment
let devEnvironment: { [k: string]: any };
try {
  // Read the file
  devEnvironment = require(`${workingDir}/config/devEnvironment.json`);

  if (!devEnvironment) {
    throw new Error();
  }
} catch (err) {
  throw new Error('Make sure you have properly configured your /config/devEnvironment.json file. See bit.ly/caccl for more information.');
}

// Make sure required fields are included
if (!devEnvironment.teacherAccessToken) {
  throw new Error('Your /config/devEnvironment.json file must include an accessToken parameter');
}
if (!devEnvironment.courseId) {
  throw new Error('Your /config/devEnvironment.json file must include a courseId parameter');
}

// Get app package.json
let packageJSON: { [k: string]: any };
try {
  // Read the file
  packageJSON = require(`${workingDir}/package.json`);
} catch (err) {
  throw new Error('We could not locate your package.json file. Please make sure you\'re starting the app from the top-level directory, which must also be an npm project.');
}

/**
 * Initialize a simulated Canvas environment that automatically responds to
 *   OAuth authorization requests and forwards all other requests
 * @author Gabe Abrams
 */
const start = async () => {
  /* ------------- Config ------------- */

  // Set up default values and make sure required values exist
  const canvasHost = String(
    devEnvironment.canvasHost
    || 'canvas.instructure.com'
  );
  const appName = packageJSON.name;
  const courseId: number = devEnvironment.courseId;
  const teacherAccessToken: string = devEnvironment.teacherAccessToken;
  const taAccessTokens: string[] = (devEnvironment.taAccessTokens ?? []);
  const studentAccessTokens: string[] = (devEnvironment.studentAccessTokens ?? []);

  /* ------------- Server ------------- */

  // Set up Express
  const app = express();

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

  // Allow cross origin connections
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
    );
    res.setHeader('Access-Control-Request-Headers', '*');
    next();
  });

  /* -------- Initialize Users -------- */

  // Show a loader
  console.log('Waiting on Canvas...');

  // Create a main API object
  const teacherAPI = initAPI({
    canvasHost,
    accessToken: teacherAccessToken,
  });
  let teacherProfile: CanvasUserProfile;

  // Verify that this API is an teacher and pull their profile
  try {
    // Pull Canvas info
    const [
      studentObjects,
      profile,
    ] = await Promise.all([
      teacherAPI.course.listStudents({ courseId }),
      teacherAPI.user.self.getProfile(),
    ]);

    // Save profile and id to teacher
    teacherProfile = profile;

    const teacherId = profile.id;
    for (let i = 0; i < studentObjects.length; i++) {
      if (studentObjects[i].id === teacherId) {
        // The "teacher" is a student!
        console.log('\nOops! The main access token in your /config/devEnvironment.js belongs to a student in the course. The main access token must belong to an teacher in the course.');
        process.exit(0);
      }
    }
  } catch (err) {
    console.log(`\nOops! An error occurred while attempting to verify the teacher API: ${err.message}`);
    process.exit(0);
  }
  const teacher: User = {
    id: teacherProfile.id,
    group: Group.Teacher,
    index: 0,
    token: teacherAccessToken,
    api: teacherAPI,
    profile: teacherProfile,
  };

  // Create API objects for each student
  const studentAPIs: API[] = studentAccessTokens.map((studentAccessToken) => {
    return initAPI({
      canvasHost,
      accessToken: studentAccessToken,
    });
  });
  
  // Get profiles for each student
  let studentProfiles: CanvasUserProfile[];
  try {
    studentProfiles = await parallelLimit(
      studentAPIs.map((api) => {
        return async () => {
          return api.user.self.getProfile();
        };
      }),
      10,
    );
  } catch (err) {
    console.log(`\nOops! An error occurred while attempting to get info on a test student: ${err.message}`);
    process.exit(0);
  }
  const students: User[] = studentAPIs.map((api, i) => {
    return {
      id: studentProfiles[i].id,
      group: Group.Student,
      index: i,
      token: studentAccessTokens[i],
      api,
      profile: studentProfiles[i],
    };
  });

  // Create API objects for each TA
  const taAPIs: API[] = taAccessTokens.map((taAccessToken) => {
    return initAPI({
      canvasHost,
      accessToken: taAccessToken,
    });
  });

  // Get profiles for each ta
  let taProfiles: CanvasUserProfile[];
  try {
    taProfiles = await parallelLimit(
      taAPIs.map((api) => {
        return async () => {
          return api.user.self.getProfile();
        };
      }),
      10,
    );
  } catch (err) {
    console.log(`\nOops! An error occurred while attempting to get info on a test ta: ${err.message}`);
    process.exit(0);
  }
  const tas: User[] = taAPIs.map((api, i) => {
    return {
      id: taProfiles[i].id,
      group: Group.TA,
      index: i,
      token: taAccessTokens[i],
      api,
      profile: taProfiles[i],
    };
  });

  /* --------------------- Initialize Services -------------------- */

  // Initialize LTI launches
  await initLaunches({
    app,
    appName,
    courseId,
    teacher,
    tas,
    students,
  });

  // Initialize OAuth
  initOAuth(app);

  /* ----------------- Initialize Canvas Redirects ---------------- */

  // Redirect GET requests that aren't to the API
  app.get(
    '*',
    (req, res, next) => {
      // Skip if this is an API call
      if (req.path.startsWith('/api')) {
        return next();
      }

      // Redirect to Canvas
      return res.redirect(`https://${canvasHost}${req.originalUrl}`);
    },
  );

  // Initialize the API
  initAPIForwarding({
    app,
    numRetries: 1,
  });

  /* ------------------------ Start Server ------------------------ */

  // Start HTTPS server
  const server = https.createServer(
    { key, cert },
    app,
  );

  server.listen(8088);
  server.on('error', (err) => {
    if (err.message.includes('EADDRINUSE')) {
      console.log('\nPort 8088 is already in use. Is another copy of the Canvas simulator already running?');
      process.exit(0);
    }

    console.log(`\nCould not start simulator because an error occurred: ${err.message}`);
    process.exit(0);
  });

  /* --------------------- Print Start Message -------------------- */
  server.on(
    'listening',
    () => {
      // Clear the terminal
      clear();

      // Printing helpers
      const W = process.stdout.columns;

      /**
       * Calculate the number of spaces on the left of a centered line
       * @author Gabe Abrams
       * @param message the centered message
       * @returns number of spaces on the left
       */
      const leftBuffer = (message: string) => {
        return (Math.floor(W / 2) - 1 - Math.ceil(message.length / 2));
      };

      /**
       * Calculate the number of spaces on the right of a centered line
       * @author Gabe Abrams
       * @param message the centered message
       * @returns number of spaces on the right
       */
      const rightBuffer = (message: string) => {
        return (Math.ceil(W / 2) - 1 - Math.floor(message.length / 2));
      };

      /**
       * Center and surround text with a border (on left and right)
       * @author Gabe Abrams
       * @param str text to print
       */
      const printMiddleLine = (str: string) => {
        console.log(
          '\u2551'
          + ' '.repeat(leftBuffer(str))
          + str
          + ' '.repeat(rightBuffer(str))
          + '\u2551'
        );
      };

      // Print start message
      console.log('Partially-simulated Canvas environment running!\n');

      // Print top of box
      console.log('\u2554' + '\u2550'.repeat(W - 2) + '\u2557');

      // Print middle lines
      printMiddleLine('To launch your app, visit:');
      printMiddleLine(`https://localhost:8088/simulator`);

      // Print bottom of box
      console.log('\u255A' + '\u2550'.repeat(W - 2) + '\u255D');

      console.log('\nYou may need to accept our self-signed certificate.');
    },
  );
};

export default start;