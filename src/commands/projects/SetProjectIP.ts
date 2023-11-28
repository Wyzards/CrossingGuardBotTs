import { SlashCommandBuilder, ForumChannel, PermissionFlagsBits, CommandInteractionOptionResolver, ChatInputCommandInteraction } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import Database from "../../Database";

const data = new SlashCommandBuilder()
    .setName("setprojectip")
    .setDescription("Set a project's ip & version")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("ip_string")
            .setDescription("The ip and version for this project. Format: version > ip")
            .setRequired(true));

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const ipString = interaction.options.getString("ip_string");

    if (!projectName || !ipString)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        project.ip = ipString;
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `${project.displayName}'s IP set to \`${ipString}\``, ephemeral: true });
    });

}

export { data, execute };