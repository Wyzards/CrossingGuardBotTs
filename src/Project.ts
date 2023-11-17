import ProjectStaff from "./ProjectStaff";
import ProjectLink from "./ProjectLink";
import { ProjectStatus } from "./ProjectStatus";
import { GuildForumThreadMessageCreateOptions, MessageCreateOptions, MessageEditOptions } from "discord.js";

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
    private _staff: ProjectStaff[];

    public constructor(id: number, channelId: string, name: string, displayName: string, status: ProjectStatus, description: string, discordId: string, ip: string, roleId: string, links: ProjectLink[], staff: ProjectStaff[]) {
        this._id = id;
        this._channelId = channelId;
        this._name = name;
        this._displayName = displayName;
        this._status = status;
        this._description = description;
        this._guildId = discordId;
        this._ip = ip;
        this._roleId = roleId;
        this._links = links;
        this._staff = staff;
    }

    public get channelMessage(): GuildForumThreadMessageCreateOptions {
        let linksContent = this._links.length > 0 ? "> **Links**\n" : "";
        let discordLink = this._links.filter(link => link.linkName === "Discord").length ? this._links.filter(link => link.linkName === "Discord")[0].linkUrl : null;

        this._links.forEach(link => {
            linksContent += `- [${link.linkName}](${link.linkUrl})\n`;
        });

        if (this._links.length > 0)
            linksContent += "\n";

        return {
            content: this.description + "\n\n" + `\`IP | ${this._ip}\`\n\n` + linksContent + (discordLink ? `**Discord:** ${discordLink}` : "")
        };
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