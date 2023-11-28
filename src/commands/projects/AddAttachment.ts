import { SlashCommandBuilder, PermissionFlagsBits, ForumChannel, CommandInteractionOptionResolver, ChatInputCommandInteraction } from "discord.js";
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

async function execute(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project_name");
    const msgId = interaction.options.getString("msg_with_attachments_id");

    if (!interaction.channel || !msgId || !projectName)
        return;

    interaction.channel.messages.fetch(msgId)
        .then(message => {
            CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
                if (!project) {
                    interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
                    return;
                }

                var newAttachments: ProjectAttachment[] = [];

                message.attachments.forEach(attachment => {
                    newAttachments.push(new ProjectAttachment(project.id, 0, attachment.url));
                });

                project.attachments = newAttachments;
                CrossingGuardBot.getInstance().database.saveProject(project);

                interaction.reply({ content: `${project.displayName}'s attachments have been set`, ephemeral: true });
            });
        })
}

export { data, execute };