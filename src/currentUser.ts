import User from './shared/types/User';

// Keeps track of the current launching user
let currentUserId: number;

// Data
const idToUser = new Map<number, User>(); // id => user

const currentUser = {
  /**
   * Gets the current user
   * @param [userId] the id of the current user. If not included, uses
   *   the most recently set user
   * @returns current user
   */
  get: (userId?: number): (User | undefined) => {
    return idToUser.get(userId ?? currentUserId);
  },

  /**
   * Sets the new current user
   * @author Gabe Abrams
   * @param userId - the id of the current user
   */
  set: (userId: number) => {
    currentUserId = userId;
  },

  /**
   * Stores relevant user data for use during get()
   * @author Gabe Abrams
   * @param teacher teacher user
   * @param tas list of ta users
   * @param students list of student users
   */
  addData: (
    teacher: User,
    tas: User[],
    students: User[],
  ) => {
    // Save instructor
    idToUser.set(teacher.id, teacher);

    // Save TAs
    tas.forEach((ta) => {
      idToUser.set(ta.id, ta);
    });

    // Save Students
    students.forEach((student) => {
      idToUser.set(student.id, student);
    });

    // If no current user, start with the instructor
    if (!currentUserId) {
      currentUserId = teacher.id;
    }
  },
};

export default currentUser;
