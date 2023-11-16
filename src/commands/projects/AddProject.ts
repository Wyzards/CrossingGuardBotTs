import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot.js";

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

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const displayName = interaction.options.getString("display_name");
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("project_role");

    CrossingGuardBot.getInstance().database.addProject(projectName, displayName);

    await CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        project.channelId = channel.id;
        CrossingGuardBot.getInstance().database.saveProject(project);
    });

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        project.roleId = role.id;
        CrossingGuardBot.getInstance().database.saveProject(project);
    });

    await interaction.reply({ content: `Project added with project_name: \`${projectName}\`, and display_name: \`${displayName}\``, ephemeral: true });
}

export { data, execute };