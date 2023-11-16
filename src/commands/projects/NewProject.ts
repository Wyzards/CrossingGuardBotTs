import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot.js";

const data = new SlashCommandBuilder()
    .setName("newproject")
    .setDescription("Add a new project with the given name")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The internal name for this project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("display_name")
            .setDescription("The display name for this project")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const displayName = interaction.options.getString("display_name");

    CrossingGuardBot.getInstance().database.createNewProject(projectName, displayName);

    await interaction.reply({ content: `Project created with project_name: \`${projectName}\`, and display_name: \`${displayName}\``, ephemeral: true });
}

export { data, execute };