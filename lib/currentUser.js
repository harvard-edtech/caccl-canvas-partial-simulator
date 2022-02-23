"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Keeps track of the current launching user
var currentUserId;
// Data
var idToUser = new Map(); // id => user
var currentUser = {
    /**
     * Gets the current user
     * @param [userId] the id of the current user. If not included, uses
     *   the most recently set user
     * @returns current user
     *
     */
    get: function (userId) {
        return idToUser.get(userId || currentUserId);
    },
    /**
     * Sets the new current user
     * @author Gabe Abrams
     * @param userId - the id of the current user
     */
    set: function (userId) {
        currentUserId = userId;
    },
    /**
     * Stores relevant user data for use during get()
     * @author Gabe Abrams
     * @param instructor instructor user
     * @param tas list of ta users
     * @param students list of student users
     */
    addData: function (instructor, tas, students) {
        // Save instructor
        idToUser.set(instructor.id, instructor);
        // Save TAs
        tas.forEach(function (ta) {
            idToUser.set(ta.id, ta);
        });
        // Save Students
        students.forEach(function (student) {
            idToUser.set(student.id, student);
        });
        // If no current user, start with the instructor
        if (!currentUserId) {
            currentUserId = instructor.id;
        }
    },
};
exports.default = currentUser;
//# sourceMappingURL=currentUser.js.map