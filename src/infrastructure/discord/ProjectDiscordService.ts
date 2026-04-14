import { BaseMessageOptions, CategoryChannel, ChannelFlags, ChannelType, Client, createChannel, DiscordAPIError, ForumChannel, ForumThreadChannel, Guild, GuildForumTag, GuildForumTagData, GuildForumThreadMessageCreateOptions, MessageCreateOptions, MessageFlags, PermissionsBitField, Role, ThreadChannel } from "discord.js";
import { AppConfig } from "../../core/config.js";
import { Accessibility, ArchitectApproval, CommunityVetted, Project, ProjectStaff, ProjectStaffRank, ProjectStaffRankHelper, ProjectStage, ProjectStageHelper, ProjectType, ProjectTypeHelper, ProjectWithRelations } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { ProjectStageDiscordMeta } from "../../shared/projectStatusDiscord.js";
import { IOperationReporter, track } from "../../shared/operations.js";
import { isInMainList, shouldHaveDiscoveryThread, shouldHaveMapsThread, shouldHaveRole } from "../../application/ProjectRules.js";
import { ProjectMessageBuilder } from "./helpers/ProjectMessageBuilder.js";
import { ProjectEmojiHelper } from "./helpers/ProjectEmojiHelper.js";

export class ProjectDiscordService {

    public static DISCOVERY_CHANNEL_NOT_EXIST_MSG = "Tried to get Discovery channel but it doesn't exist, create it and edit .env";

    constructor(
        private config: AppConfig,
        private client: Client
    ) { }

    async updateStaffRoles(discordUserId: string, projects: ProjectWithRelations[]) {
        // TODO: Create staff retrieval endpoint and simplify this
        const guild = await this.client.guilds.fetch(this.config.discord.guildId);
        const member = await guild.members.fetch(discordUserId);

        var isStaff = false;

        for (let project of projects) {
            for (let staff of project.staff) {
                if (staff.user.discordId === discordUserId) {
                    var doReturn = false;
                    if (staff.rank === ProjectStaffRank.LEAD) {
                        await member.roles.add(this.config.discord.roles.lead);
                        doReturn = true;
                    }

                    await member.roles.add(this.config.discord.roles.staff);
                    isStaff = true;

                    if (doReturn)
                        return;
                }
            }
        }

        if (!isStaff) {
            await member.roles.remove(this.config.discord.roles.lead);
            await member.roles.remove(this.config.discord.roles.staff);
        }
    }

    async deleteChannel(channel: ForumChannel) {
        await channel.delete();
    }

    async getGuild(): Promise<Guild> {
        return this.client.guilds.fetch(this.config.discord.guildId);
    }

    async getAllMemberIds(): Promise<string[]> {
        const guild = await this.getGuild();
        const members = await guild.members.list();

        return members.map(member => member.id);
    }

    async deleteRole(role: Role) {
        await role.delete();
    }

    async fetchRole(roleId: string): Promise<Role | null> {
        const guild = await this.getGuild();

        return guild.roles.fetch(roleId).catch(() => null);
    }

    async createProjectRole(project: Project) {
        const guild = await this.getGuild();
        const role = await guild.roles.create(this.getRoleSettings(project));

        return role;
    }

    getRoleSettings(project: Project) {
        return {
            position: 2,
            hoist: true,
            name: project.display_name ?? project.name,
            color: ProjectStageDiscordMeta[project.project_stage].roleColor
        }
    }

    async fetchProjectChannel(project: Project): Promise<ForumChannel | null> {
        const guild = await this.getGuild();

        if (!project.channel_id)
            return null;

        const channel = await guild.channels.fetch(project.channel_id).catch(() => null);

        return channel as ForumChannel;
    }

