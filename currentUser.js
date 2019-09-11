// Keeps track of the current launching user

let group;
let index;

// Data
let accessToken;
let instructorAPI;
let instructorProfile;
let tas;
let taAPIs;
let taProfiles;
let students;
let studentAPIs;
let studentProfiles;

module.exports = {
  /**
   * Gets the current user
   * @param {string} [group=group of the current user] - the group
   *   (instructor, ta, student)
   * @param {number} [index=index of the current user] - the index (ignored
   *   if the user is in the instructor group)
   * @param {object|null} current user in form
   *   { group, index, token, api, profile}
   */
  get: (userGroup, userIndex) => {
    const groupActual = userGroup || group;
    const indexActual = userIndex || index;
    if (!groupActual || !indexActual || !accessToken) {
      return null;
    }
    if (groupActual === 'instructor') {
      return {
        group: groupActual,
        index: indexActual,
        token: accessToken,
        api: instructorAPI,
        profile: instructorProfile,
      };
    }
    if (groupActual === 'ta') {
      return {
        group: groupActual,
        index: indexActual,
        token: tas[index],
        api: taAPIs[index],
        profile: taProfiles[index],
      };
    }
    if (groupActual === 'student') {
      return {
        group: groupActual,
        index: indexActual,
        token: students[index],
        api: studentAPIs[index],
        profile: studentProfiles[index],
      };
    }
    return null;
  },

  /**
   * Sets the new current user
   * @param {string} newGroup - the group of the current user (instructor, ta,
   *   or student)
   * @param {number} index - the index of the user (ignored for instructor)
   */
  set: (newGroup, newIndex) => {
    group = newGroup;
    index = newIndex;
  },

  /**
   * Stores relevant user data for use during get()
   */
  addData: (opts) => {
    ({
      accessToken,
      instructorAPI,
      instructorProfile,
      tas,
      taAPIs,
      taProfiles,
      students,
      studentAPIs,
      studentProfiles,
    } = opts);
  },
};
