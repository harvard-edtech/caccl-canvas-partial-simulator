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
 * @param {object} instructor - an instructor in the form:
 *   { id, profile, accessToken, api }
 * @param {object[]} tas - a list of TAs in the form:
 *   { id, profile, accessToken, api }
 * @param {object[]} students - a list of students in the form:
 *   { id, profile, accessToken, api }
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
    instructor,
    tas,
    students,
  } = config;

  /* ---------------------- Find the Sim App ---------------------- */

  let simApp;
  try {
    // Check if the course already has a fake app installed
    const apps = await instructor.api.course.app.list({ courseId });
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
      simApp = await instructor.api.course.app.add({
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
      assignments = await instructor.api.course.assignment.list({
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
        instructor,
        tas,
        students,
      }
    );
  });

  app.get('/simulator/create-assignment', async (req, res) => {
    // Pull list of assignment groups
    let assignmentGroups;
    try {
      assignmentGroups = await instructor.api.course.assignmentGroup.list({
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
      await instructor.api.course.assignment.create({
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

  app.get('/simulator/launch/:context/:id', async (req, res) => {
    // Check type of launch and parse assignmentId (if applicable)
    let isNavLaunch = true;
    let assignmentId;
    if (!Number.isNaN(parseInt(req.params.context))) {
      // Assignment ID!
      assignmentId = parseInt(req.params.context);
      isNavLaunch = false;
    }

    // Parse user's id
    const id = parseInt(req.params.id);

    // Save the current user
    currentUser.set(id);

    // Get current user's API
    const user = currentUser.get();
    if (!user || !user.api) {
      return res.send('Oops! We could not launch as the user you selected. We could not find their credentials.');
    }
    const { api } = user;

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
