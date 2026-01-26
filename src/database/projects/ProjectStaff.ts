import Bot from "../../bot/Bot.js";
import Database from "../Database.js";
import { ProjectStaffRank } from "./ProjectStaffRank.js";

export default class ProjectStaff {

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

    public set rank(rank: ProjectStaffRank) {
        this._rank = rank;
    }

    public get rank(): ProjectStaffRank {
        return this._rank;
    }

    public async updateStaffRoles() {
        const guild = await Bot.getInstance().guild;
        const member = await guild.members.fetch(this._discordUserId);
        const projectList = await Database.projectList();

        var isStaff = false;

        for (let project of projectList) {
            for (let staff of project.staff) {
                if (staff.discordUserId === this._discordUserId) {
                    var doReturn = false;
                    if (staff.rank === ProjectStaffRank.LEAD) {
                        await member.roles.add(Bot.LEAD_ROLE_ID);
                        doReturn = true;
                    }

                    await member.roles.add(Bot.STAFF_ROLE_ID);
                    isStaff = true;

                    if (doReturn)
                        return;
                }
            }
        }

        if (!isStaff) {
            await member.roles.remove(Bot.LEAD_ROLE_ID);
            await member.roles.remove(Bot.STAFF_ROLE_ID);
        }
    }

}