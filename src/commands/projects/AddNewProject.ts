import { SlashCommandBuilder } from "discord.js";

const data = new SlashCommandBuilder().setName("addproject").setDescription("Add an empty project with the given name");

async function execute(interaction) {
    await interaction.reply("Project created!");
}

export { data, execute };