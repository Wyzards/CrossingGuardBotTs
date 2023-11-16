import { SlashCommandBuilder, MessageCreateOptions, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import ProjectLink from "../../ProjectLink";
import { ProjectStaffRank } from "../../ProjectStaffRank";

const data = new SlashCommandBuilder()
    .setName("staff")
    .setDescription("View a list of a project's staff")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        let reply = project.displayName + "'s Staff\n--------------------\n";

        project.staff.forEach(staff => {
            reply += `- <@${staff.discordUserId}> ~ ${ProjectStaffRank[staff.rank]}\n`;
        });

        interaction.reply({ content: reply, allowedMentions: { parse: [] } });
    });
}

export { data, execute };