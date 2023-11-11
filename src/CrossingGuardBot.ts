import { Client, Message, MessageFlags, PartialMessage, Events, GatewayIntentBits, TextChannel, MessageCreateOptions } from 'discord.js';
import 'dotenv/config';
import * as fs from 'fs';
import Database from "./Database.js";

class CrossingGuardBot extends Client {
    private hidden_channels: Array<String> = [];
    private announcement_channel = "0";
    private database: Database;

    constructor() {
        super({ intents: Object.entries(GatewayIntentBits).filter(arr => !isNaN(+arr[0])).map(arr => +arr[0]) });

        this.database = Database.getInstance();
        this.loadConfig();
        this.registerEvents();
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
    }

    private loadConfig() {
        var bot = this;
        fs.readFile(Database.CONFIG_PATH, 'utf8', (err, data) => {
            const config = JSON.parse(data);

            bot.hidden_channels = config["hidden_channels"];
            bot.announcement_channel = config["announcement_channel"];
        });
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
            var template = `**Edited from an earlier message in ${message.author.displayName}**\n<@&${this.database.getRoleByGuild(from_guild)}>\n\n${message.content}`;
        else
            var template = `**From ${message.author.displayName}**\n` + `<@&${this.database.getRoleByGuild(from_guild)}>\n\n${message.content} `;


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



let bot = new CrossingGuardBot();
bot.login();