import { SlashCommandBuilder, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("setprojectdesc")
    .setDescription("Set a project's description")
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("description_msg_id")
            .setDescription("The id of the message description for this project")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const descriptionMessageId = interaction.options.getString("description_msg_id");

    console.log("ID: " + descriptionMessageId);
    console.log("CHANNEL: " + JSON.stringify(interaction.channel))

    interaction.channel.messages.fetch(descriptionMessageId)
        .then(message => {
            var description = message.content;

            CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
                project.description = description;
                CrossingGuardBot.getInstance().database.saveProject(project);
            });

            interaction.reply("Project created with the name `" + projectName + "` has been given the following description:\n" + description);
        })
}

export { data, execute };