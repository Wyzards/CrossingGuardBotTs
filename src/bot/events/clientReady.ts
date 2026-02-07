import { Client, Events } from "discord.js";
import Database from "../../database/Database.js";
import Bot from "../Bot.js";

const name = Events.ClientReady;
const once = true;
const execute = async function (client: Client<true>) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
}

export { execute, name, once };
