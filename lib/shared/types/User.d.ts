import Group from './Group';
import API from 'caccl-api/lib/types/API';
import CanvasUserProfile from 'caccl-api/lib/types/CanvasUserProfile';
declare type User = {
    id: number;
    group: Group;
    index: number;
    token: string;
    api: API;
    profile: CanvasUserProfile;
};
export default User;
