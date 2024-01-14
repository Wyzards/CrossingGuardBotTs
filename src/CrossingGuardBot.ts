import { Attachment, Client, Collection, DataResolver, Events, GatewayIntentBits, Guild, Message, MessageCreateOptions, MessageFlags, PartialMessage, RESTEvents, SlashCommandBuilder, TextChannel } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import Database from "./Database";

const ANNOUNCEMENT_PING_COOLDOWN_MS = 1000 * 60 * 5;

export default class CrossingGuardBot extends Client {
    private static HIDDEN_CHANNELS: Array<String> = [];
    private static ANNOUNCEMENT_CHANNEL_ID: string;
    private static DEFAULT_PING_ROLE_ID: string;
    private static TOKEN: string;
    public static GUILD_ID: string;
    public static CLIENT_ID: string;
    public static PROJECT_CATEGORY_ID: string;
    public static STAFF_ROLE_ID: string;
    public static LEAD_ROLE_ID: string;
    public static LAST_ANNOUNCEMENT_DATA: Map<string, { channel_name: string, last_ping_time: number }> = new Map();

    private static instance: CrossingGuardBot;
    private _database: Database;
    private commands: Collection<String, { data: SlashCommandBuilder, execute: Function, autocomplete?: Function }>;

    private constructor() {
        super({ intents: Object.entries(GatewayIntentBits).filter(arr => !isNaN(+arr[0])).map(arr => +arr[0]) });

        this._database = new Database();
        this.commands = new Collection();
        var bot = this;

        this.registerEvents();
        this.registerCommands();
        this.loadConfig();

        setInterval(function () {
            bot.database.connection.query("SELECT 1");
        }, 1000 * 60 * 10);
    }

    public get guild(): Promise<Guild> {
        if (CrossingGuardBot.GUILD_ID)
            return this.guilds.fetch(CrossingGuardBot.GUILD_ID);
        else
            throw new Error("Guild ID was not defined in environment variables");
    }

    public static getInstance(): CrossingGuardBot {
        if (CrossingGuardBot.instance == null)
            CrossingGuardBot.instance = new CrossingGuardBot();
        return CrossingGuardBot.instance;
    }

