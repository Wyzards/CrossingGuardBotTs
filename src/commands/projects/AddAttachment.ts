import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import ProjectAttachment from "../../ProjectAttachment";

const data = new SlashCommandBuilder()
    .setName("setattachments")
    .setDescription("Set the attachments of a project")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption(option =>
        option.setName("project_name")
            .setDescription("The name of the project")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("msg_with_attachments_id")
            .setDescription("The id of the message who's attachments to copy")
            .setRequired(true));

async function execute(interaction) {
    const projectName = interaction.options.getString("project_name");
    const msgId = interaction.options.getString("msg_with_attachments_id");

    interaction.channel.messages.fetch(msgId)
        .then(message => {
            console.log(JSON.stringify(message.attachments));

            CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
                var newAttachments: ProjectAttachment[] = [];

                message.attachments.forEach(attachment => {
                    newAttachments.push(new ProjectAttachment(project.id, 0, attachment.attachment));
                });

                project.attachments = newAttachments;
                CrossingGuardBot.getInstance().database.saveProject(project);

                interaction.reply({ content: `${project.displayName}'s attachments have been set`, ephemeral: true });
            });

        })
}

export { data, execute };