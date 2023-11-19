import { Client, Collection, SlashCommandBuilder, Message, MessageFlags, PartialMessage, Events, GatewayIntentBits, TextChannel, MessageCreateOptions, ClientApplication } from 'discord.js';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import Database from "./Database.js";

export default class CrossingGuardBot extends Client {
    private static HIDDEN_CHANNELS: Array<String> = [];
    private static ANNOUNCEMENT_CHANNEL = "0";
    private static DEFAULT_ROLE_PING = "";

    private static instance: CrossingGuardBot;
    private _database: Database;
    private commands: Collection<String, { data: SlashCommandBuilder, execute: Function }>;

    private constructor() {
        super({ intents: Object.entries(GatewayIntentBits).filter(arr => !isNaN(+arr[0])).map(arr => +arr[0]) });

        this._database = Database.getInstance();
        this.commands = new Collection();

        this.loadConfig();
        this.registerEvents();
        this.registerCommands();
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
        this.once(Events.ClientReady, c => {
            console.log(`Ready! Logged in as ${c.user.tag}`);
        });

        this.on(Events.MessageCreate, message => {
            if (CrossingGuardBot.HIDDEN_CHANNELS.includes(message.channelId))
                bot.announce(message);
        });

        this.on(Events.MessageUpdate, (oldMessage, newMessage) => {
            if (CrossingGuardBot.HIDDEN_CHANNELS.includes(newMessage.channelId))
                bot.announce(newMessage, true);
        });

        this.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

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
        });
    }

    private loadConfig() {
        var bot = this;
        fs.readFile(Database.CONFIG_PATH, 'utf8', (err, data) => {
            const config = JSON.parse(data);

            CrossingGuardBot.HIDDEN_CHANNELS = config["hidden_channels"];
            CrossingGuardBot.ANNOUNCEMENT_CHANNEL = config["announcement_channel"];
            CrossingGuardBot.DEFAULT_ROLE_PING = config["default_role_ping"];
        });
    }

    public get database(): Database {
        return this._database;
    }

    public login() {
        return super.login(process.env.TEST_TOKEN);
    }

    public announce(message: Message | PartialMessage, isEdit = false) {
        let from_guild = message.flags.has(MessageFlags.IsCrosspost) ? message.reference.guildId : message.guildId;
        let to_guild = this.guilds.cache.first();
        var bot = this;

        if (!to_guild || !from_guild) {
            console.log("Guild not findable");
            return;
        }

        this._database.getProjectByGuild(from_guild).then(project => {
            var roleId = CrossingGuardBot.DEFAULT_ROLE_PING;

            if (project != null)
                roleId = project.roleId;

            to_guild.channels.fetch(CrossingGuardBot.ANNOUNCEMENT_CHANNEL).then(channel => {
                const textChannel = channel as TextChannel;

                var messageContent = `**${isEdit ? "Edited from an earlier message in " : "From "} ${message.author.displayName}**\n<@&${roleId}>\n\n${message.content}`.trim();

                do {
                    var maxSnippet = messageContent.substring(0, 2000);
                    var lastSpace = maxSnippet.lastIndexOf(' ');
                    var lastNewline = maxSnippet.lastIndexOf('\n');
                    var sending = maxSnippet.substring(0, (messageContent.length > 2000 ? (lastNewline > 0 ? lastNewline : (lastSpace > 0 ? lastSpace : maxSnippet.length)) : maxSnippet.length));

                    var messageToSend: MessageCreateOptions = {
                        content: sending.trim(),
                        embeds: message.embeds.filter(embed => { return !embed.video }),
                        files: Array.from(message.attachments.values()),
                        allowedMentions: { parse: ['roles', 'users'] }
                    }

                    messageContent = messageContent.substring(sending.length, messageContent.length);
                    textChannel.send(messageToSend);
                } while (messageContent.length > 0);
            });
        });
    }
}



let bot = CrossingGuardBot.getInstance();
bot.login();