import { ProjectStaffRank, ProjectStaffRankHelper, ProjectStatus, ProjectStatusHelper, ProjectType, ProjectTypeHelper } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { AutocompleteInteraction, ChatInputCommandInteraction, Message, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Database from "../../../database/Database.js";
import ProjectLink from "../../../database/projects/ProjectLink.js";
import ProjectStaff from "../../../database/projects/ProjectStaff.js";
import { MessageFlags } from "discord-api-types/v10";
import { IOperationReporter, OperationTracker } from "../../../util/operations.js";
import { ProjectRepository } from "../../../repositories/ProjectRepository.js";

const projectStatusChoices = ProjectStatusHelper.values().map(status => ({
    name: ProjectStatusHelper.pretty(status),
    value: status,
}));

const projectTypeChoices = ProjectTypeHelper.values().map(type => ({
    name: ProjectTypeHelper.pretty(type),
    value: type,
}));

const projectStaffRankChoices = ProjectStaffRankHelper.values().map(rank => ({
    name: ProjectStaffRankHelper.pretty(rank),
    value: rank,
}));

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
                    .addChoices(...projectTypeChoices)))
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
                            .addChoices(...projectStaffRankChoices)))
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
                            .addChoices(...projectTypeChoices)))
            // Set IP
            .addSubcommand(subcommand =>
                subcommand.setName("ip")
                    .setDescription("Set a project's ip address")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("ip")
                            .setDescription("The project's ip address")
                            .setRequired(true)))
            .addSubcommand(subcommand =>
                subcommand.setName("version")
                    .setDescription("Set a project's version")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("version")
                            .setDescription("The version(s) of the project")
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
                            .addChoices(...projectStatusChoices)))
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
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const projectName = interaction.options.getString("project");

    if (projectName && subcommand != "create" && !await Database.projectExists(projectName)) {
        interaction.editReply({ content: `No project matched the name ${projectName}` });
        return;
    }

    const tracker = new OperationTracker(interaction);

    try {
        if (subcommandGroup == "set") {
            if (subcommand == "type")
                await executeSetType(interaction, tracker);
            else if (subcommand == "ip")
                await executeSetIp(interaction, tracker);
            else if (subcommand == "version")
                await executeSetVersion(interaction, tracker);
            else if (subcommand == "status")
                await executeSetStatus(interaction, tracker);
            else if (subcommand == "emoji")
                await executeSetEmoji(interaction, tracker);
            else if (subcommand == "description")
                await executeSetDescription(interaction, tracker);
            else if (subcommand == "attachments")
                await executeSetAttachments(interaction);
            else if (subcommand == "discord_id")
                await executeSetGuildID(interaction);
            else if (subcommand == "display_name")
                await executeSetDisplayName(interaction);
            else if (subcommand == "name")
                await executeSetName(interaction);
        }

        else if (subcommandGroup == "links") {
            if (subcommand == "add")
                await executeAddLink(interaction, tracker);
            else if (subcommand == "list")
                await executeListLinks(interaction);
            else if (subcommand == "remove")
                await executeRemoveLink(interaction, tracker);
        }

        else if (subcommandGroup == "staff") {
            if (subcommand == "add")
                await executeAddStaff(interaction, tracker);
            else if (subcommand == "list")
                await executeListStaff(interaction);
            else if (subcommand == "remove")
                await executeRemoveStaff(interaction, tracker);
        }

        else if (subcommand == "create")
            await executeCreateProject(interaction);
        else if (subcommand == "delete")
            await executeDeleteProject(interaction);
        else if (subcommand == "updateviews")
            await executeUpdateViews(interaction);
    } catch (err) {
        if (err instanceof Error) {
            const error = err as Error;
            await tracker.finalize(`ERROR: ${error.message}`);

            console.error(error.stack);
        } else {
            await tracker.finalize(`ERROR: ${typeof err === "string" ? err : String(err)}`);

            console.error(err);
        }

    }
}

