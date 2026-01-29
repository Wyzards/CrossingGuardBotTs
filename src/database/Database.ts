import { CreateProjectPayload } from '@wyzards/crossroadsclientts/dist/projects/types.js';
import { CategoryChannel } from 'discord.js';
import Bot from "../bot/Bot.js";
import { ProjectRepository } from '../repositories/ProjectRepository';
import { apiClient } from "../services/apiClient";
import Project from "./projects/Project.js";
import { ProjectStaffRank } from "./projects/ProjectStaffRank.js";
import { ProjectStatus } from "./projects/ProjectStatus.js";
import { ProjectType } from "./projects/ProjectType.js";
import Result from './Result.js';

export default class Database {

    private static projectRepo = new ProjectRepository(apiClient);

    public static getProjectRepo() {
        return Database.projectRepo;
    }

    public static async guildBelongsToProject(guildId: string): Promise<boolean> {
        const project = await Database.getProjectByGuild(guildId);

        return project.exists;
    }

    public static async getProjectByGuild(guildId: string): Promise<Result<Project>> {
        const project = await this.projectRepo.getByGuild(guildId);

        return project ? new Result(project, true) : new Result<Project>(null, false);
    }

    public static async getProjectByName(name: string): Promise<Result<Project>> {
        const project = await Database.projectRepo.getByName(name);

        return project ? new Result(project, true) : new Result<Project>(null, false);
    }

    public static async projectList(): Promise<Project[]> {
        const projects = await Database.projectRepo.list();

        return projects;
    }

    public static async addProject(name: string, displayName: string, channelId: string | null, roleId: string, type: ProjectType): Promise<Project> {
        const payload: CreateProjectPayload = {
            name: name,
            display_name: displayName,
            channel_id: channelId ?? undefined,
            role_id: roleId,
            type: type.toString(), // or however ProjectType maps to API
            guild_id: undefined,
            emoji: undefined,
            status: ProjectStatus.HIDDEN.toString(),
            description: undefined,
            ip: undefined,
        };

        const createdProject = await Database.projectRepo.create(payload);

        return createdProject;
    }


    public static async createNewProject(name: string, displayName: string, type: ProjectType): Promise<Project> {
        const guild = await Bot.getInstance().guild;
        const role = await guild.roles.create({
            hoist: true,
            name: displayName
        });
        const category = await guild.channels.fetch(Bot.PROJECT_CATEGORY_ID) as CategoryChannel;

        if (!category)
            throw new Error(`Category channel does not exist`);


        if (type == ProjectType.MAP) {
            var project = await Database.addProject(name, displayName, null, role.id, type);
        } else {
            const channel = await Project.makeBlankChannel(name, category);
            var project = await Database.addProject(name, displayName, channel.id, role.id, type);
        }

        return project;
    }

    public static async projectExists(name: string): Promise<boolean> {
        const project = await Database.getProjectByName(name);

        return project.exists;
    }

    public static async updateStaffRoles(discordUserId: string) {
        const guild = await Bot.getInstance().guild;
        const member = await guild.members.fetch(discordUserId);
        const projectList = await Database.projectList();

        var isStaff = false;

        for (let project of projectList) {
            for (let staff of project.staff) {
                if (staff.discordUserId === discordUserId) {
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