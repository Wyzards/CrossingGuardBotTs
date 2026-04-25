import { Accessibility, AccessibilityHelper, ArchitectApproval, ArchitectApprovalHelper, CommunityVetted, CommunityVettedHelper, ProjectStaffRank, ProjectStaffRankHelper, ProjectStage, ProjectStageHelper, ProjectType, ProjectTypeHelper } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { MessageFlags } from "discord-api-types/v10";
import { AutocompleteInteraction, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { IOperationReporter, OperationTracker } from "../../../shared/operations.js";
import { Bot } from "../../Bot.js";

const projectStageChoices = ProjectStageHelper.values().map(stage => ({
    name: ProjectStageHelper.pretty(stage as ProjectStage),
    value: stage,
}));

const projectTypeChoices = ProjectTypeHelper.values().map(type => ({
    name: ProjectTypeHelper.pretty(type as ProjectType),
    value: type,
}));
const architectApprovalChoices = ArchitectApprovalHelper.values().map(approval => ({
    name: ArchitectApprovalHelper.pretty(approval as ArchitectApproval),
    value: approval,
}));
const communityVettedChoices = CommunityVettedHelper.values().map(vetted => ({
    name: CommunityVettedHelper.pretty(vetted as CommunityVetted),
    value: vetted,
}));
const accessibilityChoices = AccessibilityHelper.values().map(accessibility => ({
    name: AccessibilityHelper.pretty(accessibility as Accessibility),
    value: accessibility,
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
            .addSubcommand(subcommand =>
                subcommand.setName("architect_approval")
                    .setDescription("Set a project's Architect approval status")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("architect_approval")
                            .setDescription("The Architect approval status")
                            .setRequired(true)
                            .addChoices(...architectApprovalChoices)))
            .addSubcommand(subcommand =>
                subcommand.setName("community_vetted")
                    .setDescription("Set a project's Community Vetting status")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("community_vetted")
                            .setDescription("The Community Vetting status")
                            .setRequired(true)
                            .addChoices(...communityVettedChoices)))
            .addSubcommand(subcommand =>
                subcommand.setName("accessibility")
                    .setDescription("Set a project's accessibility")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("accessibility")
                            .setDescription("The accessibility status of project")
                            .setRequired(true)
                            .addChoices(...accessibilityChoices)))
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
                subcommand.setName("stage")
                    .setDescription("Set a project's stage")
                    .addStringOption(option =>
                        option.setName("project")
                            .setDescription("The name of the project")
                            .setAutocomplete(true)
                            .setRequired(true))
                    .addStringOption(option =>
                        option.setName("stage")
                            .setDescription("The current stage of the project")
                            .setRequired(true)
                            .addChoices(...projectStageChoices)))
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

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    const projects = await bot.projectOrchestrator.repo.list();
    const focusedValue = interaction.options.getFocused();
    const filtered = projects.filter(project => project.name.toLowerCase().includes(focusedValue.toLowerCase()) || project.display_name?.toLowerCase().includes(focusedValue.toLocaleLowerCase())) ?? false;

    await interaction.respond(
        filtered.slice(0, 24).map(projectChoice => ({ name: projectChoice.display_name ?? projectChoice.name, value: projectChoice.name })),
    );
}

