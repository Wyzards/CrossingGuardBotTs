import { SlashCommandBuilder } from "discord.js";

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
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const displayName = interaction.options.getString("display_name");

    await interaction.reply("Project created with project_name: " + projectName + ", and display_name: " + displayName);
}

export { data, execute };