const path = require('path');
const fs = require('fs');

const currentUser = require('../currentUser');

/* eslint-disable no-console */

/**
 * Initializes simulated LTI launch functionality
 * @param {object} app - the express app to add routes to
 * @param {string} appName - the name of the app
 * @param {number} courseId - the id of the test Canvas course
 * @param {string} launchURL - the URL to launch to when simulating an LTI
 *   launch
 * @param {string} consumerKey - the consumer key of the installation for the
 *   created OAuth message
 * @param {string} consumerSecret - the consumer secret of the installation so
 *   we can encrypt the OAuth message
 * @param {caccl-api} instructorAPI - a CACCL-api instance for an instructor
 *   in the sandbox course
 * @param {object} instructorProfile - a Canvas profile object for
 *   an instructor in the sandbox course
 * @param {caccl-api[]} [taAPIs] - a list of CACCL-api instances for TAs
 *   in the sandbox course
 * @param {object[]} [taProfiles] - a list of Canvas profile object for
 *   TAs in the sandbox course
 * @param {caccl-api[]} [studentAPIs] - a list of CACCL-api instances for
 *   students in the sandbox course
 * @param {object[]} [studentProfiles] - a list of Canvas profile object for
 *   students in the sandbox course
 */
module.exports = async (config) => {
  /* ----------------------- Process Config ----------------------- */

  // Deconstruct config
  const {
    app,
    appName,
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
  } = config;

  /* ---------------------- Find the Sim App ---------------------- */

  let simApp;
  try {
    // Check if the course already has a fake app installed
    const apps = await instructorAPI.course.app.list({ courseId });
    // Search for simulated app
    for (let i = 0; i < apps.length; i++) {
      if (
        apps[i].name === appName
        && apps[i].url === launchURL
      ) {
        // Found the app!
        simApp = apps[i];
        break;
      }
    }

    // If app doesn't exist, create it
    if (!simApp) {
      // Read install XML
      const installXMLPath = path.join(__dirname, 'install.xml');
      const installXML = (
        fs
          .readFileSync(installXMLPath, 'utf-8')
          .replace(/LAUNCHURL/g, launchURL)
          .replace(/APPNAME/g, appName)
          .replace(/APPDESCRIPTION/g, 'A CACCL-based test app.')
      );

      // Create the app
      simApp = await instructorAPI.course.app.add({
        courseId,
        name: appName,
        key: consumerKey,
        secret: consumerSecret,
        xml: installXML,
      });
    }
  } catch (err) {
    console.log(`\nAn error occurred while we were setting up the test course with a simulatable LTI app: ${err.message} Now exiting.`);
    process.exit(0);
  }

  /* --------------------------- Routes --------------------------- */
  app.get('/simulator', async (req, res) => {
    // Get the list of assignments
    let assignments;
    try {
      assignments = await instructorAPI.course.assignment.list({
        courseId,
      });
    } catch (err) {
      assignments = [];
    }

    // Filter the list of assignments to only the ones for the simApp
    assignments = assignments.filter((assignment) => {
      return (
        assignment.external_tool_tag_attributes
        && assignment.external_tool_tag_attributes.url
        && assignment.external_tool_tag_attributes.url === launchURL
      );
    });

    // Render the list of assignments
    return res.render(
      path.join(__dirname, 'launchPage'),
      {
        assignments,
        instructorProfile,
        taProfiles,
        studentProfiles,
      }
    );
  });

  app.get('/simulator/create-assignment', async (req, res) => {
    // Pull list of assignment groups
    let assignmentGroups;
    try {
      assignmentGroups = await instructorAPI.course.assignmentGroup.list({
        courseId,
      });
    } catch (err) {
      return res.send(`Oops! An error occurred: ${err.message}`);
    }

    // Render the page
    return res.render(path.join(__dirname, 'createAssignment'), {
      assignmentGroups,
    });
  });

  app.post('/simulator/create-assignment', async (req, res) => {
    // Get values
    const {
      name,
      pointsPossible,
      gradingType,
      assignmentGroupId,
    } = req.body;

    // Create the assignment
    try {
      await instructorAPI.course.assignment.create({
        courseId,
        name,
        pointsPossible,
        gradingType,
        assignmentGroupId,
        assignmentAppId: simApp.id,
        assignmentAppURL: launchURL,
        assignmentAppNewTab: true,
      });

      return res.redirect('/simulator/create-assignment/done');
    } catch (err) {
      return res.send(`Oops! An error occurred: ${err.message}`);
    }
  });

  app.get('/simulator/create-assignment/done', (req, res) => {
    return res.render(path.join(__dirname, 'assignmentCreated'));
  });

  app.get('/simulator/launch/:context/:group/:index', async (req, res) => {
    // Check type of launch and parse assignmentId (if applicable)
    let isNavLaunch = true;
    let assignmentId;
    if (!Number.isNaN(parseInt(req.params.context))) {
      // Assignment ID!
      assignmentId = parseInt(req.params.context);
      isNavLaunch = false;
    }

    // Get API instance
    let api;
    if (req.params.group === 'instructor' && req.params.index === '0') {
      api = instructorAPI;
    } else if (req.params.group === 'ta') {
      api = taAPIs[parseInt(req.params.index)];
    } else if (req.params.group === 'student') {
      api = studentAPIs[parseInt(req.params.index)];
    }
    if (!api) {
      return res.send('Oops! We could not launch as the user you selected. We could not find their credentials.');
    }

    // Save the current user
    currentUser.set(req.params.group, parseInt(req.params.index));

    // Simulate a launch
    if (isNavLaunch) {
      // Simulate a nav launch
      try {
        const sessionlessLaunchURL = await api.course.app.getNavLaunchURL({
          courseId,
          appId: simApp.id,
        });

        // Send user to the launch URL
        return res.redirect(sessionlessLaunchURL);
      } catch (err) {
        return res.send(`Oops! We ran into an issue while asking Canvas for a launch URL: ${err.message}`);
      }
    } else {
      // Simulate an assignment launch
      try {
        const sessionlessLaunchURL = (
          await api.course.app.getAssignmentLaunchURL({
            courseId,
            assignmentId,
            appId: simApp.id,
          })
        );

        // Send user to the launch URL
        return res.redirect(sessionlessLaunchURL);
      } catch (err) {
        return res.send(`Oops! We ran into an issue while asking Canvas for a launch URL: ${err.message}`);
      }
    }
  });
};