async function execute(bot: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();
    const projectName = interaction.options.getString("project");

    if (projectName && subcommand != "create" && !await bot.projectOrchestrator.repo.existsByName(projectName)) {
        interaction.editReply({ content: `No project matched the name ${projectName}` });
        return;
    }

    const tracker = new OperationTracker(interaction);

    try {
        if (subcommandGroup == "set") {
            if (subcommand == "type")
                await executeSetType(bot, interaction, tracker);
            if (subcommand == "architect_approval")
                await executeSetArchitectApproval(bot, interaction, tracker);
            if (subcommand == "community_vetted")
                await executeSetCommunityVetted(bot, interaction, tracker);
            if (subcommand == "accessibility")
                await executeSetAccessibility(bot, interaction, tracker);
            else if (subcommand == "ip")
                await executeSetIp(bot, interaction, tracker);
            else if (subcommand == "version")
                await executeSetVersion(bot, interaction, tracker);
            else if (subcommand == "stage")
                await executeSetStage(bot, interaction, tracker);
            else if (subcommand == "emoji")
                await executeSetEmoji(bot, interaction, tracker);
            else if (subcommand == "description")
                await executeSetDescription(bot, interaction, tracker);
            else if (subcommand == "attachments")
                await executeSetAttachments(bot, interaction);
            else if (subcommand == "discord_id")
                await executeSetGuildID(bot, interaction);
            else if (subcommand == "display_name")
                await executeSetDisplayName(bot, interaction, tracker);
            else if (subcommand == "name")
                await executeSetName(bot, interaction, tracker);
        }

        else if (subcommandGroup == "links") {
            if (subcommand == "add")
                await executeAddLink(bot, interaction, tracker);
            else if (subcommand == "list")
                await executeListLinks(bot, interaction);
            else if (subcommand == "remove")
                await executeRemoveLink(bot, interaction, tracker);
        }

        else if (subcommandGroup == "staff") {
            if (subcommand == "add")
                await executeAddStaff(bot, interaction, tracker);
            else if (subcommand == "list")
                // TODO: Add autocomplete for links removal names
                await executeListStaff(bot, interaction);
            else if (subcommand == "remove")
                await executeRemoveStaff(bot, interaction, tracker);
        }

        else if (subcommand == "create")
            await executeCreateProject(bot, interaction);
        else if (subcommand == "delete")
            await executeDeleteProject(bot, interaction);
        else if (subcommand == "updateviews")
            await executeUpdateViews(bot, interaction, tracker);
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

async function executeUpdateViews(bot: Bot, interaction: ChatInputCommandInteraction, reporter: IOperationReporter) {
    const projects = await bot.projectOrchestrator.repo.list();
    const projectName = interaction.options.getString("project"); // Can be null

    var count = 0;

    for (const project of projects) {
        if (projectName != null && project.name != projectName)
            continue;

        // TODO: Make this a promise.all()

        count++;
        await bot.projectOrchestrator.sync(project, async () => {
            await bot.projectListOrchestrator.syncProject(project);
        }, reporter);
        await interaction.editReply(`Edited ${count}/${projectName == null ? projects.length : 1} project views`);
    }
}

async function executeSetName(bot: Bot, interaction: ChatInputCommandInteraction, reporter: IOperationReporter) {
    const projectName = interaction.options.getString("project");
    const newName = interaction.options.getString("new_name");

    if (!projectName || !newName)
        return;

    if (newName.toLowerCase() != newName || newName.includes(" ")) {
        await interaction.editReply({ content: `Your submitted project name (${newName}) is invalid as it contains uppercase characters or whitespaces` });
        return;
    }

    const projectWithSameName = await bot.projectOrchestrator.repo.existsByName(newName);

    if (projectWithSameName) {
        await interaction.editReply({ content: `A project with the name ${projectName} already exists (possibly safe deleted). The name must be unique.` });
        return;
    }

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    const nameBefore = project.name;

    project.name = newName;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);
    await interaction.editReply({ content: `${nameBefore} has been renamed to ${newName}` });
}

async function executeSetDisplayName(bot: Bot, interaction: ChatInputCommandInteraction, reporter: IOperationReporter) {
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");

    if (!projectName || !displayName)
        return;


    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    var nameBefore = project.display_name;

    project.display_name = displayName;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    if (nameBefore)
        await interaction.editReply({ content: `${nameBefore}'s display name has been changed to ${displayName}` });
    else
        await interaction.editReply({ content: `${project.name} display name has been set to ${displayName}` });
}

async function executeDeleteProject(bot: Bot, interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    await bot.projectOrchestrator.delete(project);
    await interaction.editReply({ content: `Deleted ${project.display_name}` });
}

async function executeRemoveStaff(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");

    if (!projectName || !user)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    const staff = project.staff.find(s => s.user.discordId === user.id);

    if (!staff) {
        await reporter.finalize(`That user is not staff on ${project.display_name}`);
        return;
    }

    await bot.projectOrchestrator.removeStaff(project, staff, reporter);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);
    await reporter.finalize(`Removed the user ${user} from ${project.display_name}`);
}

