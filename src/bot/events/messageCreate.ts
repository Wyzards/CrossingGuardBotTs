import { Events, Message, TextChannel } from "discord.js";
import Bot from "../Bot.js";

const name = Events.MessageCreate;
const execute = async function (message: Message) {
    if ((message.channel as TextChannel).name.startsWith("hidden-announce"))
        await Bot.getInstance().announcementManager.handleFollowedChannelMessageCreate(message);
}

export {
    name, execute
}