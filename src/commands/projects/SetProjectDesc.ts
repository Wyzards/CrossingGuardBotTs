import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";

const data = new SlashCommandBuilder()
    .setName("setprojectdesc")
    .setDescription("Set a project's description")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("description_msg_id")
            .setDescription("The id of the message description for this project")
            .setRequired(true));

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const descriptionMessageId = interaction.options.getString("description_msg_id");

    if (!projectName || !descriptionMessageId || !interaction.channel)
        return;

    interaction.channel.messages.fetch(descriptionMessageId)
        .then(message => {
            var description = message.content;

            console.log(JSON.stringify(message.attachments));

            CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
                if (!project) {
                    interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
                    return;
                }

                project.description = description;
                CrossingGuardBot.getInstance().database.saveProject(project);
                interaction.reply({ content: `${project.displayName} has been given the following description:\n${description}`, ephemeral: true });
            });

        })
}

export { data, execute };
