import { Events, Message, TextChannel } from "discord.js";
import { Bot } from "../Bot.js";

const name = Events.MessageCreate;
const execute = async function (bot: Bot, message: Message) {
    if ((message.channel as TextChannel).name.startsWith("hidden-announce"))
        await bot.announcementManager.handleFollowedChannelMessageCreate(message);
}

export {
    name, execute
}