async function executeRemoveLink(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");

    if (!projectName || !linkName)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    const link = project.links.find(l => l.label === linkName);

    if (link) {
        await bot.projectOrchestrator.removeLink(project, link, reporter);
        await bot.projectOrchestrator.sync(project, async () => {
            await bot.projectListOrchestrator.syncProject(project);
        }, reporter);
        await reporter.finalize(`Removed the link \`${linkName}\` from ${project.display_name}`);
    } else {
        await reporter.finalize(`A link with the name ${linkName} does not exist on the project ${project.display_name}!`);
    }
}

async function executeListStaff(bot: Bot, interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    let reply = project.display_name ?? project.name + " Staff\n--------------------\n";

    for (const staff of project.staff)
        reply += `- <@${staff.user.discordId}> ~ ${staff.rank}\n`;

    await interaction.editReply({ content: reply, allowedMentions: { parse: [] } });
}

async function executeAddStaff(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const user = interaction.options.getUser("user");
    const rank = interaction.options.getString("rank") as ProjectStaffRank;

    if (!projectName || !user || !rank)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    await bot.projectOrchestrator.addOrSetStaff(project, user.id, rank, reporter);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);
    await reporter.finalize(`Added ${user.toString()} to the staff of ${project.display_name} as a ${ProjectStaffRankHelper.pretty(rank)}`);
}

async function executeListLinks(bot: Bot, interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");

    if (!projectName)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    let reply = project.display_name + " Links\n--------------------\n";

    for (const link of project.links)
        reply += `- [${link.label}](${link.url})\n`;

    await interaction.editReply(reply);
}

async function executeAddLink(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const linkName = interaction.options.getString("name");
    const linkURL = interaction.options.getString("url");

    if (!projectName || !linkName || !linkURL)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    await bot.projectOrchestrator.addLink(project, linkName, linkURL, reporter);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    await reporter.finalize(`Added the link [${linkName}](${linkURL}) to ${project.display_name}`);
}


async function executeSetGuildID(bot: Bot, interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const guildId = interaction.options.getString("guild_id");

    if (!projectName || !guildId)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    await bot.projectOrchestrator.setDiscord(project, guildId);

    await interaction.editReply({ content: `Linked ${guildId} to ${project.display_name}` });
}

