import { Client, Collection, SlashCommandBuilder, Message, MessageFlags, PartialMessage, Events, GatewayIntentBits, TextChannel, MessageCreateOptions, ClientApplication } from 'discord.js';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import Database from "./Database.js";

function bestOutputs(boneCount, bitCount) {

}


export default class CrossingGuardBot extends Client {
    private static instance: CrossingGuardBot;
    private hidden_channels: Array<String> = [];
    private announcement_channel = "0";
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

    private registerCommands() {
        const foldersPath = path.join(__dirname, 'commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                const command = require(filePath);

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
            if (this.hidden_channels.includes(message.channelId))
                bot.announce(message);
        });

        this.on(Events.MessageUpdate, (oldMessage, newMessage) => {
            if (this.hidden_channels.includes(newMessage.channelId))
                bot.announce(newMessage, true);
        });

        this.on(Events.InteractionCreate, async interaction => {
            if (!interaction.isChatInputCommand()) return;

            console.log("COMMANDS RETRIEVED: " + JSON.stringify((<CrossingGuardBot>interaction.client).commands));
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

            bot.hidden_channels = config["hidden_channels"];
            bot.announcement_channel = config["announcement_channel"];
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

        if (!to_guild || !from_guild) {
            console.log("Guild not findable");
            return;
        }

        if (isEdit)
            var template = `**Edited from an earlier message in ${message.author.displayName}**\n<@&${this._database.getRoleByGuild(from_guild)}>\n\n${message.content}`;
        else
            var template = `**From ${message.author.displayName}**\n` + `<@&${this._database.getRoleByGuild(from_guild)}>\n\n${message.content} `;


        to_guild.channels.fetch(this.announcement_channel).then(channel => {
            const textChannel = channel as TextChannel;

            var messageContent = template.trim();

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
    }
}



let bot = CrossingGuardBot.getInstance();
bot.login();