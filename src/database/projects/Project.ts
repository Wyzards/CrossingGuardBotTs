import { UpdateProjectPayload } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { AnyThreadChannel, BaseMessageOptions, CategoryChannel, ChannelFlags, ChannelType, DefaultReactionEmoji, ForumChannel, GuildForumTagData, GuildForumThreadMessageCreateOptions, MessageCreateOptions, MessageFlags, PermissionsBitField, TextBasedChannel } from "discord.js";
import Bot from "../../bot/Bot.js";
import Database from "../Database.js";
import Result from "../Result.js";
import ProjectAttachment from "./ProjectAttachment.js";
import ProjectLink from "./ProjectLink.js";
import ProjectStaff from "./ProjectStaff.js";
import { ProjectStaffRank } from "./ProjectStaffRank.js";
import { ProjectStatus } from "./ProjectStatus.js";
import { ProjectType } from "./ProjectType.js";

export default class Project {

    private readonly _id: number;
    private _channelId: string | null;
    private _name: string;
    private _displayName: string;
    private _status: ProjectStatus;
    private _description: string;
    private _guildId: string;
    private _ip: string; // Also stores version information. Ex: 1.19.2 - 1.20.2 > play.megido.xyz
    private _roleId: string;
    private _links: ProjectLink[];
    private _emoji: DefaultReactionEmoji | null;
    private _staff: ProjectStaff[];
    private _attachments: ProjectAttachment[];
    private _type: ProjectType;

    public constructor(id: number, channelId: string, name: string, displayName: string, status: ProjectStatus, description: string, discordId: string, emoji: DefaultReactionEmoji, ip: string, roleId: string, links: ProjectLink[], staff: ProjectStaff[], attachments: ProjectAttachment[], type: ProjectType) {
        this._id = id;
        this._channelId = channelId;
        this._name = name;
        this._displayName = displayName;
        this._status = status;
        this._description = description;
        this._guildId = discordId;
        this._emoji = emoji;
        this._ip = ip;
        this._roleId = roleId;
        this._links = links;
        this._staff = staff;
        this._attachments = attachments;
        this._type = type;
    }

    /**
 * Factory for creating a Project instance from API / database response.
 * Assumes the response includes the ID and all necessary fields.
 */
    public static fromApi(apiDto: any): Project {
        return new Project(
            apiDto.project_id,
            apiDto.channel_id,
            apiDto.name,
            apiDto.display_name,
            apiDto.status as ProjectStatus,
            apiDto.description,
            apiDto.guild_id,
            apiDto.emoji ?? null,
            apiDto.ip ?? "",
            apiDto.role_id,
            apiDto.links ?? [],
            apiDto.staff ?? [],
            apiDto.attachments ?? [],
            apiDto.type as ProjectType
        );
    }

    public toUpdatePayload(): UpdateProjectPayload {
        return {
            channel_id: this.channelId ?? undefined,
            guild_id: this.guildId ?? undefined,
            emoji: this.emoji?.id ?? this.emoji?.name ?? undefined,
            name: this.name,
            display_name: this.displayName,
            status: this.status?.toString(),  // Or convert to whatever API expects
            description: this.description,
            ip: this.ip,
            role_id: this.roleId,
            type: this.type?.toString(),      // Or convert to API string representation
        };
    }


    public channelMessageContent(): string {
        let linksContent = this._links.length > 0 ? "# Links\n" : "";
        let staffContent = this._staff.length > 0 ? "# Staff\n" : "";
        let discordLink = this._links.filter(link => link.linkName === "Discord").length ? this._links.filter(link => link.linkName === "Discord")[0].linkUrl : null;

        this._links.forEach(link => {
            linksContent += `- [${link.linkName}](${link.linkUrl})\n`;
        });

        function compare(staff1: ProjectStaff, staff2: ProjectStaff) {
            if (staff1.rank < staff2.rank)
                return -1;
            if (staff1.rank > staff2.rank)
                return 1;
            return 0;
        }

        this._staff.sort(compare).forEach(staff => {
            staffContent += `- <@${staff.discordUserId}> ~ ${ProjectStaffRank[staff.rank]}\n`;
        });

        if (this._links.length > 0)
            linksContent += "\n";
        if (this._staff.length > 0)
            staffContent += "\n";

        const content = (this.attachments.length > 0 ? this.description + "\n\n" : "") + linksContent + staffContent + (discordLink ? `**Discord:** ${discordLink}` : "");

        return content;
    }

