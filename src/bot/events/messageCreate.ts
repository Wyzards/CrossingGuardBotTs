import { Events, Message, TextChannel } from "discord.js";
import Bot from "../Bot.js";

const name = Events.MessageCreate;
const execute = async function (message: Message<boolean>) {
    if ((message.channel as TextChannel).name.startsWith("hidden-announce"))
        Bot.getInstance().announce(message);
}

export {
    name, execute
}