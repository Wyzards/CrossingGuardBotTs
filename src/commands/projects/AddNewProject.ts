import { SlashCommandBuilder, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot.js";

const data = new SlashCommandBuilder()
    .setName("addproject")
    .setDescription("Add an empty project with the given name")
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The internal name for this project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("display_name")
            .setDescription("The display name for this project")
            .setRequired(true))
    .addChannelOption(option =>
        option.setName("channel")
            .setDescription("The the forum channel for this project"));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const displayName = interaction.options.getString("display_name");
    const channel = interaction.options.getChannel("channel");

    console.log("CHANNEL: " + JSON.stringify(channel));

    CrossingGuardBot.getInstance().database.createNewProject(projectName, displayName);

    await interaction.reply("Project created with project_name: " + projectName + ", and display_name: " + displayName);
}

export { data, execute };