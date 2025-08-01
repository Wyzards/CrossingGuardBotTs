import { AutocompleteInteraction, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import * as fs from 'fs';
import * as path from 'path';
import Database from "../../../database/Database.js";
import ProjectAttachment from "../../../database/projects/ProjectAttachment.js";
import ProjectLink from "../../../database/projects/ProjectLink.js";
import ProjectStaff from "../../../database/projects/ProjectStaff.js";
import { ProjectStaffRank } from "../../../database/projects/ProjectStaffRank.js";
import { ProjectStatus } from "../../../database/projects/ProjectStatus.js";
import { ProjectType } from "../../../database/projects/ProjectType.js";
import * as client from 'https';

const data = new SlashCommandBuilder()
    .setName("project")
    .setDescription("Manage, create and modify projects")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    // Delete Project Subcommand
    .addSubcommand(subcommand =>
        subcommand.setName("delete")
            .setDescription("Delete a project")
            .addStringOption(option =>
                option.setName("project")
                    .setDescription("The name of the project")
                    .setAutocomplete(true)
                    .setRequired(true)))
    .addSubcommand(subcommand =>
        subcommand.setName("updateviews")
            .setDescription("Update the views for all projects")
            .addStringOption(option =>
                option.setName("project")
                    .setDescription("The name of the project")
                    .setAutocomplete(true)))
    // New Project Subcommand
    .addSubcommand(subcommand =>
        subcommand.setName("create")
            .setDescription("Create a new project with the given name")
            .addStringOption(option =>
                option.setName("project")
                    .setDescription("The name of the project")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("display_name")
                    .setDescription("The display name for this project")
                    .setRequired(true))
            .addStringOption(option =>
                option.setName("type")
                    .setDescription("The type of RPG")
                    .setRequired(true)
                    .addChoices(
                        { name: "MMO", value: "MMO" },
                        { name: "SMP", value: "SMP" },
                        { name: "Map", value: "MAP" },
                        { name: "RPG", value: "RPG" },
                        { name: "Other", value: "Other" }
                    )))
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
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
                            .setRequired(true))))
    // SET Property Subcommand Group
    .addSubcommandGroup(subcommandGroup =>
        subcommandGroup.setName("set")
            .setDescription("Set one of this project's fields")
            // Set internal name command
            .addSubcommand(subcommand =>
                subcommand.setName("name")
                    .setDescription("Set the name of this project")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("new_name")
                            .setDescription("The new name for this project")
                            .setRequired(true)))
            // Set display name Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("display_name")
                    .setDescription("Set the display name of this project")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("display_name")
                            .setDescription("The new display name for this project")
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand.setName("type")
                    .setDescription("Set a project's type")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("type")
                            .setDescription("The type of project")
                            .setRequired(true)
                            .addChoices(
                                { name: "MMO", value: "MMO" },
                                { name: "SMP", value: "SMP" },
                                { name: "Map", value: "MAP" },
                                { name: "RPG", value: "RPG" },
                                { name: "Other", value: "Other" }
                            )))
            // Set IP
            .addSubcommand(subcommand =>
                subcommand.setName("ip")
                    .setDescription("Set a project's ip & version")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("status")
                            .setDescription("The current status of the project")
                            .setRequired(true)
                            .addChoices(
                                { name: "Playable", value: "0" },
                                { name: "In Development", value: "1" },
                                { name: "Hidden", value: "4" }
                            )))
            // Set Emoji Subcommand
            .addSubcommand(subcommand =>
                subcommand.setName("emoji")
                    .setDescription("Set a project's emoji")
                    .addStringOption(option =>
                        option.setName("project")
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
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
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("guild_id")
                            .setDescription("The id of the guild to link to")
                            .setRequired(true))));

async function autocomplete(interaction: AutocompleteInteraction) {
    const projects = await Database.projectList();
    const focusedValue = interaction.options.getFocused();
    const filtered = projects.filter(project => project.name.includes(focusedValue) || project.displayName.includes(focusedValue));

    await interaction.respond(
        filtered.slice(0, 24).map(projectChoice => ({ name: projectChoice.displayName, value: projectChoice.name })),
    );
}

async function execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const projectName = interaction.options.getString("project");

    if (projectName && subcommand != "create" && !await Database.projectExists(projectName)) {
        interaction.reply({ content: `No project matched the name ${projectName}`, ephemeral: true });
        return;
    }

    if (subcommandGroup == "set") {
        if (subcommand == "type")
            executeSetType(interaction);
        else if (subcommand == "ip")
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
        else if (subcommand == "name")
            executeSetName(interaction);
    }

    else if (subcommandGroup == "links") {
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
    else if (subcommand == "delete")
        executeDeleteProject(interaction);
    else if (subcommand == "updateviews")
        executeUpdateViews(interaction);
}

