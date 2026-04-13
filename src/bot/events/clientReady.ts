import { Client, Events, RESTEvents } from "discord.js";
import { Bot } from "../Bot.js";

const name = Events.ClientReady;
const once = true;
const execute = async function (bot: Bot, client: Client<true>) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
}

export { execute, name, once };
