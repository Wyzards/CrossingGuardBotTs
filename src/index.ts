import { Client, Message, PartialMessage, Events, GatewayIntentBits, TextChannel } from 'discord.js';
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
        fs.readFile('./test_config.json', 'utf8', (err, data) => {
            const config = JSON.parse(data);

            bot.hidden_channels = config["hidden_channels"];
            bot.announcement_channel = config["announcement_channel"];
        });
    }

    login() {
        return super.login(process.env.TEST_TOKEN);
    }

    announce(message: Message | PartialMessage, isEdit = false) {
        let from_guild = message.guildId;
        let to_guild = this.guilds.cache.first();

        if (!to_guild || !from_guild) {
            console.log("Guild not findable");
            return;
        }

        if (isEdit)
            var template = `**Edited from an earlier message in ${message.author.displayName}**\n<@&${getRole(BigInt(from_guild))}>\n\n${message.content}`;
        else
            var template = `**From ${message.author.displayName}**\n` + `<@&${getRole(BigInt(from_guild))}>\n\n${message.content} `;


        to_guild.channels.fetch(this.announcement_channel).then(channel => {
            const textChannel = channel as TextChannel;

            textChannel.send({
                stickers: Array.from(message.stickers.values()),
                content: template,
                embeds: message.embeds,
                files: Array.from(message.attachments.values())
            });
        });
    }
}



let bot = new CrossingGuard();
bot.login();

function getRole(guild_id: BigInt) {
    switch (guild_id) {
        case 698402467133784154n:
            return "1095843313644470393";
        case 997400397058682940n:
            return "1090720870097485914";
        case 751307973846106143n:
            return "1090720744205467733";
        case 585899337012215828n:
            return "1090720848278736906";
        case 432671778733555742n:
            return "1095844856288522351";
        case 286476446338252800n:
            return "1085631851185569963";
        case 143852930036924417n:
            return "1090720722390888609";
        case 341757159798734849n:
            return "1090720664408817775";
        case 313066655494438922n:
            return "1085631799633399879";
        case 331596305120100368n:
            return "1085631822324580423";
        case 227080337862164480n:
            return "1090720689989877831";
        case 208334819652796416n:
            return "1090720583563612170";
        case 212744497434460160n:
            return "1090720878788100218";
        case 476939901326196738n:
            return "1090735405697089556";
        case 366568834628321281n:
            return "1090735351129182288";
        case 821828605340418088n:
            return "1095098731369599106";
        case 768658159623340063n:
            return "1095912368892026950";
        case 133012942890336256n:
            return "1095912611066945577";
        case 1055661804275122238n:
            return "1096694886733991936";
        case 728589320713404437n:
            return "1118096782241579110";
        case 753521154542665739n: // Pretty sure this is Skyblock Isles
            return "1171523568400605234";
        case 1008927083877118034n: // AresMMO
            return "1129787484419666022";
        case 338498631265157120n: // Hegemony
            return "1169488764968648744";
        case 988890821917032528n: // Era of Kings
            return "1135764490550530110";
        default:
            return "1085631729651421345"; // Architect
    }
}

// Remove everyone from allowed mentions