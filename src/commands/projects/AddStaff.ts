import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
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

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const userId = interaction.options.getUser("user").id;
    const rank: ProjectStaffRank = +interaction.options.getString("rank");

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        var staff = project.staff;
        staff.push(new ProjectStaff(project.id, userId, rank));
        project.staff = staff;
        CrossingGuardBot.getInstance().database.saveProject(project);

        interaction.reply({ content: `Added ${interaction.options.getUser("user").toString()} to the staff of ${project.displayName} as a ${ProjectStaffRank[rank]}`, allowedMentions: { parse: [] }, ephemeral: true });
    });
}

export { data, execute };