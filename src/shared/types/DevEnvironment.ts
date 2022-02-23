type DevEnvironment = {
  // Hostname of the real Canvas instance
  canvasHost: string,
  // Id of the sandbox course
  courseId: number,
  // Name of the app being tested
  appName: string,
  // Teacher or admin's access token
  accessToken: string,
  // Access tokens for TAs
  tas?: string[],
  // Access tokens for students
  students?: string[],
};

export default DevEnvironment;
