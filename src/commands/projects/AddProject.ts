import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("addproject")
    .setDescription("Add an existing project with the given name")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The internal name for this project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("display_name")
            .setDescription("The display name for this project")
            .setRequired(true))
    .addChannelOption(option =>
        option.setName("channel")
            .setDescription("The the forum channel for this project")
            .setRequired(true))
    .addRoleOption(option =>
        option.setName("project_role")
            .setDescription("The role to give people interested in this project")
            .setRequired(true));

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const displayName = interaction.options.getString("display_name");
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("project_role");

    if (!projectName || !displayName || !channel || !role)
        return;

    CrossingGuardBot.getInstance().database.addProject(projectName, displayName, channel.id, role.id);

    await interaction.reply({ content: `Project added with project_name: \`${projectName}\`, and display_name: \`${displayName}\``, ephemeral: true });
}

export { data, execute };
