import { ChannelType, Events, Message } from "discord.js";
import { Bot } from "../Bot.js";

const name = Events.MessageCreate;

const execute = async function (bot: Bot, message: Message) {

    // Ignore DMs
    if (message.channel.type === ChannelType.DM)
        return;

    // Ignore non-text channels
    if (!("name" in message.channel))
        return;

    if (message.channel.name && message.channel.name.startsWith("hidden-announce")) {
        await bot.announcementManager.handleFollowedChannelMessageCreate(message);
    }
};

export {
    name,
    execute
};