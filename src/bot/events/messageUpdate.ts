import { Events, Message, PartialMessage } from "discord.js";
import Bot from "../Bot";

module.exports = {
    name: Events.MessageUpdate,
    execute(oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage) {
        if (Bot.HIDDEN_CHANNELS.includes(newMessage.channelId))
            Bot.getInstance().announce(newMessage, true);
    }
}