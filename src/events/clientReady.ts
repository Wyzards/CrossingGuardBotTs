import { Client, Events, Message } from "discord.js";
import CrossingGuardBot from "../CrossingGuardBot";

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client: Client<true>) {
        var bot = CrossingGuardBot.getInstance();
        console.log(`Ready! Logged in as ${client.user.tag}`);

        var guild = await bot.guild;
        var members = await guild.members.list();

        for (const [key, member] of members) {
            await bot.database.updateStaffRoles(member.id);
        }

        var guild = await bot.guild;
        var members = await guild.members.list();

        for (const [key, member] of members)
            await bot.database.updateStaffRoles(member.id);
    }
}