    private async registerCommands() {
        const foldersPath = path.join(__dirname, 'commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);

                const command = await import(filePath);

                if ('data' in command && 'execute' in command) {
                    this.commands.set(command.data.name, command);
                } else {
                    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
                }
            }
        }
    }

    private registerEvents() {
        var bot = this;
        this.once(Events.ClientReady, async c => {
            console.log(`Ready! Logged in as ${c.user.tag}`);

            var guild = await bot.guild;
            var members = await guild.members.list();

            for (const [key, member] of members) {
                await bot.database.updateStaffRoles(member.id);
            }

            var guild = await bot.guild;
            var members = await guild.members.list();

            for (const [key, member] of members)
                await bot.database.updateStaffRoles(member.id);
        });

        this.rest.on(RESTEvents.RateLimited, console.log);

        this.on(Events.MessageCreate, message => {
            if (CrossingGuardBot.HIDDEN_CHANNELS.includes(message.channelId))
                bot.announce(message);
        });

        this.on(Events.MessageUpdate, (oldMessage, newMessage) => {
            if (CrossingGuardBot.HIDDEN_CHANNELS.includes(newMessage.channelId))
                bot.announce(newMessage, true);
        });

        this.on(Events.InteractionCreate, async interaction => {
            if (interaction.isChatInputCommand()) {
                const command = (<CrossingGuardBot>interaction.client).commands.get(interaction.commandName);

                if (!command) {
                    console.error(`No command matching ${interaction.commandName} was found.`);
                    return;
                }

                try {
                    await command.execute(interaction);
                } catch (error) {
                    console.error(error);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                }
            } else if (interaction.isAutocomplete()) {
                const command = (<CrossingGuardBot>interaction.client).commands.get(interaction.commandName);

                if (!command) {
                    console.error(`No command matching ${interaction.commandName} was found.`);
                    return;
                }

                try {
                    if (command.autocomplete)
                        await command.autocomplete(interaction);
                } catch (error) {
                    console.error(error);
                }
            }
        });
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

    public get database(): Database {
        return this._database;
    }

    public announce(message: Message | PartialMessage, isEdit = false) {
        const from_guild = message.flags.has(MessageFlags.IsCrosspost) && message.reference != null ? message.reference.guildId : message.guildId;
        const to_guild = this.guilds.cache.first();


        if (to_guild == null || from_guild == null)
            throw new Error(`Sending or receiving guild for announcement was not findable`);

        let projectPromise = CrossingGuardBot.getInstance().database.getProjectByGuild(from_guild);

        if (projectPromise)
            projectPromise.then(project => {
                var roleId = CrossingGuardBot.DEFAULT_PING_ROLE_ID;
                var lastAnnouncementData = CrossingGuardBot.LAST_ANNOUNCEMENT_DATA.get(from_guild);
                // Can ping once every 5 minutes
                // Distinct announcements get their own heading
                // Can send heading without a ping

                if (project != null)
                    roleId = project.roleId;

                if (to_guild !== undefined)
                    to_guild.channels.fetch(CrossingGuardBot.ANNOUNCEMENT_CHANNEL_ID).then(channel => {
                        const textChannel = channel as TextChannel;
                        var files: Attachment[] = [];
                        var includePing = lastAnnouncementData == undefined || (Date.now() - lastAnnouncementData.last_ping_time > ANNOUNCEMENT_PING_COOLDOWN_MS);
                        var includeHeading = (includePing && !isEdit) || lastAnnouncementData == undefined || (lastAnnouncementData.channel_name != message.author?.displayName || isEdit);
                        var announcementHeading = `**${isEdit ? "Edited from an earlier message in" : "From"} ${message.author == null ? "somewhere..." : message.author.displayName}**`;
                        var announcementPing = `<@&${roleId}>`;

                        var announcementContent = `${includeHeading ? announcementHeading + "\n" : ""}${includePing ? announcementPing + "\n\n" : ""}${message.content}`;

                        Array.from(message.attachments.values()).forEach(attachment => {
                            if (attachment.size > 26209158) {
                                announcementContent += "\n" + attachment.url;
                            } else {
                                files.push(attachment);
                            }
                        });

                        CrossingGuardBot.LAST_ANNOUNCEMENT_DATA.set(from_guild, { channel_name: message.author != null ? message.author.displayName : "", last_ping_time: (includePing ? Date.now() : lastAnnouncementData ? lastAnnouncementData.last_ping_time : Date.now()) });

                        do {
                            var maxSnippet = announcementContent.substring(0, 2000);
                            var lastSpace = maxSnippet.lastIndexOf(' ');
                            var lastNewline = maxSnippet.lastIndexOf('\n');
                            var sending = maxSnippet.substring(0, (announcementContent.length > 2000 ? (lastNewline > 0 ? lastNewline : (lastSpace > 0 ? lastSpace : maxSnippet.length)) : maxSnippet.length));

                            var messageToSend: MessageCreateOptions = {
                                content: sending.trim(),
                                embeds: message.embeds.filter(embed => { return !embed.video }),
                                files: [],
                                allowedMentions: { parse: ['roles', 'users'] }
                            }

                            announcementContent = announcementContent.substring(sending.length, announcementContent.length);

                            if (announcementContent.length < 1)
                                messageToSend.files = files;

                            textChannel.send(messageToSend);
                        } while (announcementContent.length > 0);
                    });
            });
        else
            throw new Error("Failed to find a project by guild id during announcement crosspost");
    }
}



let bot = CrossingGuardBot.getInstance();

function ensureError(value: unknown): Error {
    if (value instanceof Error) return value

    let stringified = '[Unable to stringify the thrown value]'
    try {
        stringified = JSON.stringify(value)
    } catch { }

    const error = new Error(`This value was thrown as is, not through an Error: ${stringified}`)
    return error
}