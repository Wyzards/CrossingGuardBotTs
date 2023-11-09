import { Client, Message, EmbedBuilder, PartialMessage, Events, GatewayIntentBits, TextChannel, MessageCreateOptions } from 'discord.js';
import 'dotenv/config';
import * as fs from 'fs';

class CrossingGuard extends Client {
    private hidden_channels: Array<String> = [];
    private announcement_channel = "0";

    constructor() {
        super({ intents: Object.entries(GatewayIntentBits).filter(arr => !isNaN(+arr[0])).map(arr => +arr[0]) });

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
        fs.readFile('./config.json', 'utf8', (err, data) => {
            const config = JSON.parse(data);

            bot.hidden_channels = config["hidden_channels"];
            bot.announcement_channel = config["announcement_channel"];
        });
    }

    login() {
        return super.login(process.env.REAL_TOKEN);
    }

    announce(message: Message | PartialMessage, isEdit = false) {
        console.log("Message to announce embeds: \n" + JSON.stringify(message.embeds) + "\n");

        let from_guild = message.guildId;
        let to_guild = this.guilds.cache.first();

        if (!to_guild || !from_guild) {
            console.log("Guild not findable");
            return;
        }

        if (isEdit)
            var template = `**Edited from an earlier message in ${message.author.displayName}**\n<@&${getRole(from_guild)}>\n\n${message.content}`;
        else
            var template = `**From ${message.author.displayName}**\n` + `<@&${getRole(from_guild)}>\n\n${message.content} `;


        to_guild.channels.fetch(this.announcement_channel).then(channel => {
            const textChannel = channel as TextChannel;

            var messageToSend: MessageCreateOptions = {
                content: template,
                embeds: message.embeds.filter(embed => { return !embed.video }),
                files: Array.from(message.attachments.values()),
                allowedMentions: { parse: ['roles', 'users'] }
            }

            textChannel.send(messageToSend);
        });
    }
}



let bot = new CrossingGuard();
bot.login();

function getRole(guild_id: string) {
    switch (guild_id) {
        case "698402467133784154":
            return "1095843313644470393";
        case "997400397058682940":
            return "1090720870097485914";
        case "751307973846106143":
            return "1090720744205467733";
        case "585899337012215828":
            return "1090720848278736906";
        case "432671778733555742":
            return "1095844856288522351";
        case "286476446338252800":
            return "1085631851185569963";
        case "143852930036924417":
            return "1090720722390888609";
        case "341757159798734849":
            return "1090720664408817775";
        case "313066655494438922":
            return "1085631799633399879";
        case "331596305120100368":
            return "1085631822324580423";
        case "227080337862164480":
            return "1090720689989877831";
        case "208334819652796416":
            return "1090720583563612170";
        case "212744497434460160":
            return "1090720878788100218";
        case "476939901326196738":
            return "1090735405697089556";
        case "366568834628321281":
            return "1090735351129182288";
        case "821828605340418088":
            return "1095098731369599106";
        case "768658159623340063":
            return "1095912368892026950";
        case "133012942890336256":
            return "1095912611066945577";
        case "1055661804275122238":
            return "1096694886733991936";
        case "728589320713404437":
            return "1118096782241579110";
        case "753521154542665739": // Pretty sure this is Skyblock Isles
            return "1171523568400605234";
        case "1008927083877118034": // AresMMO
            return "1129787484419666022";
        case "338498631265157120": // Hegemony
            return "1169488764968648744";
        case "988890821917032528": // Era of Kings
            return "1135764490550530110";
        case "1170943588474040402": // Crossroads Testing
            return "1171556676676104254"; // @Test
        default:
            return "1085631729651421345"; // Architect
    }
}

// Remove everyone from allowed mentions