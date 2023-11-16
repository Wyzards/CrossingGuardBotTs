import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import ProjectLink from "../../ProjectLink";

const data = new SlashCommandBuilder()
    .setName("links")
    .setDescription("View a list of a project's links")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        let reply = project.displayName + "'s Links\n--------------------\n";

        project.links.forEach(link => {
            reply += "- [" + link.linkName + "](" + link.linkUrl + ")\n";
        });

        interaction.reply(reply);
    });
}

export { data, execute };