import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import { ProjectStatus } from "../../ProjectStatus";
import ProjectAttachment from "../../ProjectAttachment";

const data = new SlashCommandBuilder()
    .setName("project")
    .setDescription("Manage, create and modify projects")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // New Project Subcommand
    .addSubcommand(subcommand =>
        subcommand.setName("create")
            .setDescription("Create a new project with the given name")
            .addStringOption(option =>
                option.setName("name")
                    .setDescription("The internal name for this project")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("display_name")
                    .setDescription("The display name for this project")
                    .setRequired(true)))
    // Add Existing Project Subcommand
    .addSubcommand(subcommand =>
        subcommand.setName("addexisting")
            .setDescription("Add an existing project with the given name")
            .addStringOption(option =>
                option.setName("name")
                    .setDescription("The internal name for this project")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("display_name")
                    .setDescription("The display name for this project")
                    .setRequired(true))
            .addChannelOption(option =>
                option.setName("channel")
                    .setDescription("The the forum channel for this project")
                    .setRequired(true))
            .addRoleOption(option =>
                option.setName("project_role")
                    .setDescription("The role to give people interested in this project")
                    .setRequired(true)))
    // Set Field Subcommand Group
    .addSubcommandGroup(subcommandGroup =>
        subcommandGroup.setName("set")
            .setDescription("Set one of this project's fields")
            // Set IP Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("ip")
                    .setDescription("Set a project's ip & version")
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("ip_string")
                            .setDescription("The ip and version for this project. Format: version > ip")
                            .setRequired(true)))
            // Set Status Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("status")
                    .setDescription("Set a project's status")
                    .addStringOption(option =>
                        option.setName("name")
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
                            )))
            // Set Emoji Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("emoji")
                    .setDescription("Set a project's emoji")
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("emoji_string")
                            .setDescription("The id of this emoji if custom, otherwise the unicode character")
                            .setRequired(true)))
            // Set Description Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("description")
                    .setDescription("Set a project's description")
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("description_msg_id")
                            .setDescription("The id of the message description for this project")
                            .setRequired(true)))
            // Set Attachments Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("attachments")
                    .setDescription("Set the attachments of a project")
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("msg_with_attachments_id")
                            .setDescription("The id of the message who's attachments to copy")
                            .setRequired(true)))
            // Set Discord Guild ID
            .addSubcommand(subcommand =>
                subcommand.setName("discord_id")
                    .setDescription("Set this project's linked disord guild ID")
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("guild_id")
                            .setDescription("The id of the guild to link to")
                            .setRequired(true))));

async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();

    if (subcommandGroup == "set") {
        if (subcommand == "ip")
            executeSetIp(interaction);
        else if (subcommand == "status")
            executeSetStatus(interaction);
        else if (subcommand == "emoji")
            executeSetEmoji(interaction);
        else if (subcommand == "description")
            executeSetDescription(interaction);
        else if (subcommand == "attachments")
            executeSetAttachments(interaction);
        else if (subcommand == "discord_id")
            executeSetGuildID(interaction);
    }

    else if (subcommand == "create")
        executeCreateProject(interaction);
    else if (subcommand == "addexisting")
        executeAddExistingProject(interaction);
}

async function executeSetGuildID(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("name");
    const guildId = interaction.options.getString("guild_id");

    if (!projectName || !guildId)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        project.guildId = guildId;
        CrossingGuardBot.getInstance().database.saveProject(project);

        interaction.reply({ content: `Linked ${guildId} to ${project.displayName}`, ephemeral: true });
    });
}

async function executeSetAttachments(interaction: ChatInputCommandInteraction) {
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

async function executeSetDescription(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("name");
    const descriptionMessageId = interaction.options.getString("description_msg_id");

    if (!projectName || !descriptionMessageId || !interaction.channel)
        return;

    interaction.channel.messages.fetch(descriptionMessageId)
        .then(message => {
            var description = message.content;

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

async function executeSetEmoji(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("name");
    const emojiIdOrUnicode = interaction.options.getString("emoji_string");

    if (!projectName || !emojiIdOrUnicode)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        project.emoji = emojiIdOrUnicode;
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `${project.displayName}'s emoji set to \`${project.emoji}\``, ephemeral: true });
    });

}

async function executeSetStatus(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("name");
    const status = interaction.options.getString("status");

    if (!projectName || !status)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        project.status = +status;
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `${project.displayName}'s status set to ${ProjectStatus[+status]}`, ephemeral: true });
    });

}

async function executeSetIp(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("name");
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


async function executeAddExistingProject(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("name");
    const displayName = interaction.options.getString("display_name");
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("project_role");

    if (!projectName || !displayName || !channel || !role)
        return;

    CrossingGuardBot.getInstance().database.addProject(projectName, displayName, channel.id, role.id);

    await interaction.reply({ content: `Project added with project_name: \`${projectName}\`, and display_name: \`${displayName}\``, ephemeral: true });
}

async function executeCreateProject(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("name");
    const displayName = interaction.options.getString("display_name");

    if (!projectName || !displayName)
        return;

    CrossingGuardBot.getInstance().database.createNewProject(projectName, displayName);

    await interaction.reply({ content: `Project created with project_name: \`${projectName}\`, and display_name: \`${displayName}\``, ephemeral: true });
}

export { data, execute };

