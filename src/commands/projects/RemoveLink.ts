import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("removelink")
    .setDescription("Remove a link from a project")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("name")
            .setDescription("The name to display for this link")
            .setRequired(true));

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const linkName = interaction.options.getString("name");

    if (!projectName || !linkName)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        project.links = project.links.filter(link => link.linkName !== linkName);
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `Removed the link \`${linkName}\` from ${project.displayName}`, ephemeral: true });
    });

}

export { data, execute };

