import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot.js";

const data = new SlashCommandBuilder()
    .setName("addproject")
    .setDescription("Add an empty project with the given name")
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
            .setDescription("The the forum channel for this project"))
    .addRoleOption(option =>
        option.setName("project_role")
            .setDescription("The role to give people interested in this project"));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const displayName = interaction.options.getString("display_name");
    const channel = interaction.options.getChannel("channel") ?? null;
    const role = interaction.options.getRole("project_role") ?? null;

    CrossingGuardBot.getInstance().database.createNewProject(projectName, displayName);

    if (channel != null)
        await CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
            project.channelId = channel.id;
            CrossingGuardBot.getInstance().database.saveProject(project);
        });

    if (role != null) {
        CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
            project.roleId = role.id;
            CrossingGuardBot.getInstance().database.saveProject(project);
        });
    }

    await interaction.reply("Project created with project_name: " + projectName + ", and display_name: " + displayName);
}

export { data, execute };