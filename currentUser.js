// Keeps track of the current launching user
let currentUserId;

// Data
const idToUserMap = {}; // id => user

module.exports = {
  /**
   * Gets the current user
   * @param {number} [id] - the id of the current user. If not included, uses
   *   the most recently set user
   * @param {object|null} current user in form
   *   { id, group, index, token, api, profile}
   */
  get: (id) => {
    return idToUserMap[id || currentUserId];
  },

  /**
   * Sets the new current user
   * @param {number} id - the id of the current user
   */
  set: (id) => {
    currentUserId = id;
  },

  /**
   * Stores relevant user data for use during get()
   */
  addData: (opts) => {
    const {
      instructor,
      tas,
      students,
    } = opts;

    // Save instructor
    idToUserMap[instructor.id] = instructor;

    // Save TAs
    tas.forEach((ta) => {
      idToUserMap[ta.id] = ta;
    });

    // Save Students
    students.forEach((student) => {
      idToUserMap[student.id] = student;
    });

    // If no current user, start with the instructor
    if (!currentUserId) {
      currentUserId = instructor.id;
    }
  },
};
