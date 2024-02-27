import { Events, Message, PartialMessage, TextChannel } from "discord.js";
import Bot from "../Bot";

module.exports = {
    name: Events.MessageUpdate,
    execute(oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage) {
        if ((newMessage.channel as TextChannel).name.startsWith("hidden-announce"))
            Bot.getInstance().announce(newMessage, true);
    }
}