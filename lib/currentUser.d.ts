import User from './shared/types/User';
declare const currentUser: {
    /**
     * Gets the current user
     * @author Gabe Abrams
     * @param [userId] the id of the current user. If not included, uses
     *   the most recently set user
     * @returns current user
     */
    get: (userId?: number) => (User | undefined);
    /**
     * Sets the new current user
     * @author Gabe Abrams
     * @param userId - the id of the current user
     */
    set: (userId: number) => void;
    /**
     * Stores relevant user data for use during get()
     * @author Gabe Abrams
     * @param teacher teacher user
     * @param tas list of ta users
     * @param students list of student users
     */
    addData: (teacher: User, tas: User[], students: User[]) => void;
};
export default currentUser;
