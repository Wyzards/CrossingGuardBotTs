import { Client, Events } from "discord.js";
import Bot from "../Bot.js";
import Database from "../../database/Database.js";

const name = Events.ClientReady;
const once = true;
const execute = async function (client: Client<true>) {
    var bot = Bot.getInstance();
    var guild = await bot.guild;
    var members = await guild.members.list();

    for (const [key, member] of members)
        await Database.updateStaffRoles(member.id);

    console.log(`Ready! Logged in as ${client.user.tag}`);
}

export {
    name, once, execute
}