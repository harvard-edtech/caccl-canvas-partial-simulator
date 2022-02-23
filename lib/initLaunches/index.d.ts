import express from 'express';
import User from '../shared/types/User';
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
declare const initLaunches: (opts: {
    app: express.Application;
    appName: string;
    courseId: number;
    teacher: User;
    tas: User[];
    students: User[];
    customParams?: {
        [k: string]: string;
    };
}) => Promise<void>;
export default initLaunches;