    async syncPinnedChannelThread(project: ProjectWithRelations, attachments: Buffer[], channel: ForumChannel, reporter?: IOperationReporter) {
        const pinned = await this.getPinnedInForum(channel);

        if (pinned) {
            if (pinned.name == ProjectMessageBuilder.buildThreadName(project)) {
                const starterMessage = await pinned.fetchStarterMessage();
                const messages = await pinned.messages.fetch();

                if (starterMessage) {
                    const starterMessageContent = await this.getStarterMessage(project, attachments);
                    await track(reporter, 'Editing project channel thread', starterMessage.edit(starterMessageContent));
                    // Doesnt delete the actual message, just removes it from the collection
                    messages.delete(starterMessage.id);
                }

                for (const message of messages.values())
                    if (!message.system)
                        await pinned.messages.delete(message);

                await track(reporter, 'Sending project channel thread message', this.sendChannelMessage(project, pinned));
                await track(reporter, 'Setting project channel thread tags', pinned.setAppliedTags(await this.getTagsForPinnedChannelThread(project, channel)));

                return;
            }

            pinned.delete();
        }

        // Creating pinned thread if it doesn't already exist
        const starterMessage = (await this.getStarterMessage(project, attachments)) as GuildForumThreadMessageCreateOptions;
        const tags = await this.getTagsForPinnedChannelThread(project, channel);
        const thread = await channel.threads.create({
            appliedTags: tags,
            message: starterMessage,
            name: ProjectMessageBuilder.buildThreadName(project),
        });

        const pin = track(reporter, 'Pinning project channel thread', thread.pin());
        const lock = track(reporter, 'Locking project channel thread', thread.setLocked(true));
        const send = track(reporter, 'Sending project channel thread message', this.sendChannelMessage(project, thread));

        await Promise.all([pin, lock, send]);
    }

    async syncProjectChannel(project: Project, channel: ForumChannel, reporter?: IOperationReporter) {
        const guild = await this.getGuild();
        const availableTags = await this.getAvailableChannelTags(project);
        const defaultReactionEmoji = project.emoji ?? "⚔️";
        const topic = `Post anything related to ${project.display_name} here!`
        const permissionOverwrites =
            project.architect_approval == ArchitectApproval.HIDDEN ?
                [{
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: this.config.discord.roles.intake,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                }]
                :
                [];

        await track(reporter, 'Updating project display... May take up to 15 minutes. You can dismiss this message and it will still complete.', channel.edit({
            availableTags,
            permissionOverwrites: permissionOverwrites,
            defaultReactionEmoji: ProjectEmojiHelper.parse(defaultReactionEmoji),
            name: ProjectMessageBuilder.buildChannelName(project),
            topic: topic
        }));
    }

    async createProjectChannel(project: Project): Promise<ForumChannel> {
        const guild = await this.getGuild();
        const category = await this.getProjectChannelCategory();
        const channel = guild.channels.create({
            name: project.name,
            type: ChannelType.GuildForum,
            parent: category.id,
            availableTags: []
        });

        return await channel;
    }

    async getMapsChannel(): Promise<ForumChannel> {
        const guild = await this.getGuild();
        const channel = await guild.channels.fetch(this.config.discord.channels.mapsForum).catch(() => null);

        // TODO: Add self healing

        if (!channel)
            throw new Error(`Fetch for maps ForumChannel ${this.config.discord.channels.mapsForum} failed. Does it exist? Check config.`);

        return channel as ForumChannel;
    }

    async getDiscoveryChannel(): Promise<ForumChannel> {
        const guild = await this.getGuild();
        const channel = await guild.channels.fetch(this.config.discord.channels.discovery).catch(() => null);

        // TODO: Add self healing

        if (!channel)
            throw new Error(`Fetch for discovery ForumChannel ${this.config.discord.channels.discovery} failed. Does it exist? Check config.`);

        return channel as ForumChannel;
    }

    public async getDiscoveryThreadAppliedTags(project: Project): Promise<string[]> {
        const tags = [];
        const discoveryChannel = await this.getDiscoveryChannel();
        const availableTags = discoveryChannel.availableTags;
        const stageTagName = ProjectStageHelper.pretty(project.project_stage);
        const projectTypeTagName = ProjectTypeHelper.pretty(project.type);

        const statusTag: GuildForumTag | undefined = availableTags.find(tag => tag.name == stageTagName);
        const projectTypeTag: GuildForumTag | undefined = availableTags.find(tag => tag.name == projectTypeTagName);

        if (statusTag == undefined)
            throw new Error("Tried to set status tag for discovery message but status tag did not exist on discovery channel forum");
        if (projectTypeTag == undefined)
            throw new Error("Tried to set project type tag for discovery message but project type tag did not exist on discovery channel forum");

        tags.push(statusTag.id);
        tags.push(projectTypeTag.id);

        return tags;
    }

    public async getMapsThreadAppliedTags(project: Project): Promise<string[]> {
        const tags = [];
        const mapsChannel = await this.getMapsChannel();
        const availableTags = mapsChannel.availableTags;
        const stageTag = ProjectStageHelper.pretty(project.project_stage);
        const projectTypeTag = ProjectTypeHelper.pretty(project.type);

        tags.push(availableTags.find(tag => tag.name == stageTag)!.id);
        tags.push(availableTags.find(tag => tag.name == projectTypeTag)!.id);

        return tags;
    }

