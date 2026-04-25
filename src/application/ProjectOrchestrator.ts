import { Project, ProjectLink, ProjectStaff, ProjectStaffRank, ProjectType, ProjectWithRelations } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { Attachment, ForumChannel, ForumThreadChannel, Role } from "discord.js";
import { ProjectRepository } from "../infrastructure/api/ProjectRepository.js";
import { ProjectDiscordService } from "../infrastructure/discord/ProjectDiscordService.js";
import { IOperationReporter } from "../shared/operations.js";
import { shouldHaveChannel } from "./ProjectRules.js";

export class ProjectOrchestrator {
    constructor(
        public readonly repo: ProjectRepository,
        private discordService: ProjectDiscordService
    ) { }

    async setDiscord(project: Project, guildId: string) {
        project.guild_id = guildId;

        return this.save(project);
    }

    async setAttachments(project: ProjectWithRelations, attachments: Attachment[]) {
        await this.repo.storeAttachments(project.id, attachments);
    }

    async addLink(project: ProjectWithRelations, label: string, url: string, reporter: IOperationReporter): Promise<ProjectWithRelations> {
        const link = await this.repo.addLink(project.id, { url: url, label: label });
        project.links.push(link);

        return this.save(project);
    }

    async removeLink(project: ProjectWithRelations, link: ProjectLink, reporter: IOperationReporter): Promise<ProjectWithRelations> {
        await this.repo.removeLink(project.id, link.id);

        const links = project.links.filter(l => l.label !== link.label);
        project.links = links;

        return project;
    }

    async removeStaff(project: ProjectWithRelations, staff: ProjectStaff, reporter: IOperationReporter) {
        if (!staff.user.discordId) {
            throw new Error("Tried to remove staff by discord ID where discordId undefined");
        }

        const existing = project.staff.find(s => s.user.discordId === staff.user.discordId);

        if (existing) {
            await this.repo.removeStaffByDiscord(project.id, staff.user.discordId);
            const remainingStaff = project.staff.filter(s => s.user.discordId !== staff.user.discordId);
            project.staff = remainingStaff;
        }
    }

    async save(project: Project): Promise<ProjectWithRelations> {
        const saved = await this.repo.save(project);

        return saved;
    }

    async delete(project: ProjectWithRelations) {
        await this.discordService.deleteResources(project);
        await this.repo.delete(project.id);

        for (const staff of project.staff) {
            if (staff.user.discordId)
                await this.updateStaffRoles(staff.user.discordId);
        }
    }

    async addOrSetStaff(project: ProjectWithRelations, discordUserId: string, rank: ProjectStaffRank, reporter: IOperationReporter) {
        const newStaff = await this.repo.addOrSetStaff(project.id, discordUserId, rank);
        const existingIndex = project.staff.findIndex(s => s.user.id === newStaff.user.id);

        if (existingIndex >= 0)
            project.staff[existingIndex] = newStaff;
        else
            project.staff.push(newStaff);

        await this.updateStaffRoles(discordUserId);
    }

    async updateStaffRoles(discordUserId: string) {
        const projects = await this.repo.list();

        await this.discordService.updateStaffRoles(discordUserId, projects);
    }

    public async updateAllStaffRoles() {
        for (const memberId in this.discordService.getAllMemberIds())
            await this.updateStaffRoles(memberId);
    }

    private async syncRole(project: Project, reporter?: IOperationReporter) {
        const role = await this.ensureProjectRole(project);

        if (role) {
            await this.discordService.syncRole(project, role);
        }
    }

    private async createProjectChannel(project: Project): Promise<ForumChannel> {
        const channel = await this.discordService.createProjectChannel(project);
        project.channel_id = channel.id;

        await this.save(project);

        return channel;
    }

    async ensureChannel(project: Project): Promise<ForumChannel | null> {
        const channel = await this.discordService.fetchProjectChannel(project);
        const channelShouldExist = shouldHaveChannel(project);

        if (channelShouldExist && !channel) {
            return this.createProjectChannel(project);
        }

        else if (!channelShouldExist && channel) {
            await this.discordService.archiveProjectChannel(project, channel);
            return null;
        }

        return channel as ForumChannel;
    }

    async sync(project: ProjectWithRelations, onAfterSync: () => Promise<void>, reporter?: IOperationReporter) {
        const attachments = await this.repo.downloadAttachments(project);

        await this.syncRole(project, reporter);
        await this.syncProjectChannel(project, attachments, reporter);

        for (const staff of project.staff)
            if (staff.user.discordId)
                await this.updateStaffRoles(staff.user.discordId);

        await onAfterSync();
    }

    private async syncProjectChannel(project: ProjectWithRelations, attachments: Buffer[], reporter?: IOperationReporter) {
        const channel = await this.ensureChannel(project);

        if (!channel)
            return;

        await this.discordService.syncProjectChannel(project, channel, reporter);
        await this.discordService.syncPinnedChannelThread(project, attachments, channel, reporter);
    }

    async ensureProjectRole(project: Project): Promise<Role | null> {
        const role = await this.discordService.ensureProjectRole(project);

        project.role_id = role?.id;

        await this.save(project);

        return role;
    }

    async createNewProject(name: string, displayName: string, type: ProjectType): Promise<ProjectWithRelations> {
        const project = await this.repo.create({ name, display_name: displayName, type });

        return project;
    }
}