import { Attachment, Client, Collection, Embed, GatewayIntentBits, Guild, Message, MessageCreateOptions, MessageFlags, PartialMessage, TextChannel } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import Database from '../database/Database.js';
import CommandManager from './CommandManager.js';

const ANNOUNCEMENT_PING_COOLDOWN_MS = 1000 * 60 * 5;

export default class Bot extends Client {
    public static DISCOVERY_CHANNEL_ID: string;
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
    public static INTAKE_ROLE_ID: string;

    private static instance: Bot;
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
        if (Bot.GUILD_ID)
            return this.guilds.fetch(Bot.GUILD_ID);
        else
            throw new Error("Guild ID was not defined in environment variables");
    }

    private heartbeat() {
        var bot = this;

        setInterval(function () {
            Database.getInstance().connection.query("SELECT 1");
        }, 1000 * 60 * 10);
    }

    private async registerEvents() {
        const eventsPath = path.join(process.cwd(), 'dist/bot/events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            await this._registerEventFileAtPath(eventsPath, file);
        }
    }

    private async _registerEventFileAtPath(eventsPath: string, file: string) {
        const filePath = path.join(eventsPath, file);
        const event = await import(pathToFileURL(filePath).toString());
        if (event.once) {
            this.once(event.name, (...args) => event.execute(...args));
        } else {
            this.on(event.name, (...args) => event.execute(...args));
        }
    }

    public static getInstance(): Bot {
        if (Bot.instance == null)
            Bot.instance = new Bot();
        return Bot.instance;
    }

    private async loadConfig() {
        var bot = this;

        fs.readFile(Database.CONFIG_PATH, 'utf8', async (err, data) => {
            const config = JSON.parse(data);

            Bot.TOKEN = config["TOKEN"];
            Bot.ANNOUNCEMENT_CHANNEL_ID = config["announcement_channel_id"];
            Bot.PROJECT_CATEGORY_ID = config["PROJECT_CATEGORY"];
            Bot.DEFAULT_PING_ROLE_ID = config["default_ping_role_id"];
            Bot.GUILD_ID = config["GUILD_ID"];
            Bot.CLIENT_ID = config["CLIENT_ID"];
            Bot.LEAD_ROLE_ID = config["lead_role_id"];
            Bot.STAFF_ROLE_ID = config["staff_role_id"];
            Bot.DISCOVERY_CHANNEL_ID = config["DISCOVERY_CHANNEL_ID"]
            Bot.INTAKE_ROLE_ID = config["INTAKE_ROLE_ID"];

            await bot.login(Bot.TOKEN);
        });
    }

    public async announce(message: Message | PartialMessage, isEdit = false) {
        const from_guild = message.flags.has(MessageFlags.IsCrosspost) && message.reference != null ? message.reference.guildId : message.guildId;
        const to_guild = this.guilds.cache.first();

        if (to_guild == null || from_guild == null)
            throw new Error(`Sending or receiving guild for announcement was not findable`);


        if (await Database.guildBelongsToProject(from_guild)) {
            const project = (await Database.getProjectByGuild(from_guild)).result;
            var roleId = project.roleId;
        } else {
            var roleId = Bot.DEFAULT_PING_ROLE_ID;
        }

        Bot.LAST_ANNOUNCEMENT_GUILD_ID = from_guild;

        const channel = await to_guild.channels.fetch(Bot.ANNOUNCEMENT_CHANNEL_ID) as TextChannel;
        const content = this.buildAnnouncementContent(from_guild, message.content == null ? "" : message.content, isEdit, message.author == null ? "somewhere..." : message.author.displayName, roleId);

        this.sendAnnouncement(content, message.embeds, message.attachments, channel);
    }

    private buildAnnouncementContent(from_guild: string, content: string, isEdit: boolean, authorName: string, roleId: string): string {
        var lastAnnouncementData = Bot.LAST_ANNOUNCEMENT_DATA.get(from_guild);
        var includePing = lastAnnouncementData == undefined || (Date.now() - lastAnnouncementData.last_ping_time > ANNOUNCEMENT_PING_COOLDOWN_MS);
        var includeHeading = Bot.LAST_ANNOUNCEMENT_GUILD_ID != from_guild || (includePing && !isEdit) || lastAnnouncementData == undefined || (lastAnnouncementData.channel_name != authorName || isEdit);
        var announcementHeading = `**${isEdit ? "Edited from an earlier message in" : "From"} ${authorName}**`;

        Bot.LAST_ANNOUNCEMENT_DATA.set(from_guild, { channel_name: authorName, last_ping_time: (includePing ? Date.now() : lastAnnouncementData ? lastAnnouncementData.last_ping_time : Date.now()) });

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
                messageToSend.files = Bot.parseAttachmentFileSizes(announcementContent, Array.from(attachments.values()));
                messageToSend.embeds = embeds.filter(embed => { return !embed.video; });
            }

            textChannel.send(messageToSend);
        } while (announcementContent.length > 0);
    }

    public static parseAttachmentFileSizes(announcementContent: string, attachments: Attachment[]): Attachment[] {
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