async function executeSetAttachments(bot: Bot, interaction: ChatInputCommandInteraction) {
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
        const project = await getProjectByName(bot, interaction, projectName);

        if (!project)
            return;

        await bot.projectOrchestrator.setAttachments(project, attachments);
        await bot.projectOrchestrator.sync(project, async () => {
            await bot.projectListOrchestrator.syncProject(project);
        });

        await interaction.editReply({ content: `${project.display_name}'s attachments have been set` });
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

async function executeSetType(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const type = interaction.options.getString("type") as ProjectType;

    if (!projectName || !type)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    project.type = type;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    await reporter.finalize(`${project.display_name}'s type was set to ${ProjectTypeHelper.pretty(type)}`);
}

async function executeSetArchitectApproval(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const architectApproval = interaction.options.getString("architect_approval") as ArchitectApproval;

    if (!projectName || !architectApproval)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    project.architect_approval = architectApproval;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    await reporter.finalize(`${project.display_name}'s Architect approval status was set to ${ArchitectApprovalHelper.pretty(architectApproval)}`);
}

async function executeSetCommunityVetted(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const communityVetted = interaction.options.getString("community_vetted") as CommunityVetted;

    if (!projectName || !communityVetted)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    project.community_vetted = communityVetted;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    await reporter.finalize(`${project.display_name}'s Community Vetting status was set to ${CommunityVettedHelper.pretty(communityVetted)}`);
}

async function executeSetAccessibility(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const accesibility = interaction.options.getString("accessibility") as Accessibility;

    if (!projectName || !accesibility)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    project.accessibility = accesibility;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    await reporter.finalize(`${project.display_name}'s accessibility status was set to ${AccessibilityHelper.pretty(accesibility)}`);
}

async function executeSetDescription(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
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
        const project = await getProjectByName(bot, interaction, projectName);

        if (!project)
            return;

        project.description = description;
        await bot.projectOrchestrator.save(project);
        await bot.projectOrchestrator.sync(project, async () => {
            await bot.projectListOrchestrator.syncProject(project);
        }, reporter);

        await reporter.finalize(`${project.display_name} has been given the following description:\n${description}`);
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

async function executeSetEmoji(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const emojiIdOrUnicode = interaction.options.getString("emoji_string");

    if (!projectName || !emojiIdOrUnicode)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;
    project.emoji = emojiIdOrUnicode;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    await reporter.finalize(`${project.display_name}'s emoji set to \`${project.emoji}\``);
}

async function executeSetStage(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const stage = interaction.options.getString("stage") as ProjectStage;

    if (!projectName || !stage)
        return;


    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    project.project_stage = stage;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);
    await reporter.finalize(`${project.display_name}'s stage set to ${ProjectStageHelper.pretty(stage as ProjectStage)}`);
}

async function executeSetIp(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const ip = interaction.options.getString("ip");

    if (!projectName || !ip)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    project.ip = ip;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    await reporter.finalize(`${project.display_name}'s IP set to \`${ip}\``);
}

async function executeSetVersion(bot: Bot, interaction: ChatInputCommandInteraction, reporter: OperationTracker) {
    const projectName = interaction.options.getString("project");
    const version = interaction.options.getString("version");

    if (!projectName || !version)
        return;

    const project = await getProjectByName(bot, interaction, projectName);

    if (!project)
        return;

    project.version = version;
    await bot.projectOrchestrator.save(project);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    }, reporter);

    await reporter.finalize(`${project.display_name}'s version set to \`${version}\``);
}

async function executeCreateProject(bot: Bot, interaction: ChatInputCommandInteraction) {
    const projectName = interaction.options.getString("project");
    const displayName = interaction.options.getString("display_name");
    const type = interaction.options.getString("type") as ProjectType;

    if (!projectName || !displayName || !type)
        return;

    if (projectName.toLowerCase() != projectName || projectName.includes(" ")) {
        await interaction.editReply({ content: `Your submitted project name (${projectName}) is invalid as it contains uppercase characters or whitespaces` });
        return;
    }

    const projectWithSameName = await bot.projectOrchestrator.repo.existsByName(projectName);

    if (projectWithSameName) {
        await interaction.editReply({ content: `A project with the name ${projectName} already exists (possibly safe deleted). The name must be unique.` });
        return;
    }

    const project = await bot.projectOrchestrator.createNewProject(projectName, displayName, type);
    await bot.projectOrchestrator.sync(project, async () => {
        await bot.projectListOrchestrator.syncProject(project);
    });

    await interaction.editReply({ content: `Project created with project_name: \`${project.name}\`, and display_name: \`${project.display_name}\`` });
}

async function getProjectByName(bot: Bot, interaction: ChatInputCommandInteraction, name: string) {
    const project = await bot.projectOrchestrator.repo.getByName(name);

    if (!project) {
        await interaction.editReply({ content: `Could not find project ${name}` });
    }

    return project;
}

export { autocomplete, data, execute };

