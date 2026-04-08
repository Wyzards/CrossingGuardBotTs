import { Accessibility, ArchitectApproval, CommunityVetted, ProjectStaffRankHelper, ProjectStage, ProjectStageHelper, ProjectType, ProjectTypeHelper, UpdateProjectPayload, ProjectWithRelations, ProjectLink, ProjectStaff } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { ChannelFlags, ChannelType, DefaultReactionEmoji, DiscordAPIError, ForumChannel, ForumThreadChannel, GuildForumTag, GuildForumTagData } from "discord.js";
import { ProjectService } from "../../application/ProjectService.js";
import Bot from "../../bot/Bot.js";
import { ProjectStageDiscordMeta } from "../../shared/projectStatusDiscord.js";
import ProjectAttachment from "./ProjectAttachment.js";

export default class Project {

    public static DISCOVERY_CHANNEL_NOT_EXIST_MSG = "Tried to get Discovery channel but it doesn't exist, create it and edit .env";

    public id: number;
    public name: string;
    public displayName: string | undefined;
    public description: string | undefined;
    private emoji: DefaultReactionEmoji | undefined;
    public channelId: string | undefined;
    public discoveryThreadId: string | undefined;
    public roleId: string | undefined;
    public guildId: string | undefined;
    public ip: string | undefined;
    public version: string | undefined;
    public links: ProjectLink[];
    public staff: ProjectStaff[];
    public attachments: ProjectAttachment[];
    public type: ProjectType;
    public stage: ProjectStage;
    public accessibility: Accessibility;
    public communityVetted: CommunityVetted;
    public architectApproval: ArchitectApproval

    public constructor(dto: ProjectWithRelations) {
        this.id = dto.id;
        this.name = dto.name;
        this.displayName = dto.display_name;
        this.description = dto.description;
        this.emoji = dto.emoji ? this.parseEmojiString(dto.emoji) : undefined;
        this.channelId = dto.channel_id;
        this.discoveryThreadId = dto.discovery_thread_id;
        this.roleId = dto.role_id;
        this.guildId = dto.guild_id;
        this.ip = dto.ip;
        this.version = dto.version;
        this.links = dto.links;
        this.staff = dto.staff;
        this.attachments = dto.attachments.map(dto => new ProjectAttachment(dto));
        this.type = dto.type;
        this.stage = dto.project_stage;
        this.accessibility = dto.accessibility;
        this.communityVetted = dto.community_vetted;
        this.architectApproval = dto.architect_approval;
    }

    public toUpdatePayload(): UpdateProjectPayload {
        return {
            channel_id: this.channelId ?? undefined,
            guild_id: this.guildId ?? undefined,
            emoji: this.emoji?.id ?? this.emoji?.name ?? undefined,
            name: this.name,
            display_name: this.displayName,
            description: this.description ?? "",
            ip: this.ip ?? undefined,
            role_id: this.roleId ?? undefined,
            type: this.type,      // Or convert to API string representation
            version: this.version ?? undefined,
            discovery_thread_id: this.discoveryThreadId ?? undefined,
            project_stage: this.stage,
            community_vetted: this.communityVetted,
            architect_approval: this.architectApproval,
            accessibility: this.accessibility
        };
    }

    public async getChannel(): Promise<ForumChannel> {
        const guild = await Bot.getInstance().guild;

        if (this.channelId == null)
            return new Result<ForumChannel>(null, false);

        try {
            const channel = await guild.channels.fetch(this.channelId);

            if (channel == null)
                return new Result<ForumChannel>(null, false);
            else
                return new Result(channel as ForumChannel, true);
        } catch (err) {
            if (err instanceof DiscordAPIError && (err as DiscordAPIError).code === 10003) {
                return new Result<ForumChannel>(null, false);
            }

            throw err;
        }
    }

    public isInMainList() {
        return this.architectApproval == ArchitectApproval.APPROVED && ([CommunityVetted.ACCEPTED, CommunityVetted.SKIPPED].includes(this.communityVetted))
    }

    public static async getMapsChannel(): Promise<ForumChannel> {

        const guild = await Bot.getInstance().guild;
        try {
            const channel = await guild.channels.fetch(Bot.MAPS_FORUM_CHANNEL_ID);

            return channel as ForumChannel;

        } catch (err) {
            if (err instanceof DiscordAPIError && (err as DiscordAPIError).code === 10003) {
                throw new Error("Tried to get Maps channel but it doesn't exist, create it and edit .env");
            }

            throw err;
        }
    }

