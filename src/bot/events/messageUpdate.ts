import { Events, Message, PartialMessage } from "discord.js";
import CrossingGuardBot from "../CrossingGuardBot";

module.exports = {
    name: Events.MessageUpdate,
    execute(oldMessage: Message<boolean> | PartialMessage, newMessage: Message<boolean> | PartialMessage) {
        if (CrossingGuardBot.HIDDEN_CHANNELS.includes(newMessage.channelId))
            CrossingGuardBot.getInstance().announce(newMessage, true);
    }
}