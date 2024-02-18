import { Attachment, Client, Collection, Embed, GatewayIntentBits, Guild, Message, MessageCreateOptions, MessageFlags, PartialMessage, TextChannel } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import Database from '../database/Database';
import CommandManager from './CommandManager';

const ANNOUNCEMENT_PING_COOLDOWN_MS = 1000 * 60 * 5;

export default class CrossingGuardBot extends Client {
    public static HIDDEN_CHANNELS: Array<String> = [];
    public static ANNOUNCEMENT_CHANNEL_ID: string;
    public static DEFAULT_PING_ROLE_ID: string;
    private static TOKEN: string;
    public static GUILD_ID: string;
    public static CLIENT_ID: string;
    public static PROJECT_CATEGORY_ID: string;
    public static STAFF_ROLE_ID: string;
    public static LEAD_ROLE_ID: string;
    public static LAST_ANNOUNCEMENT_GUILD_ID: string;
    public static LAST_ANNOUNCEMENT_DATA: Map<string, { channel_name: string, last_ping_time: number }> = new Map();

    private static instance: CrossingGuardBot;
    private _commandManager;

    private constructor() {
        super({ intents: Object.entries(GatewayIntentBits).filter(arr => !isNaN(+arr[0])).map(arr => +arr[0]) });

        this._commandManager = new CommandManager();

        this.registerEvents();
        this.commandManager.registerCommands();
        this.loadConfig();
        this.heartbeat();
    }

    public get commandManager() {
        return this._commandManager;
    }

    public get guild(): Promise<Guild> {
        if (CrossingGuardBot.GUILD_ID)
            return this.guilds.fetch(CrossingGuardBot.GUILD_ID);
        else
            throw new Error("Guild ID was not defined in environment variables");
    }

    private heartbeat() {
        var bot = this;

        setInterval(function () {
            Database.getInstance().connection.query("SELECT 1");
        }, 1000 * 60 * 10);
    }

    private registerEvents() {
        const eventsPath = path.join(__dirname, 'events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            this._registerEventFileAtPath(eventsPath, file);
        }
    }

    private _registerEventFileAtPath(eventsPath: string, file: string) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            this.once(event.name, (...args) => event.execute(...args));
        } else {
            this.on(event.name, (...args) => event.execute(...args));
        }
    }

    public static getInstance(): CrossingGuardBot {
        if (CrossingGuardBot.instance == null)
            CrossingGuardBot.instance = new CrossingGuardBot();
        return CrossingGuardBot.instance;
    }

    private async loadConfig() {
        var bot = this;

        fs.readFile(Database.CONFIG_PATH, 'utf8', async (err, data) => {
            const config = JSON.parse(data);

            CrossingGuardBot.TOKEN = config["TOKEN"];
            CrossingGuardBot.HIDDEN_CHANNELS = config["hidden_channels"];
            CrossingGuardBot.ANNOUNCEMENT_CHANNEL_ID = config["announcement_channel_id"];
            CrossingGuardBot.PROJECT_CATEGORY_ID = config["PROJECT_CATEGORY"];
            CrossingGuardBot.DEFAULT_PING_ROLE_ID = config["default_ping_role_id"];
            CrossingGuardBot.GUILD_ID = config["GUILD_ID"];
            CrossingGuardBot.CLIENT_ID = config["CLIENT_ID"];
            CrossingGuardBot.LEAD_ROLE_ID = config["lead_role_id"];
            CrossingGuardBot.STAFF_ROLE_ID = config["staff_role_id"];

            bot.login(CrossingGuardBot.TOKEN);
        });
    }

    public async announce(message: Message | PartialMessage, isEdit = false) {
        const from_guild = message.flags.has(MessageFlags.IsCrosspost) && message.reference != null ? message.reference.guildId : message.guildId;
        const to_guild = this.guilds.cache.first();

        if (to_guild == null || from_guild == null)
            throw new Error(`Sending or receiving guild for announcement was not findable`);

        const project = await Database.getProjectByGuild(from_guild);

        CrossingGuardBot.LAST_ANNOUNCEMENT_GUILD_ID = from_guild;

        const channel = await to_guild.channels.fetch(CrossingGuardBot.ANNOUNCEMENT_CHANNEL_ID) as TextChannel;
        const content = this.buildAnnouncementContent(from_guild, message.content == null ? "" : message.content, isEdit, message.author == null ? "somewhere..." : message.author.displayName, project.roleId);

        this.sendAnnouncement(content, message.embeds, message.attachments, channel);
    }

    private buildAnnouncementContent(from_guild: string, content: string, isEdit: boolean, authorName: string, roleId: string): string {
        var lastAnnouncementData = CrossingGuardBot.LAST_ANNOUNCEMENT_DATA.get(from_guild);
        var includePing = lastAnnouncementData == undefined || (Date.now() - lastAnnouncementData.last_ping_time > ANNOUNCEMENT_PING_COOLDOWN_MS);
        var includeHeading = CrossingGuardBot.LAST_ANNOUNCEMENT_GUILD_ID != from_guild || (includePing && !isEdit) || lastAnnouncementData == undefined || (lastAnnouncementData.channel_name != authorName || isEdit);
        var announcementHeading = `**${isEdit ? "Edited from an earlier message in" : "From"} ${authorName}**`;

        CrossingGuardBot.LAST_ANNOUNCEMENT_DATA.set(from_guild, { channel_name: authorName, last_ping_time: (includePing ? Date.now() : lastAnnouncementData ? lastAnnouncementData.last_ping_time : Date.now()) });

        return `${includeHeading ? announcementHeading + "\n" : ""}${includePing ? `<@&${roleId}>\n\n` : ""}${content}`;
    }

    private sendAnnouncement(announcementContent: string, embeds: Embed[], attachments: Collection<string, Attachment>, textChannel: TextChannel) {
        do {
            var maxSnippet = announcementContent.substring(0, 2000);
            var lastSpace = maxSnippet.lastIndexOf(' ');
            var lastNewline = maxSnippet.lastIndexOf('\n');
            var sending = maxSnippet.substring(0, (announcementContent.length > 2000 ? (lastNewline > 0 ? lastNewline : (lastSpace > 0 ? lastSpace : maxSnippet.length)) : maxSnippet.length));

            var messageToSend: MessageCreateOptions = {
                content: sending.trim(),
                allowedMentions: { parse: ['users'] }
            };

            announcementContent = announcementContent.substring(sending.length, announcementContent.length);

            if (announcementContent.length < 1) {
                messageToSend.files = CrossingGuardBot.parseAttachmentFileSizes(announcementContent, attachments);
                messageToSend.embeds = embeds.filter(embed => { return !embed.video; });
            }

            textChannel.send(messageToSend);
        } while (announcementContent.length > 0);
    }

    private static parseAttachmentFileSizes(announcementContent: string, attachments: Collection<String, Attachment>): Attachment[] {
        var files = [];

        for (const attachment of Array.from(attachments.values())) {
            if (attachment.size > 26209158) {
                announcementContent += "\n" + attachment.url;
            } else {
                files.push(attachment);
            }
        }

        return files;
    }
}