async function executeUpdateViews(interaction: ChatInputCommandInteraction) {
    const projects = await Database.projectList();
    const projectName = interaction.options.getString("project"); // Can be null

    var count = 0;

    for (const project of projects) {
        if (projectName != null && project.name != projectName)
            continue;

        count++;
        await project.updateView(true);
        await interaction.editReply(`Edited ${count}/${projectName == null ? projects.length : 1} project views`);
    }
}

async function executeSetName(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const newName = interaction.options.getString("new_name");

    if (!projectName || !newName)
        return;

    if (newName.toLowerCase() != newName || newName.includes(" ")) {
        await interaction.editReply({ content: `Your submitted project name (${newName}) is invalid as it contains uppercase characters or whitespaces` });
        return;
    }

    const projectWithSameName = await Database.getProjectByName(newName);

    if (projectWithSameName.exists) {
        await interaction.editReply({ content: `A project with the name ${projectName} already exists (possibly safe deleted). The name must be unique.` });
        return;
    }

    const project = (await Database.getProjectByName(projectName)).result;
    const nameBefore = project.name;

    await project.setName(newName);

    await interaction.editReply({ content: `${nameBefore} has been renamed to ${newName}` });
}

async function executeSetDisplayName(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");

    if (!projectName || !displayName)
        return;


    const project = (await Database.getProjectByName(projectName)).result;

    var nameBefore = project.displayName;

    await project.setDisplayName(displayName);

    await interaction.editReply({ content: `${nameBefore}'s display name has been changed to ${displayName}` });
}

async function executeDeleteProject(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    await project.delete();

    await interaction.editReply({ content: `Deleted ${project.displayName}` });
}

async function executeRemoveStaff(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");

    if (!projectName || !user)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    project.staff = project.staff.filter(staff => staff.user.discordId !== user.id);

    await Database.getProjectRepo().removeStaff(project, user.id, reporter);
    await reporter.finalize(`Removed the user ${user} from ${project.displayName}`);
}

async function executeRemoveLink(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");

    if (!projectName || !linkName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    const link = project.links.find(l => l.label === linkName);

    if (link) {
        await Database.getProjectRepo().removeLink(project, link, reporter);
        await reporter.finalize(`Removed the link \`${linkName}\` from ${project.displayName}`);
    } else {
        await reporter.finalize(`A link with the name ${linkName} does not exist on the project ${project.displayName}!`);
    }
}

async function executeListStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    let reply = project.displayName + "'s Staff\n--------------------\n";

    for (const staff of project.staff)
        reply += `- <@${staff.user.discordId}> ~ ${staff.rank}\n`;

    await interaction.editReply({ content: reply, allowedMentions: { parse: [] } });
}

async function executeAddStaff(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");
    const rank = interaction.options.getString("rank") as ProjectStaffRank;

    if (!projectName || !user || !rank)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    await Database.getProjectRepo().addOrSetStaff(project, user.id, rank, reporter);
    await reporter.finalize(`Added ${user.toString()} to the staff of ${project.displayName} as a ${ProjectStaffRankHelper.pretty(rank)}`);
}

async function executeListLinks(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    let reply = project.displayName + "'s Links\n--------------------\n";

    for (const link of project.links)
        reply += `- [${link.label}](${link.url})\n`;

    await interaction.editReply(reply);
}

async function executeAddLink(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");
    const linkURL = interaction.options.getString("url");

    if (!projectName || !linkName || !linkURL)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    await Database.getProjectRepo().addLink(project, linkName, linkURL, reporter);

    await reporter.finalize(`Added the link [${linkName}](${linkURL}) to ${project.displayName}`);
}


async function executeSetGuildID(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const guildId = interaction.options.getString("guild_id");

    if (!projectName || !guildId)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.guildId = guildId;
    await Database.getProjectRepo().save(project);

    await interaction.editReply({ content: `Linked ${guildId} to ${project.displayName}` });
}

