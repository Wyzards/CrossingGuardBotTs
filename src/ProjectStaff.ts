class ProjectStaff {

    private _projectId: number;
    private _discordUserId: string;
    private _rank: ProjectStaffRank;

    public constructor(projectId: number, discordUserId: string, rank: ProjectStaffRank) {
        this._projectId = projectId;
        this._discordUserId = discordUserId;
        this._rank = rank;
    }

    public get projectId(): number {
        return this._projectId;
    }

    public get discordUserId(): string {
        return this._discordUserId;
    }

    public get rank(): ProjectStaffRank {
        return this._rank;
    }

}