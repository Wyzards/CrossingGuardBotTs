import { ChannelFlags, DefaultReactionEmoji, ForumChannel, GuildForumThreadMessageCreateOptions, MessageEditOptions, PermissionsBitField } from "discord.js";
import Bot from "../../bot/Bot";
import Project from "./Project";
import { ProjectStatus } from "./ProjectStatus";
import ProjectStaff from "./ProjectStaff";
import { ProjectStaffRank } from "./ProjectStaffRank";

export default class ProjectChannel {

    private readonly _id;
    private readonly _project;
    private _emoji: DefaultReactionEmoji | null;

    public constructor(id: string, emoji: DefaultReactionEmoji | null, project: Project) {
        this._id = id;
        this._emoji = emoji;
        this._project = project;
    }

    public get id(): string {
        return this._id;
    }

    public get project(): Project {
        return this._project;
    }

    public set emoji(emojiIdOrUnicode: string) {
        this._emoji = Project.parseEmojiString(emojiIdOrUnicode);
    }

    public get emoji(): DefaultReactionEmoji | null {
        return this._emoji;
    }

    public emojiString(): string {
        if (this._emoji == null)
            return "NULL";

        if (this._emoji.id)
            return this._emoji.id;
        else if (this._emoji.name)
            return this._emoji.name;

        return "NULL";
    }

    public async update() {
        const guild = await Bot.getInstance().guild;
        const projectChannel = await guild.channels.edit(this.id,
            {
                permissionOverwrites: (this.project.status == ProjectStatus.HIDDEN ? [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    }
                ] : []),
                defaultReactionEmoji: this.emoji == null ? { id: null, name: "⚔️" } : this.emoji,
                name: ProjectStatus.channelIcon(this.project.status) + this.project.name,
                topic: `Post anything related to ${this.project.displayName} here!`
            }) as ForumChannel;

        const fetchedThreads = await projectChannel.threads.fetchActive();

        for (const thread of fetchedThreads.threads) {
            if (thread[1].flags.has(ChannelFlags.Pinned)) {
                if (thread[1].name != this.project.displayName)
                    thread[1].setName(this.project.displayName);

                const starterMessage = await thread[1].fetchStarterMessage();

                if (starterMessage)
                    starterMessage.edit(this.channelMessage() as MessageEditOptions);

                return;
            }
        }

        const threadChannel = await projectChannel.threads.create({
            appliedTags: [projectChannel.availableTags.filter(tag => tag.name == "About")[0].id],
            message: this.channelMessage() as GuildForumThreadMessageCreateOptions,
            name: this.project.displayName,
        });

        threadChannel.pin();
        threadChannel.setLocked(true);
    }

    public channelMessage(): MessageEditOptions | GuildForumThreadMessageCreateOptions {
        let linksContent = this.project.links.length > 0 ? "> **Links**\n" : "";
        let staffContent = this.project.staff.length > 0 ? "> **Staff**\n" : "";
        let discordLink = this.project.links.filter(link => link.linkName === "Discord").length ? this.project.links.filter(link => link.linkName === "Discord")[0].linkUrl : null;

        this.project.links.forEach(link => {
            linksContent += `- [${link.linkName}](${link.linkUrl})\n`;
        });

        function compare(staff1: ProjectStaff, staff2: ProjectStaff) {
            if (staff1.rank < staff2.rank)
                return -1;
            if (staff1.rank > staff2.rank)
                return 1;
            return 0;
        }

        this.project.staff.sort(compare).forEach(staff => {
            staffContent += `- <@${staff.discordUserId}> ~ ${ProjectStaffRank[staff.rank]}\n`;
        });

        if (this.project.links.length > 0)
            linksContent += "\n";
        if (this.project.staff.length > 0)
            staffContent += "\n";

        var attachments: { attachment: string }[] = this.project.attachments.map(attachmentObj => { return { attachment: attachmentObj.filePath } });

        return {
            content: this.project.description + "\n\n" + (this.project.ip == null ? "" : `\`IP | ${this.project.ip}\`\n\n`) + linksContent + staffContent + (discordLink ? `**Discord:** ${discordLink}` : ""),
            allowedMentions: { parse: ['roles'] },
            files: attachments
        };
    }
}