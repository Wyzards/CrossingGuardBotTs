import { SlashCommandBuilder, ForumChannel, PermissionFlagsBits, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("setemoji")
    .setDescription("Set a project's emoji")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("emoji_string")
            .setDescription("The id of this emoji if custom, otherwise the unicode character")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const emojiIdOrUnicode = interaction.options.getString("emoji_string");

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        project.emoji = emojiIdOrUnicode;
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `${project.displayName}'s emoji set to \`${project.emoji}\``, ephemeral: true });
    });

}

export { data, execute };