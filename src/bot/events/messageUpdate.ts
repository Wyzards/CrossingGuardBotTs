import { Events, Message, TextChannel } from "discord.js";
import { Bot } from "../Bot.js";

const name = Events.MessageUpdate;
const execute = async function (bot: Bot, oldMessage: Message, newMessage: Message) {
    // if ((newMessage.channel as TextChannel).name.startsWith("hidden-announce"))
    //     await bot.announcementManager.handleFollowedChannelMessageUpdate(newMessage);
}

export { execute, name };
