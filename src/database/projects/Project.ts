import { ChannelFlags, DefaultReactionEmoji, ForumChannel, GuildForumThreadMessageCreateOptions, MessageEditOptions, PermissionsBitField } from "discord.js";
import Bot from "../../bot/Bot";
import Database from "../Database";
import ProjectAttachment from "./ProjectAttachment";
import ProjectLink from "./ProjectLink";
import ProjectStaff from "./ProjectStaff";
import { ProjectStaffRank } from "./ProjectStaffRank";
import { ProjectStatus } from "./ProjectStatus";
import { ProjectType } from "./ProjectType";

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

        var attachments: { attachment: string }[] = this._attachments.map(attachmentObj => { return { attachment: attachmentObj.url } });

        return {
            content: this.description + "\n\n" + (this._ip == null ? "" : `\`IP | ${this._ip}\`\n\n`) + linksContent + staffContent + (discordLink ? `**Discord:** ${discordLink}` : ""),
            allowedMentions: { parse: ['roles'] },
            files: attachments
        };
    }

    public async updateView() {
        const guild = await Bot.getInstance().guild;
        const channel = await guild.channels.edit(this.channelId, {
            permissionOverwrites: (this.status == ProjectStatus.HIDDEN ? [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                }
            ] : []),
            defaultReactionEmoji: this.emoji == null ? { id: null, name: "⚔️" } : this.emoji,
            name: ProjectStatus.channelIcon(this.status) + this.name,
            topic: `Post anything related to ${this.displayName} here!`
        }) as ForumChannel;

        const threads = await channel.threads.fetchActive();
        let forumChannelThreadExists = false;

        for (const thread of threads.threads) {
            if (thread[1].flags.has(ChannelFlags.Pinned)) {
                if (thread[1].name != this.displayName)
                    thread[1].setName(this.displayName);

                const starterMessage = await thread[1].fetchStarterMessage();

                if (starterMessage)
                    starterMessage.edit(this.channelMessage as MessageEditOptions);

                forumChannelThreadExists = true;
            }
        }

        if (!forumChannelThreadExists) {
            const threadChannel = await channel.threads.create({
                appliedTags: [channel.availableTags.filter(tag => tag.name == "About")[0].id],
                message: this.channelMessage as GuildForumThreadMessageCreateOptions,
                name: this.displayName,
            });

            threadChannel.pin();
            threadChannel.setLocked(true);
        }

        guild.roles.edit(this.roleId, { position: 2, name: this.displayName, color: ProjectStatus.roleColor(this.status) });

        // Get post in discovery section
        // Edit accordingly
        const discoveryChannel = await Database.getDiscoveryChannel(this.type);
        const discoveryThreads = await discoveryChannel.threads.fetchActive();
        let discoveryThreadExists = false;

        for (const discoveryThread of discoveryThreads.threads)
            if (discoveryThread[1].name == this.displayName) {
                const starterMessage = await discoveryThread[1].fetchStarterMessage();

                if (starterMessage)
                    starterMessage.edit(this.channelMessage as MessageEditOptions);

                discoveryThreadExists = true;
                break;
            }

        if (!discoveryThreadExists) {
            const discoveryThread = await discoveryChannel.threads.create({
                appliedTags: [],
                message: this.channelMessage as GuildForumThreadMessageCreateOptions,
                name: this.displayName,
            });
        }
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

    public save() {
        const database = Database.getInstance();
        const projectQuery = `UPDATE Projects SET channel_id = ?, guild_id = ?, emoji = ?, name = ?, display_name = ?, status = ?, description = ?, ip = ?, role_id = ?, type = ? WHERE project_id = ?`;

        database.connection.query(projectQuery, [this.channelId, this.guildId, this.emojiString, this.name, this.displayName, this.status, this.description, this.ip, this.roleId, this.type, this.id]);

        if (this.links.length > 0)
            database.connection.query("DELETE FROM Project_Links WHERE project_id = ? AND link_id NOT IN (" + this.links.map(link => link.linkId).join(", ") + ")", [this.id]);
        else
            database.connection.query("DELETE FROM Project_Links WHERE project_id = ?", [this.id]);

        for (const link of this.links)
            database.connection.query("INSERT INTO Project_Links VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE link_name = ?, link_url = ?, project_id = ?", [link.linkId, link.linkName, link.linkUrl, link.projectId, link.linkName, link.linkUrl, link.projectId]);

        if (this.staff.length > 0)
            database.connection.query("DELETE FROM Project_Staff WHERE project_id = ? AND user_id NOT IN (" + this.staff.map(staff => staff.discordUserId).join(", ") + ")", [this.id]);
        else
            database.connection.query("DELETE FROM Project_Staff WHERE project_id = ?", [this.id]);

        for (const staff of this.staff)
            database.connection.query("INSERT INTO Project_Staff VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE staff_rank = ?", [staff.discordUserId, staff.rank, staff.projectId, staff.rank]);

        if (this.attachments.length > 0)
            database.connection.query("DELETE FROM Project_Attachments WHERE project_id = ? AND attachment_id NOT IN (" + this.attachments.map(attachment => attachment.id).join(", ") + ")", [this.id]);
        else
            database.connection.query("DELETE FROM Project_Attachments WHERE project_id = ?", [this.id]);

        for (const attachment of this.attachments)
            database.connection.query("INSERT INTO Project_Attachments VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE url = ?", [attachment.projectId, attachment.id, attachment.url, attachment.url]);

        this.updateView();
    }

    public setName(newName: string) {
        this.name = newName;
        this.save();
    }

    public setDisplayName(displayName: string) {
        this.displayName = displayName;
        this.save();
    }

    public async delete() {
        const project = this;
        const guild = await Bot.getInstance().guilds.fetch(Bot.GUILD_ID);
        const members = await guild.members.fetch();
        const database = Database.getInstance();

        database.connection.query("SELECT * FROM Project_Staff", (err, data) => {
            for (const staff of project.staff) {
                var rank = null;

                for (const row of data) {
                    // If is same project, ignore
                    // Else if is same userId and head, cache head and break
                    // If just staff, cache staff and keep going
                    if (row["project_id"] == staff.projectId)
                        continue;

                    if (row["user_id"] == staff.discordUserId)
                        if (+row["staff_rank"] == ProjectStaffRank.LEAD) {
                            rank = ProjectStaffRank.LEAD;
                            break;
                        } else
                            rank = +row["staff_rank"];
                }

                if (rank == null) {
                    // Take roles
                    members.get(staff.discordUserId)?.roles.remove(Bot.LEAD_ROLE_ID);
                    members.get(staff.discordUserId)?.roles.remove(Bot.STAFF_ROLE_ID);
                } else {
                    // If staff, give staff only
                    // If lead, give staff and lead
                    if (rank == ProjectStaffRank.LEAD)
                        members.get(staff.discordUserId)?.roles.add(Bot.LEAD_ROLE_ID);
                    members.get(staff.discordUserId)?.roles.add(Bot.STAFF_ROLE_ID);
                }
            }
        })

        const channel = await guild.channels.fetch(project.channelId);
        channel?.delete();

        const role = await guild.roles.fetch(project.roleId);
        role?.delete();

        database.connection.query("DELETE FROM Project_Staff WHERE project_id = ?", [project.id])
        database.connection.query("DELETE FROM Project_Links WHERE project_id = ?", [project.id])
        database.connection.query("DELETE FROM Project_Attachments WHERE project_id = ?", [project.id])
        database.connection.query("DELETE FROM Projects WHERE project_id = ?", [project.id]);
    }
}