    public getStarterMessage(): BaseMessageOptions {
        if (this.attachments.length == 0)
            return { content: this.description == null ? "# " + this.displayName : this.description, files: [] };
        else
            return { content: "", files: this.attachments.map(attachment => attachment.sendableAttachment) };
    }

    public sendChannelMessage(channel: TextBasedChannel) {
        var content = this.channelMessageContent();

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

            channel.send(messageToSend);
        }
    }

    public async updateView() {
        const guild = await Bot.getInstance().guild;


        await guild.roles.edit(this.roleId, { position: 2, name: this.displayName, color: ProjectStatus.roleColor(this.status) });

        await this.updateChannel();
        await this.updateDiscovery();
        await this.updateMapsThread(); // If not a map, will delete a matching maps thread then do nothing
    }

    public async getChannel(): Promise<Result<ForumChannel>> {
        const guild = await Bot.getInstance().guild;
        const channel = this.channelId == null ? null : await guild.channels.fetch(this.channelId);

        if (channel == null)
            return new Result<ForumChannel>(null, false);
        else
            return new Result(channel as ForumChannel, true);
    }

    public async updateChannel() {
        const guild = await Bot.getInstance().guild;
        const channelResult = await this.getChannel();
        var projectChannel: ForumChannel;

        if (channelResult.exists) {
            projectChannel = channelResult.result;

            if (this.type == ProjectType.MAP) {
                await projectChannel.delete();
                this.channelId = null;
                await Database.getProjectRepo().save(this);
                return;
            }
        } else {
            if (this.type == ProjectType.MAP)
                return;

            const category = await guild.channels.fetch(Bot.PROJECT_CATEGORY_ID) as CategoryChannel;
            projectChannel = await Project.makeBlankChannel(this.name, category);
            this._channelId = projectChannel.id;
            await Database.getProjectRepo().save(this);
        }

        await projectChannel.setAvailableTags(await this.getAvailableChannelTags());
        await projectChannel.permissionOverwrites.set(this.status == ProjectStatus.HIDDEN ? [
            {
                id: guild.roles.everyone.id,
                deny: [PermissionsBitField.Flags.ViewChannel]
            },
            {
                id: Bot.INTAKE_ROLE_ID,
                allow: [PermissionsBitField.Flags.ViewChannel]
            }
        ] : [])
        await projectChannel.setDefaultReactionEmoji(this.emoji == null ? { id: null, name: "⚔️" } : this.emoji);
        await projectChannel.setName(ProjectStatus.channelIcon(this.status) + "｜" + this.name);
        await projectChannel.setTopic(`Post anything related to ${this.displayName} here!`)
        // MAY BE AN ISSUE NOT SETTING FLAGS HERE?

        const pinnedThreadResult = await Project.getPinnedInForum(projectChannel);

        if (pinnedThreadResult.exists) {
            const thread = pinnedThreadResult.result;
            const threadName = this.threadName;

            if (thread.name != threadName) {
                thread.delete();
            } else {
                const starterMessage = await thread.fetchStarterMessage();
                const messages = await thread.messages.fetch();

                if (starterMessage) {
                    starterMessage.edit(this.getStarterMessage());
                    messages.delete(starterMessage.id);
                }

                for (const message of messages.values())
                    if (!message.system)
                        await thread.messages.delete(message);

                this.sendChannelMessage(thread);
                thread.setAppliedTags(await this.getTagsForPinnedChannelThread());
                return;
            }
        }

        // Creating pinned thread if it doesn't already exist
        const thread = await projectChannel.threads.create({
            appliedTags: await this.getTagsForPinnedChannelThread(),
            message: this.getStarterMessage() as GuildForumThreadMessageCreateOptions,
            name: this.threadName,
        });

        await thread.pin();
        await thread.setLocked(true);

        this.sendChannelMessage(thread as TextBasedChannel);
    }

    public get threadName() {
        return this.displayName + (this.status == ProjectStatus.PLAYABLE && this.ip != null ? ` >>> ${this.ip}` : "");
    }

    public static async getMapsChannel(): Promise<ForumChannel> {
        const guild = await Bot.getInstance().guild;
        const channel = await guild.channels.fetch(Bot.MAPS_FORUM_CHANNEL_ID);

        return channel as ForumChannel;
    }

    public static async getDiscoveryChannel(): Promise<ForumChannel> {
        const guild = await Bot.getInstance().guild;
        const channel = await guild.channels.fetch(Bot.DISCOVERY_CHANNEL_ID);

        return channel as ForumChannel;
    }

    public async updateMapsThread() {
        if (this.status == ProjectStatus.HIDDEN)
            return;

        const mapsThreadResult = await this.getMapsThread();
        var mapsThread: AnyThreadChannel<boolean>;

        if (mapsThreadResult.exists) {
            mapsThread = mapsThreadResult.result;
            await mapsThread.edit({ appliedTags: await this.getMapsThreadAppliedTags() });

            if (this.type != ProjectType.MAP) {
                await mapsThread.delete();
                return;
            }
        } else {
            if (this.type != ProjectType.MAP)
                return;

            mapsThread = await this.createMapsThread();
        }

        const starterMessage = await mapsThread.fetchStarterMessage();
        const messages = await mapsThread.messages.fetch();

        if (starterMessage) {
            starterMessage.edit(this.getStarterMessage());
            messages.delete(starterMessage.id);
        }

        for (const message of messages.values())
            if (!message.system)
                await mapsThread.messages.delete(message);

        this.sendChannelMessage(mapsThread);
    }

    public async updateDiscovery() {
        if (this.status == ProjectStatus.HIDDEN)
            return;

        const discoveryThreadResult = await this.getDiscoveryThread();
        var discoveryThread: AnyThreadChannel<boolean>;

        if (discoveryThreadResult.exists) {
            discoveryThread = discoveryThreadResult.result;
            await discoveryThread.edit({ appliedTags: await this.getDiscoveryThreadAppliedTags() });
        } else {
            discoveryThread = await this.createDiscoveryThread();
        }

        const starterMessage = await discoveryThread.fetchStarterMessage();
        const messages = await discoveryThread.messages.fetch();

        if (starterMessage) {
            starterMessage.edit(this.getStarterMessage());
            messages.delete(starterMessage.id);
        }

        for (const message of messages.values())
            if (!message.system)
                await discoveryThread.messages.delete(message);

        this.sendChannelMessage(discoveryThread);
    }

    public async createDiscoveryThread() {
        const discoveryChannel = await Project.getDiscoveryChannel();
        const discoveryThread = await discoveryChannel.threads.create({
            appliedTags: await this.getDiscoveryThreadAppliedTags(),
            message: this.getStarterMessage() as GuildForumThreadMessageCreateOptions,
            name: this.discoveryChannelName,
        }) as AnyThreadChannel<boolean>;

        return discoveryThread;
    }

    public async createMapsThread() {
        const mapsChannel = await Project.getMapsChannel();
        const mapsThread = await mapsChannel.threads.create({
            appliedTags: await this.getMapsThreadAppliedTags(),
            message: this.getStarterMessage() as GuildForumThreadMessageCreateOptions,
            name: this.discoveryChannelName, // Correct, uses same format as discovery channel
        }) as AnyThreadChannel<boolean>;

        return mapsThread;
    }

    public async getDiscoveryThreadAppliedTags(): Promise<string[]> {
        const tags = [];
        const availableTags = (await Project.getDiscoveryChannel()).availableTags;
        const statusTagResult = ProjectStatus.prettyName(this.status);
        const projectTypeTagResult = ProjectType.prettyName(this.type);

        if (statusTagResult.exists)
            tags.push(availableTags.find(tag => tag.name == statusTagResult.result)!.id);

        if (projectTypeTagResult.exists)
            tags.push(availableTags.find(tag => tag.name == projectTypeTagResult.result)!.id);

        return tags;
    }

    public async getMapsThreadAppliedTags(): Promise<string[]> {
        const tags = [];
        const availableTags = (await Project.getMapsChannel()).availableTags;
        const statusTagResult = ProjectStatus.prettyName(this.status);
        const projectTypeTagResult = ProjectType.prettyName(this.type);

        if (statusTagResult.exists)
            tags.push(availableTags.find(tag => tag.name == statusTagResult.result)!.id);

        if (projectTypeTagResult.exists)
            tags.push(availableTags.find(tag => tag.name == projectTypeTagResult.result)!.id);

        return tags;
    }

    public async getAvailableChannelTags(): Promise<GuildForumTagData[]> {
        const tags: GuildForumTagData[] = [];
        const typeResult = ProjectType.prettyName(this.type);
        const statusResult = ProjectStatus.prettyName(this.status);

        if (typeResult.exists)
            tags.push({ name: typeResult.result, moderated: true });

        if (statusResult.exists)
            tags.push({ name: statusResult.result, moderated: true });

        return tags;
    }

    public async getTagsForPinnedChannelThread(): Promise<string[]> {
        const tags = [];
        const channelResult = await this.getChannel();

        if (!channelResult.exists)
            throw new Error("Tried to get applied tags for the pinned thread of a project that has no channel. Is it a map?");

        const availableTags = channelResult.result.availableTags;
        const statusTagResult = ProjectStatus.prettyName(this.status);
        const projectTypeTagResult = ProjectType.prettyName(this.type);

        if (statusTagResult.exists)
            tags.push(availableTags.find(tag => tag.name == statusTagResult.result)!.id);

        if (projectTypeTagResult.exists)
            tags.push(availableTags.find(tag => tag.name == projectTypeTagResult.result)!.id);

        return tags;
    }

    public get id(): number {
        return this._id;
    }

    public set channelId(id: string | null) {
        this._channelId = id;
    }

    public get channelId(): string | null {
        return this._channelId;
    }

    public set type(type: ProjectType) {
        this._type = type;
    }

    public set name(newName: string) {
        this._name = newName;
    }

    public get name(): string {
        return this._name;
    }

    public set displayName(displayName: string) {
        this._displayName = displayName;
    }

    public get displayName(): string {
        return this._displayName;
    }

    public set status(status: ProjectStatus) {
        this._status = status;
    }

    public get status(): ProjectStatus {
        return this._status;
    }

    public set description(description: string) {
        this._description = description;
    }

    public get description(): string {
        return this._description;
    }

    public set guildId(id: string) {
        this._guildId = id;
    }

    public get guildId(): string {
        return this._guildId;
    }

    public set emoji(emojiIdOrUnicode: string) {
        this._emoji = Project.parseEmojiString(emojiIdOrUnicode);
    }

    public static parseEmojiString(emojiIdOrUnicode: string): DefaultReactionEmoji | null {
        if (emojiIdOrUnicode == null || emojiIdOrUnicode.toUpperCase() === "NULL")
            return null;
        if (isNaN(+emojiIdOrUnicode)) // Unicode
            return { id: null, name: emojiIdOrUnicode };
        else
            return { id: emojiIdOrUnicode, name: null };
    }

    public get emoji(): DefaultReactionEmoji | null {
        return this._emoji;
    }

    public get emojiString(): string {
        if (this._emoji == null)
            return "NULL";

        if (this._emoji.id)
            return this._emoji.id;
        else if (this._emoji.name)
            return this._emoji.name;

        return "NULL";
    }

    public set ip(ip: string) {
        this._ip = ip;
    }

    public get ip(): string {
        return this._ip;
    }

    public set roleId(roleId: string) {
        this._roleId = roleId;
    }

    public get roleId(): string {
        return this._roleId;
    }

    public set links(links: ProjectLink[]) {
        this._links = links;
    }

    public get links(): ProjectLink[] {
        return this._links;
    }

    public addStaff(staff: ProjectStaff): boolean {
        // Person is already staff
        if (this._staff.some(existingStaff => existingStaff.discordUserId === staff.discordUserId)) {
            // Set rank

            var alreadyExists = false;
            this._staff.filter(existingStaff => existingStaff.discordUserId === staff.discordUserId).forEach(existingStaff => {
                if (existingStaff.rank == staff.rank)
                    alreadyExists = true;
                else
                    existingStaff.rank = staff.rank;
            });

            if (alreadyExists)
                return false;
        } else {
            this._staff.push(staff);
        }

        return true;
    }

    public set staff(staff: ProjectStaff[]) {
        this._staff = staff;
    }

    public get staff(): ProjectStaff[] {
        return this._staff;
    }

    public set attachments(attachments: ProjectAttachment[]) {
        this._attachments = attachments;
    }

    public get attachments(): ProjectAttachment[] {
        return this._attachments;
    }

    public get type(): ProjectType {
        return this._type;
    }

    public async setName(newName: string) {
        this.name = newName;
        await Database.getProjectRepo().save(this);
    }

    public async setDisplayName(displayName: string) {
        this.displayName = displayName;
        await Database.getProjectRepo().save(this);
    }

    public async delete(): Promise<boolean> {
        const guild = await Bot.getInstance().guilds.fetch(Bot.GUILD_ID);

        for (const staff of this.staff) {
            await Database.updateStaffRoles(staff.discordUserId);
        }

        if (this.type != ProjectType.MAP) {
            const channel = await this.getChannel();

            if (channel.exists)
                channel.result.delete();
        }

        const discoveryThreadResult = await this.getDiscoveryThread();

        if (discoveryThreadResult.exists)
            await discoveryThreadResult.result.delete();


        const role = await guild.roles.fetch(this.roleId);
        role?.delete();

        const deleted = await Database.getProjectRepo().delete(this);

        return deleted;
    }

    public async getMapsThread(): Promise<Result<AnyThreadChannel<boolean>>> {
        const mapsChannel = await Project.getMapsChannel();
        const mapThreads = await mapsChannel.threads.fetchActive();

        for (const mapThread of mapThreads.threads)
            if (mapThread[1].name == this.discoveryChannelName) // Same format as discovery channel
                return new Result(mapThread[1], true);

        return new Result<AnyThreadChannel<boolean>>(null, false);
    }

    public async getDiscoveryThread(): Promise<Result<AnyThreadChannel<boolean>>> {
        const discoveryChannel = await Project.getDiscoveryChannel();
        const discoveryThreads = await discoveryChannel.threads.fetchActive();

        for (const discoveryThread of discoveryThreads.threads)
            if (discoveryThread[1].name == this.discoveryChannelName)
                return new Result(discoveryThread[1], true);

        return new Result<AnyThreadChannel<boolean>>(null, false);
    }

    public static async getPinnedInForum(forum: ForumChannel): Promise<Result<AnyThreadChannel<boolean>>> {
        const threads = await forum.threads.fetchActive();

        for (const thread of threads.threads)
            if (thread[1].flags.has(ChannelFlags.Pinned))
                return new Result(thread[1], true);

        return new Result<AnyThreadChannel<boolean>>(null, false);
    }

    public get discoveryChannelName(): string {
        return ProjectStatus.channelIcon(this.status) + " " + this.threadName;
    }

    public static async makeBlankChannel(name: string, category: CategoryChannel) {
        const guild = await Bot.getInstance().guild;

        return await guild.channels.create({
            name: name,
            type: ChannelType.GuildForum,
            parent: category.id,
            availableTags: []
        });
    }
}
