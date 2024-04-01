import { Client, GatewayIntentBits, Guild, Message } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import Database from '../database/Database.js';
import Project from '../database/projects/Project.js';
import CommandManager from './CommandManager.js';
import AnnouncementManager from './announcements/AnnouncementManager.js';


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
    public static ANNOUNCEMENT_COOLDOWN = 60000 * 5;

    private static instance: Bot;
    private _commandManager: CommandManager;
    private _announcementManager: AnnouncementManager;

    private constructor() {
        super({ intents: Object.entries(GatewayIntentBits).filter(arr => !isNaN(+arr[0])).map(arr => +arr[0]) });

        this._commandManager = new CommandManager();
        this._announcementManager = new AnnouncementManager();

        this.registerEvents();
        this.commandManager.registerCommands();
        this.loadConfig();
        this.heartbeat();
    }

    public get commandManager() {
        return this._commandManager;
    }

    public get announcementManager() {
        return this._announcementManager;
    }

    public static get guild(): Promise<Guild> {
        return Bot.getInstance().guild;
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

    public async announceProjectUpdate(project: Project, message: Message) {

    }

    public async editProjectUpdateAnnouncement(project: Project,) {

    }
}