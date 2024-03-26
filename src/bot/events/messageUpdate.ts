import { Events, Message, PartialMessage, TextChannel } from "discord.js";
import Bot from "../Bot.js";

const name = Events.MessageUpdate;
const execute = async function (oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage) {
    if ((newMessage.channel as TextChannel).name.startsWith("hidden-announce"))
        Bot.getInstance().announce(newMessage, true);
}

export {
    name, execute
}