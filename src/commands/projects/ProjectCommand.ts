import { ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import CrossingGuardBot from "../../CrossingGuardBot";
import { ProjectStatus } from "../../ProjectStatus";
import ProjectAttachment from "../../ProjectAttachment";
import ProjectLink from "../../ProjectLink";
import ProjectStaff from "../../ProjectStaff";
import { ProjectStaffRank } from "../../ProjectStaffRank";

const data = new SlashCommandBuilder()
    .setName("project")
    .setDescription("Manage, create and modify projects")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    // Delete Project Subcommand
    .addSubcommand(subcommand =>
        subcommand.setName("delete")
            .setDescription("Delete a project")
            .addStringOption(option =>
                option.setName("project")
                    .setDescription("The internal name for this project")
                    .setRequired(true)))
    // New Project Subcommand
    .addSubcommand(subcommand =>
        subcommand.setName("create")
            .setDescription("Create a new project with the given name")
            .addStringOption(option =>
                option.setName("project")
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
                option.setName("project")
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
    // Links Subcommand Group
    .addSubcommandGroup(subcommandGroup =>
        subcommandGroup.setName("links")
            .setDescription("Manage this project's links")
            // Add Link Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("add")
                    .setDescription("Add a link to a project")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("The name to display for this link")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("url")
                            .setDescription("The URL for this link")
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand.setName("remove")
                    .setDescription("Remove a link from a project")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("name")
                            .setDescription("The name to display for this link")
                            .setRequired(true)))
            // List Links Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("list")
                    .setDescription("View a list of a project's links")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setRequired(true))))
    // Set Field Subcommand Group
    .addSubcommandGroup(subcommandGroup =>
        subcommandGroup.setName("staff")
            .setDescription("Manage this project's staff")
            // Add Staff Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("add")
                    .setDescription("Add a staff member to a project")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addUserOption(option =>
                        option.setName("user")
                            .setDescription("The user to make staff")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("rank")
                            .setDescription("The rank of this staff member")
                            .setRequired(true)
                            .addChoices(
                                { name: "Lead", value: "0" },
                                { name: "Staff", value: "1" },
                            )))
            .addSubcommand(subcommand =>
                subcommand.setName("remove")
                    .setDescription("Remove a staff member from a project")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addUserOption(option =>
                        option.setName("user")
                            .setDescription("The staff user to remove from this project")
                            .setRequired(true)))
            // List Staff Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("list")
                    .setDescription("View a list of a project's staff")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setRequired(true))))
    .addSubcommandGroup(subcommandGroup =>
        subcommandGroup.setName("set")
            .setDescription("Set one of this project's fields")
            // Set IP Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("display_name")
                    .setDescription("Set the display name of this project")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("display_name")
                            .setDescription("The new display name for this project")
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand.setName("ip")
                    .setDescription("Set a project's ip & version")
                    .addStringOption(option =>
                        option.setName("project")
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
                        option.setName("project")
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
                        option.setName("project")
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
                        option.setName("project")
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
                        option.setName("project")
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
                        option.setName("project")
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
        else if (subcommand == "display_name")
            executeSetDisplayName(interaction);
    }

    else if (subcommandGroup == "link") {
        if (subcommand == "add")
            executeAddLink(interaction);
        else if (subcommand == "list")
            executeListLinks(interaction);
        else if (subcommand == "remove")
            executeRemoveLink(interaction);
    }

    else if (subcommandGroup == "staff") {
        if (subcommand == "add")
            executeAddStaff(interaction);
        else if (subcommand == "list")
            executeListStaff(interaction);
        else if (subcommand == "remove")
            executeRemoveStaff(interaction);
    }

    else if (subcommand == "create")
        executeCreateProject(interaction);
    else if (subcommand == "addexisting")
        executeAddExistingProject(interaction);
    else if (subcommand == "delete")
        executeDeleteProject(interaction);
}

async function executeSetDisplayName(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");

    if (!projectName || !displayName)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(async project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        var nameBefore = project.displayName;

        CrossingGuardBot.getInstance().database.setDisplayName(project, displayName);

        interaction.reply({ content: `${nameBefore} has been renamed to ${displayName}`, ephemeral: true });
    });
}

