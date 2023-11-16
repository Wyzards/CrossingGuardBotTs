import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import ProjectLink from "../../ProjectLink";

const data = new SlashCommandBuilder()
    .setName("addlink")
    .setDescription("Add a link to a project")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("name")
            .setDescription("The name to display for this link")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("url")
            .setDescription("The URL for this link")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const linkName = interaction.options.getString("name");
    const linkURL = interaction.options.getString("url");

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        var links = project.links;
        links.push(new ProjectLink(project.id, 0, linkName, linkURL));
        project.links = links;
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `Added the link [${linkName}](${linkURL}) to ${project.displayName}`, ephemeral: true });
    });

}

export { data, execute };