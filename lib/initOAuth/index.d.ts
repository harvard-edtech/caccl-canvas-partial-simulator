import express from 'express';
/**
 * Initializes simulated LTI launch functionality
 * @param app the express app to add routes to
 */
declare const initOAuth: (app: express.Application) => void;
export default initOAuth;
