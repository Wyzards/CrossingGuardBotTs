import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver, ChatInputCommandInteraction } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import { ProjectStaffRank } from "../../ProjectStaffRank";
import ProjectStaff from "../../ProjectStaff";

const data = new SlashCommandBuilder()
    .setName("addstaff")
    .setDescription("Add a staff member to a project")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to make staff")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("rank")
            .setDescription("The rank of this staff member")
            .setRequired(true)
            .addChoices(
                { name: "Lead", value: "0" },
                { name: "Staff", value: "1" },
            ));

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const user = interaction.options.getUser("user");
    const rank = interaction.options.getString("rank");

    if (!projectName || !user || !rank)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }


        if (project.addStaff(new ProjectStaff(project.id, user.id, +rank))) {
            CrossingGuardBot.getInstance().database.saveProject(project);
            CrossingGuardBot.getInstance().database.updateStaffRoles(user.id);

            interaction.reply({ content: `Added ${user.toString()} to the staff of ${project.displayName} as a ${ProjectStaffRank[+rank]}`, allowedMentions: { parse: [] }, ephemeral: true });
        } else {
            interaction.reply({ content: `${user.toString()} is already a staff member of ${project.displayName} with the role ${ProjectStaffRank[+rank]}`, allowedMentions: { parse: [] }, ephemeral: true });
        }
    });
}

export { data, execute };