    public async getTagsForPinnedChannelThread(project: Project, projectChannel: ForumChannel): Promise<string[]> {
        if (project.channel_id == null)
            throw new Error(`Tried to determine pinned thread tags for project ${project.id} that has no channel_id`);

        const tags = [];

        // Channel should always be present. If channel ID was in DB but couldn't fetch, self healing should create a new one and return that.
        const availableTags = projectChannel.availableTags;
        const statusTag = ProjectStageHelper.pretty(project.project_stage);
        const projectTypeTag = ProjectTypeHelper.pretty(project.type);

        tags.push(availableTags.find(tag => tag.name == statusTag)!.id);
        tags.push(availableTags.find(tag => tag.name == projectTypeTag)!.id);

        return tags;
    }

    async syncRole(project: Project, role: Role) {
        await role.edit(this.getRoleSettings(project));
    }

    async fetchDiscoveryThread(project: Project): Promise<ForumThreadChannel | null> {
        if (!project.discovery_thread_id)
            return null;

        const guild = await this.getGuild();
        const thread = await guild.channels.fetch(project.discovery_thread_id).catch(() => null);

        return thread as ForumThreadChannel;
    }


    async deleteResources(project: ProjectWithRelations) {
        if (project.role_id) {
            const role = await this.fetchRole(project.role_id);

            if (role) {
                await role.delete();
            }
        }

        const channel = await this.fetchProjectChannel(project);

        if (channel) {
            await channel.delete();
        }

        if (project.discovery_thread_id) {
            const thread = await this.fetchDiscoveryThread(project);

            if (thread)
                thread.delete();
        }

    }

    async ensureDiscoveryThread(project: Project, attachments: Buffer[]): Promise<ForumThreadChannel | null> {
        const thread = await this.fetchDiscoveryThread(project);

        if (shouldHaveDiscoveryThread(project)) {
            if (!thread)
                return this.createDiscoveryThread(project, attachments);
            else if (thread.name !== ProjectMessageBuilder.buildDiscoveryThreadName(project)) {
                await thread.delete();
                return this.createDiscoveryThread(project, attachments);
            }
        } else if (thread) {
            await thread.delete();
            return null;
        }

        return thread;
    }

    async ensureProjectRole(project: Project): Promise<Role | null> {
        const role = project.role_id ? await this.fetchRole(project.role_id) : null;

        if (shouldHaveRole(project)) {
            if (!role)
                return this.createProjectRole(project);
        } else if (role) {
            await role.delete();
            return null;
        }

        return role;
    }

    async syncDiscoveryThread(project: ProjectWithRelations, attachments: Buffer[], thread: ForumThreadChannel | null): Promise<void> {
        if (!thread)
            return;

        await thread.edit({ appliedTags: await this.getDiscoveryThreadAppliedTags(project) });

        const starterMessage = await thread.fetchStarterMessage();
        const messages = await thread.messages.fetch();

        if (starterMessage) {
            const starterMessageContent = await this.getStarterMessage(project, attachments);
            await starterMessage.edit(starterMessageContent);
            messages.delete(starterMessage.id);
        }

        for (const message of messages.values())
            if (!message.system)
                await thread.messages.delete(message);

        await this.sendChannelMessage(project, thread);
    }

    async syncMapsChannel(project: ProjectWithRelations, attachments: Buffer[]) {
        const thread = await this.ensureMapsThread(project, attachments);

        if (!thread)
            return;

        await thread.edit({ appliedTags: await this.getMapsThreadAppliedTags(project) });

        const starterMessage = await thread.fetchStarterMessage();
        const messages = await thread.messages.fetch();

        if (starterMessage) {
            const starterMessageContent = await this.getStarterMessage(project, attachments);
            starterMessage.edit(starterMessageContent);
            messages.delete(starterMessage.id);
        }

        for (const message of messages.values())
            if (!message.system)
                await thread.messages.delete(message);

        this.sendChannelMessage(project, thread);
    }

    async getProjectChannelCategory(): Promise<CategoryChannel> {
        const guild = await this.getGuild();
        const channel = await guild.channels.fetch(this.config.discord.channels.projectCategory);

        // TODO: Add channel self healing
        if (!channel)
            throw new Error(`Category channel ${this.config.discord.channels.projectCategory} not found`);

        return channel as CategoryChannel;
    }

    async createDiscoveryThread(project: Project, attachments: Buffer[]): Promise<ForumThreadChannel> {
        const discovery = await this.getDiscoveryChannel();
        const starterMessage = await this.getStarterMessage(project, attachments);
        const discoveryThread = await discovery.threads.create({
            appliedTags: await this.getDiscoveryThreadAppliedTags(project),
            message: starterMessage as GuildForumThreadMessageCreateOptions,
            name: ProjectMessageBuilder.buildDiscoveryThreadName(project),
        }) as ForumThreadChannel;

        return discoveryThread;
    }