async function executeUpdateViews(interaction: ChatInputCommandInteraction) {
    const projects = await Database.projectList();
    const projectName = interaction.options.getString("project"); // Can be null

    var count = 0;

    await interaction.deferReply({ ephemeral: true });

    for (const project of projects) {
        if (projectName != null && project.name != projectName)
            continue;

        count++;
        await project.updateView();
        await interaction.editReply(`Edited ${count}/${projectName == null ? projects.length : 1} project views`);
    }
}

async function executeSetName(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const newName = interaction.options.getString("new_name");

    if (!projectName || !newName)
        return;

    if (newName.toLowerCase() != newName || newName.includes(" ")) {
        await interaction.reply({ content: `Your submitted project name (${newName}) is invalid as it contains uppercase characters or whitespaces`, ephemeral: true });
        return;
    }

    const projectWithSameName = await Database.getProjectByName(newName);

    if (projectWithSameName.exists) {
        await interaction.reply({ content: `A project with the name ${projectName} already exists (possibly safe deleted). The name must be unique.` });
        return;
    }

    const project = (await Database.getProjectByName(projectName)).result;
    const nameBefore = project.name;

    await project.setName(newName);

    await interaction.reply({ content: `${nameBefore} has been renamed to ${newName}`, ephemeral: true });
}

async function executeSetDisplayName(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");

    if (!projectName || !displayName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    var nameBefore = project.displayName;

    await project.setDisplayName(displayName);

    await interaction.reply({ content: `${nameBefore}'s display name has been changed to ${displayName}`, ephemeral: true });
}

async function executeDeleteProject(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.delete();

    await interaction.reply({ content: `Deleted ${project.displayName}`, ephemeral: true });
}

async function executeRemoveStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");

    if (!projectName || !user)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.staff = project.staff.filter(staff => staff.discordUserId !== user.id);
    project.save();
    Database.updateStaffRoles(user.id);

    await interaction.reply({ content: `Removed the user ${user} from ${project.displayName}`, allowedMentions: { parse: [] }, ephemeral: true });
}

async function executeRemoveLink(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");

    if (!projectName || !linkName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.links = project.links.filter(link => link.linkName !== linkName);
    project.save();

    await interaction.reply({ content: `Removed the link \`${linkName}\` from ${project.displayName}`, ephemeral: true });
}

async function executeListStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    let reply = project.displayName + "'s Staff\n--------------------\n";

    for (const staff of project.staff)
        reply += `- <@${staff.discordUserId}> ~ ${ProjectStaffRank[staff.rank]}\n`;

    await interaction.reply({ content: reply, allowedMentions: { parse: [] } });
}

async function executeAddStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");
    const rank = interaction.options.getString("rank");

    if (!projectName || !user || !rank)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    if (project.addStaff(new ProjectStaff(project.id, user.id, +rank))) {
        project.save();
        Database.updateStaffRoles(user.id);

        await interaction.reply({ content: `Added ${user.toString()} to the staff of ${project.displayName} as a ${ProjectStaffRank[+rank]}`, allowedMentions: { parse: [] }, ephemeral: true });
    } else {
        await interaction.reply({ content: `${user.toString()} is already a staff member of ${project.displayName} with the role ${ProjectStaffRank[+rank]}`, allowedMentions: { parse: [] }, ephemeral: true });
    }
}

async function executeListLinks(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    let reply = project.displayName + "'s Links\n--------------------\n";

    for (const link of project.links)
        reply += `- [${link.linkName}](${link.linkUrl})\n`;

    await interaction.reply(reply);
}

async function executeAddLink(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");
    const linkURL = interaction.options.getString("url");

    if (!projectName || !linkName || !linkURL)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    project.links.push(new ProjectLink(project.id, 0, linkName, linkURL));
    // MAY CAUSE ERROR, MAY NEED TO GET LINKS, PUSH, THEN SET

    project.save();

    await interaction.reply({ content: `Added the link [${linkName}](${linkURL}) to ${project.displayName}`, ephemeral: true });
}


async function executeSetGuildID(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const guildId = interaction.options.getString("guild_id");

    if (!projectName || !guildId)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.guildId = guildId;
    project.save();

    await interaction.reply({ content: `Linked ${guildId} to ${project.displayName}`, ephemeral: true });
}

