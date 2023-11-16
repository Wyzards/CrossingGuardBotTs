import { SlashCommandBuilder, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("removelink")
    .setDescription("Remove a link from a project")
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("name")
            .setDescription("The name to display for this link")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const linkName = interaction.options.getString("name");

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        project.links = project.links.filter(link => link.linkName !== linkName);
        CrossingGuardBot.getInstance().database.saveProject(project);
    });

    interaction.reply("Removed the link `" + linkName + "` from " + projectName);
}

export { data, execute };