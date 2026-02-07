import { Client, GatewayIntentBits, Guild } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import CommandManager from './CommandManager.js';
import AnnouncementManager from './announcements/AnnouncementManager.js';
import Database from '../database/Database.js';


export default class Bot extends Client {
    public static ADMIN_CHANNEL_ID: string;
    public static DISCOVERY_CHANNEL_ID: string;
    public static MAPS_FORUM_CHANNEL_ID: string;
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
        this.loadEnv();


        // this.heartbeat();
    }

    public async updateAllStaffRoles() {
        var guild = await this.guild;
        var members = await guild.members.list();

        for (const [key, member] of members)
            Database.updateStaffRoles(member.id);
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

    // private heartbeat() {
    //     var bot = this;

    //     setInterval(function () {
    //         Database.getInstance().connection.query("SELECT 1");
    //     }, 1000 * 60 * 10);
    // }

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

    private async loadEnv() {
        Bot.TOKEN = process.env.TOKEN!;
        Bot.ANNOUNCEMENT_CHANNEL_ID = process.env.ANNOUNCEMENT_CHANNEL_ID!;
        Bot.PROJECT_CATEGORY_ID = process.env.PROJECT_CATEGORY!;
        Bot.DEFAULT_PING_ROLE_ID = process.env.DEFAULT_PING_ROLE_ID!;
        Bot.GUILD_ID = process.env.GUILD_ID!;
        Bot.CLIENT_ID = process.env.CLIENT_ID!;
        Bot.LEAD_ROLE_ID = process.env.LEAD_ROLE_ID!;
        Bot.STAFF_ROLE_ID = process.env.STAFF_ROLE_ID!;
        Bot.DISCOVERY_CHANNEL_ID = process.env.DISCOVERY_CHANNEL_ID!
        Bot.MAPS_FORUM_CHANNEL_ID = process.env.MAPS_FORUM_CHANNEL_ID!
        Bot.INTAKE_ROLE_ID = process.env.INTAKE_ROLE_ID!;
        Bot.ADMIN_CHANNEL_ID = process.env.ADMIN_CHANNEL_ID!

        await this.login(Bot.TOKEN);
    }
}