import { Client, Events } from "discord.js";
import Bot from "../Bot";
import Database from "../../database/Database";

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client<true>) {
        var bot = Bot.getInstance();
        var database = Database.getInstance();
        var guild = await bot.guild;
        var members = await guild.members.list();

        for (const [key, member] of members)
            await Database.updateStaffRoles(member.id);

        console.log(`Ready! Logged in as ${client.user.tag}`);
    }
}