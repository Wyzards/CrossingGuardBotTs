import { ProjectStaffRank } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { CrossroadsUser } from "@wyzards/crossroadsclientts/dist/users/types.js";

export default class ProjectStaff {

    private _projectId: number;
    private _user: CrossroadsUser;
    private _rank: ProjectStaffRank;

    public constructor(projectId: number, user: CrossroadsUser, rank: ProjectStaffRank) {
        this._projectId = projectId;
        this._user = user;
        this._rank = rank;
    }

    public get projectId(): number {
        return this._projectId;
    }

    public get user(): CrossroadsUser {
        return this._user;
    }

    public set rank(rank: ProjectStaffRank) {
        this._rank = rank;
    }

    public get rank(): ProjectStaffRank {
        return this._rank;
    }

}