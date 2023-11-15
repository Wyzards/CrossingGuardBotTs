import { SlashCommandBuilder, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import { ProjectStatus } from "../../ProjectStatus";

const data = new SlashCommandBuilder()
    .setName("setprojectstatus")
    .setDescription("Set a project's status")
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("status")
            .setDescription("The current status of the project")
            .setRequired(true)
            .addChoices(
                { name: "Playable", value: "0" },
                { name: "In Development", value: "1" },
                { name: "Archived", value: "2" },
                { name: "Hidden", value: "4" }
            ));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const status = +(interaction.options.getString("status"));

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        project.status = status;
        CrossingGuardBot.getInstance().database.saveProject(project);
    });

    interaction.reply("Project " + projectName + "'s status set to '" + ProjectStatus[status] + "'");
}

export { data, execute };