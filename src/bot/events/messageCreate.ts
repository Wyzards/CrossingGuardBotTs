import { Events, Message } from "discord.js";
import Bot from "../Bot";

module.exports = {
    name: Events.MessageCreate,
    execute(message: Message<boolean>) {
        if (Bot.HIDDEN_CHANNELS.includes(message.channelId))
            Bot.getInstance().announce(message);
    }
}