import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import { ProjectStaffRank } from "../../ProjectStaffRank";

const data = new SlashCommandBuilder()
    .setName("staff")
    .setDescription("View a list of a project's staff")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true));

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");

    if (!projectName)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        let reply = project.displayName + "'s Staff\n--------------------\n";

        project.staff.forEach(staff => {
            reply += `- <@${staff.discordUserId}> ~ ${ProjectStaffRank[staff.rank]}\n`;
        });

        interaction.reply({ content: reply, allowedMentions: { parse: [] } });
    });
}

export { data, execute };

