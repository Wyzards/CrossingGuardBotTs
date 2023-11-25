import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver, ChatInputCommandInteraction } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import ProjectLink from "../../ProjectLink";
import Database from "../../Database";

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

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const linkName = interaction.options.getString("name");
    const linkURL = interaction.options.getString("url");

    if (!projectName || !linkName || !linkURL)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        var links = project.links;
        links.push(new ProjectLink(project.id, 0, linkName, linkURL));
        project.links = links;
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `Added the link [${linkName}](${linkURL}) to ${project.displayName}`, ephemeral: true });
    });

}

export { data, execute };