import { ProjectStaffRank, ProjectStaffRankHelper, ProjectStatus, ProjectStatusHelper, ProjectType, ProjectTypeHelper } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { AutocompleteInteraction, ChatInputCommandInteraction, Message, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Database from "../../../database/Database.js";
import ProjectLink from "../../../database/projects/ProjectLink.js";
import ProjectStaff from "../../../database/projects/ProjectStaff.js";
import { MessageFlags } from "discord-api-types/v10";
import { OperationTracker } from "../../../util/operations.js";

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
    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const projectName = interaction.options.getString("project");

    if (projectName && subcommand != "create" && !await Database.projectExists(projectName)) {
        interaction.editReply({ content: `No project matched the name ${projectName}` });
        return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const tracker = new OperationTracker(interaction);

    try {
        if (subcommandGroup == "set") {
            if (subcommand == "type")
                await executeSetType(interaction);
            else if (subcommand == "ip")
                await executeSetIp(interaction);
            else if (subcommand == "status")
                await executeSetStatus(interaction, tracker);
            else if (subcommand == "emoji")
                await executeSetEmoji(interaction);
            else if (subcommand == "description")
                await executeSetDescription(interaction);
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
                await executeAddLink(interaction);
            else if (subcommand == "list")
                await executeListLinks(interaction);
            else if (subcommand == "remove")
                await executeRemoveLink(interaction);
        }

        else if (subcommandGroup == "staff") {
            if (subcommand == "add")
                await executeAddStaff(interaction);
            else if (subcommand == "list")
                await executeListStaff(interaction);
            else if (subcommand == "remove")
                await executeRemoveStaff(interaction);
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
            await interaction.editReply({ content: `ERROR: ${error.message}` });

            console.error(error.stack);
        } else {
            await interaction.editReply({
                content: `ERROR: ${typeof err === "string" ? err : String(err)}`
            });

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

async function executeRemoveStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");

    if (!projectName || !user)
        return;

    const project = (await Database.getProjectByName(projectName)).result;
    project.staff = project.staff.filter(staff => staff.discordUserId !== user.id);
    await Database.getProjectRepo().save(project)
    await Database.updateStaffRoles(user.id);

    await interaction.editReply({ content: `Removed the user ${user} from ${project.displayName}`, allowedMentions: { parse: [] } });
}

async function executeRemoveLink(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");

    if (!projectName || !linkName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.links = project.links.filter(link => link.linkName !== linkName);
    await Database.getProjectRepo().save(project);

    await interaction.editReply({ content: `Removed the link \`${linkName}\` from ${project.displayName}` });
}

async function executeListStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    let reply = project.displayName + "'s Staff\n--------------------\n";

    for (const staff of project.staff)
        reply += `- <@${staff.discordUserId}> ~ ${staff.rank}\n`;

    await interaction.editReply({ content: reply, allowedMentions: { parse: [] } });
}

async function executeAddStaff(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");
    const rank = interaction.options.getString("rank") as ProjectStaffRank;

    if (!projectName || !user || !rank)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    if (project.addStaff(new ProjectStaff(project.id, user.id, rank))) {
        await Database.getProjectRepo().save(project)
        await Database.updateStaffRoles(user.id);

        await interaction.editReply({ content: `Added ${user.toString()} to the staff of ${project.displayName} as a ${ProjectStaffRankHelper.pretty(rank)}`, allowedMentions: { parse: [] } });
    } else {
        await interaction.editReply({ content: `${user.toString()} is already a staff member of ${project.displayName} with the role ${ProjectStaffRankHelper.pretty(rank)}`, allowedMentions: { parse: [] } });
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

    await interaction.editReply(reply);
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

    await Database.getProjectRepo().save(project);

    await interaction.editReply({ content: `Added the link [${linkName}](${linkURL}) to ${project.displayName}` });
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

async function executeSetType(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const type = interaction.options.getString("type") as ProjectType;

    if (!projectName || !type)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.type = type;
    await Database.getProjectRepo().save(project);

    await interaction.editReply({ content: `${project.displayName}'s type was set to ${ProjectTypeHelper.pretty(type)}` });
}

async function executeSetDescription(interaction: ChatInputCommandInteraction) {
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
        await Database.getProjectRepo().save(project);

        await interaction.editReply({ content: `${project.displayName} has been given the following description:\n${description}` });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message == "Unknown Message") {
                await interaction.editReply({ content: "You must input the ID of a valid message for this command" })
                return;
            }
        }

        await interaction.editReply({ content: "An internal error occurred. Yell at Theeef!" });
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
    await Database.getProjectRepo().save(project);

    await interaction.editReply({ content: `${project.displayName}'s emoji set to \`${project.emoji}\`` });
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

async function executeSetIp(interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const ipString = interaction.options.getString("ip_string");

    if (!projectName || !ipString)
        return;

    const project = (await Database.getProjectByName(projectName)).result;

    project.ip = ipString;
    await Database.getProjectRepo().save(project);

    await interaction.editReply({ content: `${project.displayName}'s IP set to \`${ipString}\`` });
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