async function executeDeleteProject(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(async project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        await CrossingGuardBot.getInstance().database.deleteProject(project);

        interaction.reply({ content: `Deleted ${project.displayName}`, ephemeral: true });
    });
}

async function executeRemoveStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");

    if (!projectName || !user)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        project.staff = project.staff.filter(staff => staff.discordUserId !== user.id);
        CrossingGuardBot.getInstance().database.saveProject(project);
        CrossingGuardBot.getInstance().database.updateStaffRoles(user.id);

        interaction.reply({ content: `Removed the user ${user} from ${project.displayName}`, allowedMentions: { parse: [] }, ephemeral: true });
    });
}

async function executeRemoveLink(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");

    if (!projectName || !linkName)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        project.links = project.links.filter(link => link.linkName !== linkName);
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `Removed the link \`${linkName}\` from ${project.displayName}`, ephemeral: true });
    });

}

async function executeListStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        let reply = project.displayName + "'s Staff\n--------------------\n";

        project.staff.forEach(staff => {
            reply += `- <@${staff.discordUserId}> ~ ${ProjectStaffRank[staff.rank]}\n`;
        });

        interaction.reply({ content: reply, allowedMentions: { parse: [] } });
    });
}

async function executeAddStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");
    const rank = interaction.options.getString("rank");

    if (!projectName || !user || !rank)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }


        if (project.addStaff(new ProjectStaff(project.id, user.id, +rank))) {
            CrossingGuardBot.getInstance().database.saveProject(project);
            CrossingGuardBot.getInstance().database.updateStaffRoles(user.id);

            interaction.reply({ content: `Added ${user.toString()} to the staff of ${project.displayName} as a ${ProjectStaffRank[+rank]}`, allowedMentions: { parse: [] }, ephemeral: true });
        } else {
            interaction.reply({ content: `${user.toString()} is already a staff member of ${project.displayName} with the role ${ProjectStaffRank[+rank]}`, allowedMentions: { parse: [] }, ephemeral: true });
        }
    });
}

async function executeListLinks(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        let reply = project.displayName + "'s Links\n--------------------\n";

        project.links.forEach(link => {
            reply += `- [${link.linkName}](${link.linkUrl})\n`;
        });

        interaction.reply(reply);
    });
}

async function executeAddLink(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");
    const linkURL = interaction.options.getString("url");

    if (!projectName || !linkName || !linkURL)
        return;

    CrossingGuardBot.getInstance().database.getProjectByName(projectName).then(project => {
        if (!project) {
            interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
            return;
        }

        var links = project.links;
        links.push(new ProjectLink(project.id, 0, linkName, linkURL));
        project.links = links;
        CrossingGuardBot.getInstance().database.saveProject(project);
        interaction.reply({ content: `Added the link [${linkName}](${linkURL}) to ${project.displayName}`, ephemeral: true });
    });

}


async function executeSetGuildID(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
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
    const projectName = interaction.options.getString("project");
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
    const projectName = interaction.options.getString("project");
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
    const projectName = interaction.options.getString("project");
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
    const projectName = interaction.options.getString("project");
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
    const projectName = interaction.options.getString("project");
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
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");
    const channel = interaction.options.getChannel("channel");
    const role = interaction.options.getRole("project_role");

    if (!projectName || !displayName || !channel || !role)
        return;

    CrossingGuardBot.getInstance().database.addProject(projectName, displayName, channel.id, role.id);

    await interaction.reply({ content: `Project added with project_name: \`${projectName}\`, and display_name: \`${displayName}\``, ephemeral: true });
}

async function executeCreateProject(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");

    if (!projectName || !displayName)
        return;

    CrossingGuardBot.getInstance().database.createNewProject(projectName, displayName);

    await interaction.reply({ content: `Project created with project_name: \`${projectName}\`, and display_name: \`${displayName}\``, ephemeral: true });
}

export { data, execute };

