import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("removestaff")
    .setDescription("Remove a staff member from a project")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The staff user to remove from this project")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const userId = interaction.options.getUser("user").id;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        project.staff = project.staff.filter(staff => staff.discordUserId !== userId);
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply("Removed the user " + interaction.options.getUser("user").toString() + " from " + project.displayName);
    });
}

export { data, execute };