async function executeSetAttachments(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const msgId = interaction.options.getString("msg_with_attachments_id");

    if (!interaction.channel || !msgId || !projectName)
        return;

    if (isNaN(Number(msgId))) {
        await interaction.reply({ content: "You must provide a valid message ID for the description", ephemeral: true });
        return;
    }

    try {
        const message = await interaction.channel.messages.fetch(msgId);
        const project = (await Database.getProjectByName(projectName)).result;

        var newAttachments: ProjectAttachment[] = [];
        const imageDirectory = path.join(process.cwd(), `dist/database/projects/images`);

        for (const attachment of message.attachments.values()) {
            // Download image
            if (!fs.existsSync(imageDirectory)) {
                fs.mkdirSync(imageDirectory);
            }

            const downloadedImage = await downloadImage(attachment.url, path.join(imageDirectory, attachment.name));

            // Create attachment
            newAttachments.push(new ProjectAttachment(project.id, 0, attachment.name));
        }

        project.attachments = newAttachments;
        project.save();

        await interaction.reply({ content: `${project.displayName}'s attachments have been set`, ephemeral: true });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message == "Unknown Message") {
                await interaction.reply({ content: "You must input the ID of a valid message for this command", ephemeral: true })
                return;
            }
        }

        await interaction.reply({ content: "An internal error occurred. Yell at Theeef!", ephemeral: true });
        console.error(error);
    }
}

function downloadImage(url: string, filepath: string) {
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}

async function executeSetType(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const type = interaction.options.getString("type");

    if (!projectName || !type)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    const projectTypeResult = ProjectType.fromString(type);

    if (projectTypeResult.exists) {
        project.type = ProjectType.fromString(type).result;
        project.save();

        await interaction.reply({ content: `${project.displayName}'s type was set to ${projectTypeResult.result}`, ephemeral: true });
    } else {
        await interaction.reply({ content: `The project type ${type} does not exist`, ephemeral: true });
    }
}

async function executeSetDescription(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const descriptionMessageId = interaction.options.getString("description_msg_id");

    if (!projectName || !descriptionMessageId || !interaction.channel)
        return;

    if (isNaN(Number(descriptionMessageId))) {
        await interaction.reply({ content: "You must provide a valid message ID for the description", ephemeral: true });
        return;
    }

    try {
        const message = await interaction.channel.messages.fetch(descriptionMessageId)
        const description = message.content;
        const project = (await Database.getProjectByName(projectName)).result;

        project.description = description;
        project.save();

        await interaction.reply({ content: `${project.displayName} has been given the following description:\n${description}`, ephemeral: true });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message == "Unknown Message") {
                await interaction.reply({ content: "You must input the ID of a valid message for this command", ephemeral: true })
                return;
            }
        }

        await interaction.reply({ content: "An internal error occurred. Yell at Theeef!", ephemeral: true });
        console.error(error);
    }
}

async function executeSetEmoji(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const emojiIdOrUnicode = interaction.options.getString("emoji_string");

    if (!projectName || !emojiIdOrUnicode)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    project.emoji = emojiIdOrUnicode;
    project.save();

    await interaction.reply({ content: `${project.displayName}'s emoji set to \`${project.emoji}\``, ephemeral: true });
}

async function executeSetStatus(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const status = interaction.options.getString("status");

    if (!projectName || !status)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    project.status = +status;
    project.save();

    await interaction.reply({ content: `${project.displayName}'s status set to ${ProjectStatus[+status]}`, ephemeral: true });
}

async function executeSetIp(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const ipString = interaction.options.getString("ip_string");

    if (!projectName || !ipString)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.ip = ipString;
    project.save();

    await interaction.reply({ content: `${project.displayName}'s IP set to \`${ipString}\``, ephemeral: true });
}

async function executeCreateProject(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");
    const type = interaction.options.getString("type");

    if (!projectName || !displayName || !type)
        return;

    if (projectName.toLowerCase() != projectName || projectName.includes(" ")) {
        await interaction.reply({ content: `Your submitted project name (${projectName}) is invalid as it contains uppercase characters or whitespaces`, ephemeral: true });
        return;
    }

    const projectWithSameName = await Database.getProjectByName(projectName);

    if (projectWithSameName.exists) {
        await interaction.reply({ content: `A project with the name ${projectName} already exists (possibly safe deleted). The name must be unique.` });
        return;
    }

    Database.createNewProject(projectName, displayName, ProjectType.fromString(type).result);

    await interaction.reply({ content: `Project created with project_name: \`${projectName}\`, and display_name: \`${displayName}\``, ephemeral: true });
}

export { autocomplete, data, execute };

