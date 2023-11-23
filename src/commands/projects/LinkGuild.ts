import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("linkguild")
    .setDescription("Link a guild to a project")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("guild_id")
            .setDescription("The id of the guild to link to")
            .setRequired(true));

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const guildId = interaction.options.getString("guild_id");

    if (!projectName || !guildId)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        project.guildId = guildId;
        CrossingGuardBot.getInstance().database.saveProject(project);

        interaction.reply({ content: `Linked ${guildId} to ${project.displayName}`, ephemeral: true });
    });
}

export { data, execute };