    async createMapsThread(project: Project, attachments: Buffer[]) {
        const mapsChannel = await this.getMapsChannel();
        const starterMessage = await this.getStarterMessage(project, attachments);
        const mapsThread = await mapsChannel.threads.create({
            appliedTags: await this.getMapsThreadAppliedTags(project),
            message: starterMessage as GuildForumThreadMessageCreateOptions,
            name: ProjectMessageBuilder.buildDiscoveryThreadName(project),
        }) as ForumThreadChannel;

        return mapsThread;
    }

    async getStarterMessage(project: Project, attachments: Buffer[]): Promise<BaseMessageOptions> {
        const content = project.description == null ? "# " + project.display_name : project.description;

        if (attachments.length == 0)
            return { content: content, files: [] };
        else
            return { content: "", files: attachments };
    }

    channelMessageContent(project: ProjectWithRelations): string {
        let linksContent = project.links.length > 0 ? "# Links\n" : "";
        let staffContent = project.staff.length > 0 ? "# Staff\n" : "";
        let discordLink = project.links.filter(link => link.label === "Discord").length ? project.links.filter(link => link.label === "Discord")[0].url : null;

        project.links.forEach(link => {
            linksContent += `- [${link.label}](${link.url})\n`;
        });

        function compare(staff1: ProjectStaff, staff2: ProjectStaff) {
            if (staff1.rank < staff2.rank)
                return -1;
            if (staff1.rank > staff2.rank)
                return 1;
            return 0;
        }

        project.staff.sort(compare).forEach(staff => {
            if (staff.user.discordId)
                staffContent += `- <@${staff.user.discordId}> ~ ${ProjectStaffRankHelper.pretty(staff.rank)}\n`;
        });

        if (project.links.length > 0)
            linksContent += "\n";
        if (project.staff.length > 0)
            staffContent += "\n";

        const content = (project.attachments.length > 0 ? project.description + "\n\n" : "") + linksContent + staffContent + (discordLink ? `**Discord:** ${discordLink}` : "");

        return content;
    }

    async sendChannelMessage(project: ProjectWithRelations, channel: ForumThreadChannel) {
        var content = this.channelMessageContent(project);

        while (content.length > 0) {
            var maxSnippet = content.substring(0, 2000);
            var lastSpace = maxSnippet.lastIndexOf(' ');
            var lastNewline = maxSnippet.lastIndexOf('\n');
            var sending = maxSnippet.substring(0, (content.length > 2000 ? (lastNewline > 0 ? lastNewline : (lastSpace > 0 ? lastSpace : maxSnippet.length)) : maxSnippet.length));

            var messageToSend: MessageCreateOptions = {
                content: sending.trim(),
                allowedMentions: { parse: [] },
                flags: MessageFlags.SuppressEmbeds
            };

            content = content.substring(sending.length, content.length);

            await channel.send(messageToSend);
        }
    }

    async ensureMapsThread(project: Project, attachments: Buffer[]): Promise<ForumThreadChannel | null> {
        const thread = await this.getMapsThread(project);

        if (shouldHaveMapsThread(project)) {
            return this.createMapsThread(project, attachments);
        } else if (thread) {
            await thread.delete();
            return null;
        }

        return thread;
    }

    async getMapsThread(project: Project): Promise<ForumThreadChannel | null> {
        const mapsChannel = await this.getMapsChannel();
        const mapThreads = await mapsChannel.threads.fetchActive();

        for (const mapThread of mapThreads.threads)
            if (mapThread[1].name == ProjectMessageBuilder.buildDiscoveryThreadName(project)) // Same format as discovery channel
                return mapThread[1] as ForumThreadChannel;

        return null;
    }

    async getPinnedInForum(forum: ForumChannel): Promise<ForumThreadChannel | null> {
        const threads = await forum.threads.fetchActive();

        for (const thread of threads.threads)
            if (thread[1].flags.has(ChannelFlags.Pinned))
                return thread[1] as ForumThreadChannel;

        return null;
    }

    public async getAvailableChannelTags(project: Project): Promise<GuildForumTagData[]> {
        const tags: GuildForumTagData[] = [];
        const typeResult = ProjectTypeHelper.pretty(project.type);
        const stageName = ProjectStageHelper.pretty(project.project_stage);

        tags.push({ name: typeResult, moderated: true });
        tags.push({ name: stageName, moderated: true });

        return tags;
    }
}