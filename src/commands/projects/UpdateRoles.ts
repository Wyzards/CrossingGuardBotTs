import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("updatestaffroles")
    .setDescription("Updates all member's staff roles")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

async function execute(interaction: ChatInputCommandInteraction) {
    var bot = CrossingGuardBot.getInstance();

    var guild = await bot.guilds.fetch(CrossingGuardBot.GUILD_ID);
    var members = await guild.members.list();
    var role = await guild.roles.fetch("1180712393257529484");

    if (role)
        for (const [key, member] of members) {
            await member.roles.add(role);
            //await bot.database.updateStaffRoles(member.id);
        }

    interaction.reply({ content: "All staff roles have been updated", ephemeral: true });
}

export { data, execute };
