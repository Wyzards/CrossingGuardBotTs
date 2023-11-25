import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
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

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const user = interaction.options.getUser("user");

    if (!projectName || !user)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        project.staff = project.staff.filter(staff => staff.discordUserId !== user.id);
        CrossingGuardBot.getInstance().database.saveProject(project);
        CrossingGuardBot.getInstance().database.updateStaffRoles(user.id);

        interaction.reply({ content: `Removed the user ${user} from ${project.displayName}`, allowedMentions: { parse: [] }, ephemeral: true });
    });
}

export { data, execute };
