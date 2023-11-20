import ProjectStaff from "./ProjectStaff";
import ProjectLink from "./ProjectLink";
import { ProjectStatus } from "./ProjectStatus";
import { ChannelFlags, DefaultReactionEmoji, EmojiResolvable, ForumChannel, GuildForumThreadMessageCreateOptions, MessageCreateOptions, MessageEditOptions, PermissionsBitField } from "discord.js";
import CrossingGuardBot from "./CrossingGuardBot";
import { ProjectStaffRank } from "./ProjectStaffRank";

export default class Project {

    private readonly _id: number;
    private _channelId: string;
    private _name: string;
    private _displayName: string;
    private _status: ProjectStatus;
    private _description: string;
    private _guildId: string;
    private _ip: string; // Also stores version information. Ex: 1.19.2 - 1.20.2 > play.megido.xyz
    private _roleId: string;
    private _links: ProjectLink[];
    private _emoji: DefaultReactionEmoji;
    private _staff: ProjectStaff[];

    public constructor(id: number, channelId: string, name: string, displayName: string, status: ProjectStatus, description: string, discordId: string, emoji: DefaultReactionEmoji, ip: string, roleId: string, links: ProjectLink[], staff: ProjectStaff[]) {
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
    }

    public get channelMessage(): MessageEditOptions | GuildForumThreadMessageCreateOptions {
        let linksContent = this._links.length > 0 ? "> **Links**\n" : "";
        let staffContent = this._staff.length > 0 ? "> **Staff**\n" : "";
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

        return {
            content: this.description + "\n\n" + `\`IP | ${this._ip}\`\n\n` + linksContent + staffContent + (discordLink ? `**Discord:** ${discordLink}` : ""),
            allowedMentions: { parse: ['roles'] }
        };
    }

    public updateView() {
        var project = this;
        // Updating channel
        CrossingGuardBot.getInstance().guilds.fetch(process.env.GUILD_ID).then(guild => {
            guild.channels.edit(project._channelId, {
                permissionOverwrites: (project._status == ProjectStatus.HIDDEN ? [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    }
                ] : []),
                defaultReactionEmoji: this.emoji == null ? { id: null, name: "⚔️" } : this.emoji,
                name: ProjectStatus.channelIcon(project._status) + project._name,
                availableTags: [
                    { name: "About", moderated: true },
                    { name: "General" },
                    { name: "Announcement", moderated: true },
                    { name: "Review" }
                ],
                topic: `Post anything related to ${project._displayName} here!`
            }).then(function () {
                guild.channels.fetch(project._channelId).then(channel => {
                    (channel as ForumChannel).threads.fetchActive().then(threads => {
                        for (const thread of threads.threads) {
                            if (thread[1].flags.has(ChannelFlags.Pinned)) {
                                thread[1].fetchStarterMessage().then(message => {
                                    message.edit(project.channelMessage as MessageEditOptions);
                                });

                                return;
                            }
                        }

                        (channel as ForumChannel).threads.create({
                            appliedTags: [(channel as ForumChannel).availableTags.filter(tag => tag.name === "About")[0].id],
                            message: project.channelMessage as GuildForumThreadMessageCreateOptions,
                            name: project._displayName,
                        }).then(threadChannel => {
                            threadChannel.pin();
                            threadChannel.setLocked(true);
                        });
                    });
                })
            });
        });

        // Updating roles
        CrossingGuardBot.getInstance().guilds.fetch(process.env.GUILD_ID).then(guild => {
            guild.roles.edit(project._roleId, { position: 2, name: project._displayName, color: ProjectStatus.roleColor(project._status) });
        });
    }

    public get id(): number {
        return this._id;
    }

    public set channelId(id: string) {
        this._channelId = id;
    }

    public get channelId(): string {
        return this._channelId;
    }

    public get name(): string {
        return this._name;
    }

    public get displayName(): string {
        return this._displayName;
    }

    public set status(status: ProjectStatus) {
        this._status = status;
    }

    public set staff(staff: ProjectStaff[]) {
        this._staff = staff;
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

    public static parseEmojiString(emojiIdOrUnicode: string): DefaultReactionEmoji {
        if (isNaN(+emojiIdOrUnicode)) // Unicode
            return { id: null, name: emojiIdOrUnicode };
        else
            return { id: emojiIdOrUnicode, name: null };
    }

    public get emoji(): DefaultReactionEmoji {
        return this._emoji;
    }

    public get emojiString(): string {
        if (this._emoji == null)
            return "NULL";

        if (this._emoji.name == null)
            return this._emoji.id;

        return this._emoji.name;
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

    public get staff(): ProjectStaff[] {
        return this._staff;
    }
}