    public static async getDiscoveryChannel(): Promise<ForumChannel> {
        const guild = await Bot.getInstance().guild;

        try {
            const channel = await guild.channels.fetch(Bot.DISCOVERY_CHANNEL_ID);

            return channel as ForumChannel;
        } catch (err) {
            if (err instanceof DiscordAPIError && (err as DiscordAPIError).code === 10003) {
                throw new Error(Project.DISCOVERY_CHANNEL_NOT_EXIST_MSG);
            }

            throw err;
        }
    }





    public static async createDiscoveryChannel(): Promise<ForumChannel> {
        const guild = await Bot.guild;
        const channel = await guild.channels.create<ChannelType.GuildForum>({ name: "🔎｜discover-rpgs", type: ChannelType.GuildForum });

        return channel;
    }





    public async getDiscoveryThreadAppliedTags(): Promise<string[]> {
        const tags = [];
        const discoveryChannel = await Project.getDiscoveryChannel();
        const availableTags = discoveryChannel.availableTags;
        const stageTagName = ProjectStageHelper.pretty(this.stage);
        const projectTypeTagName = ProjectTypeHelper.pretty(this.type);

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

    public async getMapsThreadAppliedTags(): Promise<string[]> {
        const tags = [];
        const availableTags = (await Project.getMapsChannel()).availableTags;
        const stageTag = ProjectStageHelper.pretty(this.stage);
        const projectTypeTag = ProjectTypeHelper.pretty(this.type);

        tags.push(availableTags.find(tag => tag.name == stageTag)!.id);
        tags.push(availableTags.find(tag => tag.name == projectTypeTag)!.id);

        return tags;
    }

    public async getAvailableChannelTags(): Promise<GuildForumTagData[]> {
        const tags: GuildForumTagData[] = [];
        const typeResult = ProjectTypeHelper.pretty(this.type);
        const stageName = ProjectStageHelper.pretty(this.stage);

        tags.push({ name: typeResult, moderated: true });
        tags.push({ name: stageName, moderated: true });

        return tags;
    }

    public async getTagsForPinnedChannelThread(): Promise<string[]> {
        const tags = [];
        const channelResult = await this.getChannel();

        if (!channelResult.exists)
            throw new Error("Tried to get applied tags for the pinned thread of a project that has no channel. Is it a map?");

        const availableTags = channelResult.result.availableTags;
        const statusTag = ProjectStageHelper.pretty(this.stage);
        const projectTypeTag = ProjectTypeHelper.pretty(this.type);

        tags.push(availableTags.find(tag => tag.name == statusTag)!.id);
        tags.push(availableTags.find(tag => tag.name == projectTypeTag)!.id);

        return tags;
    }

    public async setName(newName: string) {
        this.name = newName;
        await ProjectService.getInstance().save(this);
    }

    public async setDisplayName(displayName: string) {
        this.displayName = displayName;
        await ProjectService.getInstance().save(this);
    }

    public async delete(): Promise<boolean> {

        const deleted = await ProjectService.getInstance().repo.delete(this);

        return deleted;
    }

    public async getMapsThread(): Promise<Result<ForumThreadChannel>> {
        const mapsChannel = await Project.getMapsChannel();
        const mapThreads = await mapsChannel.threads.fetchActive();

        for (const mapThread of mapThreads.threads)
            if (mapThread[1].name == this.discoveryChannelName) // Same format as discovery channel
                return new Result(mapThread[1] as ForumThreadChannel, true);

        return new Result<ForumThreadChannel>(null, false);
    }

    public async getDiscoveryThread(): Promise<Result<ForumThreadChannel>> {
        if (this.discoveryThreadId) {
            const guild = await Bot.getInstance().guild;
            const thread = await guild.channels.fetch(this.discoveryThreadId).catch(() => null);

            if (!thread) {
                const newThread = await this.createDiscoveryThread();
                return new Result(newThread as ForumThreadChannel, true);
            }

            return new Result(thread as ForumThreadChannel, true);
        }

        return new Result<ForumThreadChannel>(null, false);
    }

    public static async getPinnedInForum(forum: ForumChannel): Promise<Result<ForumThreadChannel>> {
        const threads = await forum.threads.fetchActive();

        for (const thread of threads.threads)
            if (thread[1].flags.has(ChannelFlags.Pinned))
                return new Result(thread[1] as ForumThreadChannel, true);

        return new Result<ForumThreadChannel>(null, false);
    }

    public get discoveryChannelName(): string {
        return ProjectStageDiscordMeta[this.stage].channelIcon + " " + this.threadName;
    }
}
