import { Events, Message, TextChannel } from "discord.js";
import Bot from "../Bot.js";

const name = Events.MessageUpdate;
const execute = async function (oldMessage: Message, newMessage: Message) {
    if ((newMessage.channel as TextChannel).name.startsWith("hidden-announce"))
        await Bot.getInstance().announcementManager.handleFollowedChannelMessageUpdate(newMessage);
}

export { execute, name };