async function executeSetAttachments(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const msgId = interaction.options.getString("msg_with_attachments_id");

    if (!interaction.channel || !msgId || !projectName)
        return;

    if (isNaN(Number(msgId))) {
        await interaction.editReply({ content: "You must provide a valid message ID for the description" });
        return;
    }

    try {
        const message = await interaction.channel.messages.fetch(msgId);
        const attachments = Array.from(message.attachments.values());
        const project = (await Database.getProjectByName(projectName)).result;

        await Database.setAttachments(project, attachments);
        await interaction.editReply({ content: `${project.displayName}'s attachments have been set` });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message == "Unknown Message") {
                await interaction.editReply({ content: "You must input the ID of a valid message for this command" })
                return;
            }
        }

        await interaction.editReply({ content: "An internal error occurred. Yell at Theeef!" });
    }
}

async function executeSetType(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const type = interaction.options.getString("type") as ProjectType;

    if (!projectName || !type)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.type = type;
    await Database.getProjectRepo().save(project, true, reporter);

    await reporter.finalize(`${project.displayName}'s type was set to ${ProjectTypeHelper.pretty(type)}`);
}

async function executeSetDescription(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const descriptionMessageId = interaction.options.getString("description_msg_id");

    if (!projectName || !descriptionMessageId || !interaction.channel)
        return;

    if (isNaN(Number(descriptionMessageId))) {
        await interaction.editReply({ content: "You must provide a valid message ID for the description" });
        return;
    }

    try {
        const message = await interaction.channel.messages.fetch(descriptionMessageId)
        const description = message.content;
        const project = (await Database.getProjectByName(projectName)).result;

        project.description = description;
        await Database.getProjectRepo().save(project, true, reporter);

        await reporter.finalize(`${project.displayName} has been given the following description:\n${description}`);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message == "Unknown Message") {
                await reporter.finalize("You must input the ID of a valid message for this command");
                return;
            }
        }

        throw error;
    }
}

async function executeSetEmoji(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const emojiIdOrUnicode = interaction.options.getString("emoji_string");

    if (!projectName || !emojiIdOrUnicode)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    project.emoji = emojiIdOrUnicode;
    await Database.getProjectRepo().save(project, true, reporter);

    await reporter.finalize(`${project.displayName}'s emoji set to \`${project.emoji}\``);
}

async function executeSetStatus(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const status = interaction.options.getString("status") as ProjectStatus;

    if (!projectName || !status)
        return;


    const project = (await Database.getProjectByName(projectName)).result;
    project.status = status;
    await Database.getProjectRepo().save(project, true, reporter);
    await reporter.finalize(`${project.displayName}'s status set to ${ProjectStatusHelper.pretty(status as ProjectStatus)}`);
}

async function executeSetIp(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const ip = interaction.options.getString("ip");

    if (!projectName || !ip)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.ip = ip;
    await Database.getProjectRepo().save(project, true, reporter);

    await reporter.finalize(`${project.displayName}'s IP set to \`${ip}\``);
}

async function executeSetVersion(interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const version = interaction.options.getString("version");

    if (!projectName || !version)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.version = version;
    await Database.getProjectRepo().save(project, true, reporter);

    await reporter.finalize(`${project.displayName}'s version set to \`${version}\``);
}

async function executeCreateProject(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");
    const type = interaction.options.getString("type") as ProjectType;

    if (!projectName || !displayName || !type)
        return;

    if (projectName.toLowerCase() != projectName || projectName.includes(" ")) {
        await interaction.editReply({ content: `Your submitted project name (${projectName}) is invalid as it contains uppercase characters or whitespaces` });
        return;
    }

    const projectWithSameName = await Database.getProjectByName(projectName);

    if (projectWithSameName.exists) {
        await interaction.editReply({ content: `A project with the name ${projectName} already exists (possibly safe deleted). The name must be unique.` });
        return;
    }

    const project = await Database.createNewProject(projectName, displayName, type);

    await interaction.editReply({ content: `Project created with project_name: \`${project.name}\`, and display_name: \`${project.displayName}\`` });
}

export { autocomplete, data, execute };

