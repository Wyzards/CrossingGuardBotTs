import { Events, Message, TextChannel } from "discord.js";
import Bot from "../Bot";

module.exports = {
    name: Events.MessageCreate,
    execute(message: Message<boolean>) {
        if ((message.channel as TextChannel).name.startsWith("hidden-announce"))
            Bot.getInstance().announce(message);
    }
}