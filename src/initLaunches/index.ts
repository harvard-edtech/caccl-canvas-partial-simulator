// Import libs
import express from 'express';

// Import shared types
import User from '../shared/types/User';

// Import shared helpers
import currentUser from '../currentUser';
import genInstallXML from './genInstallXML';
import CanvasExternalTool from 'caccl-api/lib/types/CanvasExternalTool';

// Import shared constants
import TEST_INSTALL_CREDS from '../shared/constants/TEST_INSTALL_CREDS';

/* eslint-disable no-console */

/**
 * Initializes simulated LTI launch functionality
 * @author Gabe Abrams
 * @async
 * @param {object} opts object containing all args
 * @param {Express.Application} opts.app the express app to add routes to
 * @param {string} opts.appName the name of the app
 * @param {number} opts.courseId the id of the test Canvas course
 * @param {User} opts.teacher an instructor
 * @param {User[]} opts.tas a list of TAs
 * @param {User[]} opts.students a list of students
 * @param {object} [opts.customParams] map of custom parameters
 */
const initLaunches = async (
  opts: {
    app: express.Application,
    appName: string,
    courseId: number,
    teacher: User,
    tas: User[],
    students: User[],
    customParams?: { [k: string]: string },
  },
) => {
  const {
    app,
    appName,
    courseId,
    teacher,
    tas,
    students,
    customParams = {},
  } = opts;

  /* --------------------------- Routes --------------------------- */

  /**
   * Simulator homepage
   * @author Gabe Abrams
   */
  app.get(
    '/simulator',
    async (req, res) => {
      // Render the launch page
      return res.render(
        `${__dirname}/launchPage`,
        {
          teacher,
          tas,
          students,
        }
      );
    },
  );

  /**
   * Redirect to launch
   * @author Gabe Abrams
   * @param {number} userId user's Canvas id
   */
  app.get(
    '/simulator/users/:userId/launch',
    async (req, res) => {
      // Get the user's id
      const id = Number.parseInt(req.params.userId);

      // Save the current user
      currentUser.set(id);

      // Get current user's API
      const user = currentUser.get();
      if (!user || !user.api) {
        return res.send('Oops! We could not launch as the user you selected. We could not find their credentials.');
      }
      const { api } = user;

      // Create a unique app name
      const uniqueAppName = `CACCL Test App [${appName}] [${(new Date()).toLocaleDateString()}]`;

      // Generate an install xml
      const xml = genInstallXML({
        appName: uniqueAppName,
        customParams,
      });

      // Create a dummy app
      let testApp: CanvasExternalTool;
      try {
        testApp = await teacher.api.course.app.add({
          courseId,
          name: uniqueAppName,
          key: TEST_INSTALL_CREDS.key,
          secret: TEST_INSTALL_CREDS.secret,
          xml,
          description: 'CACCL test app (you can remove this)',
          launchPrivacy: 'members',
        });
      } catch (err) {
        return res.send(`Oops! We could not launch as the user you selected. We could not create a test app in your sandbox course because an error occurred: ${err.message}`);
      }

      // Simulate a nav launch
      try {
        const sessionlessLaunchURL = await api.course.app.getNavLaunchURL({
          courseId,
          appId: testApp.id,
        });

        // Send user to the launch URL
        res.redirect(sessionlessLaunchURL);
      } catch (err) {
        return res.send(`Oops! We ran into an issue while asking Canvas for a launch URL: ${err.message}`);
      }

      // Wait and then uninstall the test app
      await new Promise((r) => {
        setTimeout(r, 10000);
      });
      try {
        await teacher.api.course.app.remove({
          courseId,
          appId: testApp.id,
        });
      } catch (err) {
        console.log('An error occurred when trying to clean up a test app:');
        console.log(err);
      }
    },
  );
};

export default initLaunches;
