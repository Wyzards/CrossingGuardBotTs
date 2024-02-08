import { Events, Message } from "discord.js";
import CrossingGuardBot from "../CrossingGuardBot";

module.exports = {
    name: Events.MessageCreate,
    execute(message: Message<boolean>) {
        if (CrossingGuardBot.HIDDEN_CHANNELS.includes(message.channelId))
            CrossingGuardBot.getInstance().announce(message);
    }
}