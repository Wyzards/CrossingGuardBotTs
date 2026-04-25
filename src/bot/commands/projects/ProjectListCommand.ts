import { Accessibility, AccessibilityHelper, ArchitectApproval, ArchitectApprovalHelper, CommunityVetted, CommunityVettedHelper, ProjectStage, ProjectStageHelper, ProjectType, ProjectTypeHelper } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { FilterField } from "@wyzards/crossroadsclientts/dist/types/filter.js";
import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { fieldOption, groupOption, listOption, operatorOption, tagOption, valueOption } from "../../../infrastructure/discord/helpers/projectListOptions.js";
import { OperationTracker } from "../../../shared/operations.js";
import { Bot } from "../../Bot.js";

const filterOperatorChoices = [
    { name: "Equals", value: "=" },
    { name: "Not Equals", value: "!=" },
] as const;

const filterFieldChoices = [
    { name: "Type", value: "type" },
    { name: "Project Stage", value: "project_stage" },
    { name: "Community Vetted", value: "community_vetted" },
    { name: "Architect Approval", value: "architect_approval" },
    { name: "Accessibility", value: "accessibility" },
] as const;

const filterValueChoices = {
    type: ProjectTypeHelper.values().map(v => ({
        name: ProjectTypeHelper.pretty(v as ProjectType),
        value: v,
    })),

    project_stage: ProjectStageHelper.values().map(v => ({
        name: ProjectStageHelper.pretty(v as ProjectStage),
        value: v,
    })),

    community_vetted: CommunityVettedHelper.values().map(v => ({
        name: CommunityVettedHelper.pretty(v as CommunityVetted),
        value: v,
    })),

    architect_approval: ArchitectApprovalHelper.values().map(v => ({
        name: ArchitectApprovalHelper.pretty(v as ArchitectApproval),
        value: v,
    })),

    accessibility: AccessibilityHelper.values().map(v => ({
        name: AccessibilityHelper.pretty(v as Accessibility),
        value: v,
    })),
} as const;

const validMap: Record<FilterField, readonly string[]> = {
    type: ProjectTypeHelper.values(),
    project_stage: ProjectStageHelper.values(),
    community_vetted: CommunityVettedHelper.values(),
    architect_approval: ArchitectApprovalHelper.values(),
    accessibility: AccessibilityHelper.values(),
};

type FilterRuleInput = {
    field: FilterField;
    operator: string;
    value: string;
}

const data = new SlashCommandBuilder()
    .setName("projectlist")
    .setDescription("Manage project lists")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    // ===== BASE =====
    .addSubcommand(sub =>
        sub.setName("create")
            .setDescription("Create a project list")
            .addStringOption(o => o.setName("name")
                .setDescription("The name of the project list to create")
                .setRequired(true))
    )

    .addSubcommand(sub =>
        sub.setName("delete")
            .setDescription("Delete a project list")
            .addStringOption(listOption(true))
    )

    .addSubcommand(sub =>
        sub.setName("list")
            .setDescription("List project lists")
    )

    .addSubcommand(sub =>
        sub.setName("view")
            .setDescription("View a project list")
            .addStringOption(listOption(true))
    )

    // ===== LIST FILTERS =====
    .addSubcommandGroup(group =>
        group.setName("filter")
            .setDescription("Manage list filters")

            .addSubcommand(sub =>
                sub.setName("add")
                    .setDescription("Add a filter rule to a list")
                    .addStringOption(listOption(true))
                    .addStringOption(fieldOption())
                    .addStringOption(operatorOption())
                    .addStringOption(valueOption())
                    .addStringOption(groupOption())
            )

            .addSubcommand(sub =>
                sub.setName("remove")
                    .setDescription("Remove a filter rule from a list")
                    .addStringOption(listOption(true))
                    .addStringOption(fieldOption())
                    .addStringOption(operatorOption())
                    .addStringOption(valueOption())
                    .addStringOption(groupOption())
            )

            .addSubcommand(sub =>
                sub.setName("clear")
                    .setDescription("Clear all filters from a list")
                    .addStringOption(listOption(true))
            )
    )

    // ===== TAGS =====
    .addSubcommandGroup(group =>
        group.setName("tag")
            .setDescription("Manage tags")

            .addSubcommand(sub =>
                sub.setName("create")
                    .setDescription("Create a tag on a list")
                    .addStringOption(listOption(true))
                    .addStringOption(o =>
                        o.setName("name")
                            .setDescription("The tag name")
                            .setRequired(true))
            )

            .addSubcommand(sub =>
                sub.setName("delete")
                    .setDescription("Delete a tag from a list")
                    .addStringOption(listOption(true))
                    .addStringOption(tagOption(true))
            )

            .addSubcommand(sub =>
                sub.setName("rename")
                    .setDescription("Rename a tag on a list")
                    .addStringOption(listOption(true))
                    .addStringOption(tagOption(true))
                    .addStringOption(o =>
                        o.setName("name")
                            .setDescription("The new tag name")
                            .setRequired(true))
            )

            .addSubcommand(sub =>
                sub.setName("list")
                    .setDescription("List tags on a list")
                    .addStringOption(listOption(true))
            )

            // ===== TAG FILTERS =====
            .addSubcommand(sub =>
                sub.setName("filter-add")
                    .setDescription("Add a filter to a tag")
                    .addStringOption(listOption(true))
                    .addStringOption(tagOption(true))
                    .addStringOption(fieldOption())
                    .addStringOption(operatorOption())
                    .addStringOption(valueOption())
                    .addStringOption(groupOption())
            )

            .addSubcommand(sub =>
                sub.setName("filter-remove")
                    .setDescription("Remove a filter from a tag")
                    .addStringOption(listOption(true))
                    .addStringOption(tagOption(true))
                    .addStringOption(fieldOption())
                    .addStringOption(operatorOption())
                    .addStringOption(valueOption())
                    .addStringOption(groupOption())
            )

            .addSubcommand(sub =>
                sub.setName("filter-list")
                    .setDescription("List tag filters")
                    .addStringOption(listOption(true))
                    .addStringOption(tagOption(true))
            )

            .addSubcommand(sub =>
                sub.setName("filter-clear")
                    .setDescription("Clear tag filters")
                    .addStringOption(listOption(true))
                    .addStringOption(tagOption(true))
            )
    );

function validateFilter(field: FilterField, value: string): boolean {
    return validMap[field]?.includes(value);
}

function parseAndValidateRule(interaction: ChatInputCommandInteraction): FilterRuleInput {
    const field = interaction.options.getString("field", true) as FilterField;
    const operator = interaction.options.getString("operator", true);
    const value = interaction.options.getString("value", true);

    if (!validMap[field]) {
        throw new Error(`Invalid filter field: ${field}`);
    }

    if (!validateFilter(field, value)) {
        throw new Error(
            `Invalid value "${value}" for field "${field}"`
        );
    }

    if (!operator || operator.length === 0) {
        throw new Error(`Operator is required`);
    }

    return {
        field,
        operator,
        value,
    };
}

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === "list") {
        return autocompleteLists(bot, interaction, focusedOption.value);
    }

    if (focusedOption.name === "tag") {
        return autocompleteTags(bot, interaction, focusedOption.value);
    }
}

async function autocompleteLists(bot: Bot, interaction: AutocompleteInteraction, query: string) {
    const lists = await bot.projectListOrchestrator.projectListRepo.list();

    const filtered = lists.filter(l =>
        l.name.toLowerCase().includes(query.toLowerCase())
    );

    await interaction.respond(
        filtered.slice(0, 24).map(l => ({
            name: l.name,
            value: l.id.toString(),
        }))
    );
}

async function autocompleteTags(bot: Bot, interaction: AutocompleteInteraction, query: string) {
    const listId = interaction.options.getString("list");

    if (!listId) {
        return interaction.respond([]);
    }

    const list = await bot.projectListOrchestrator.projectListRepo.getById(Number(listId));

    if (!list) {
        return interaction.respond([]);
    }

    const filtered = list.tags.filter(tag =>
        tag.name.toLowerCase().includes(query.toLowerCase())
    );

    await interaction.respond(
        filtered.slice(0, 24).map(tag => ({
            name: tag.name,
            value: tag.id.toString(), // or name if you prefer
        }))
    );
}

async function execute(bot: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand();
    const subcommandGroup = interaction.options.getSubcommandGroup();

    const tracker = new OperationTracker(interaction);

    try {
        // ===== BASE =====
        if (!subcommandGroup) {
            if (subcommand === "create")
                await executeCreateList(bot, interaction);

            else if (subcommand === "delete")
                await executeDeleteList(bot, interaction);

            else if (subcommand === "list")
                await executeListLists(bot, interaction);

            else if (subcommand === "view")
                await executeViewList(bot, interaction);
        }

        // ===== LIST FILTERS =====
        else if (subcommandGroup === "filter") {
            if (subcommand === "add")
                await executeAddListFilter(bot, interaction, tracker);

            else if (subcommand === "remove")
                await executeRemoveListFilter(bot, interaction, tracker);

            else if (subcommand === "clear")
                await executeClearListFilters(bot, interaction, tracker);
        }

        // ===== TAGS =====
        else if (subcommandGroup === "tag") {
            if (subcommand === "create")
                await executeCreateTag(bot, interaction, tracker);

            else if (subcommand === "delete")
                await executeDeleteTag(bot, interaction, tracker);

            else if (subcommand === "rename")
                await executeRenameTag(bot, interaction, tracker);

            else if (subcommand === "list")
                await executeListTags(bot, interaction);

            else if (subcommand === "filter-add")
                await executeAddTagFilter(bot, interaction, tracker);

            else if (subcommand === "filter-remove")
                await executeRemoveTagFilter(bot, interaction, tracker);

            else if (subcommand === "filter-list")
                await executeListTagFilters(bot, interaction);

            else if (subcommand === "filter-clear")
                await executeClearTagFilters(bot, interaction, tracker);
        }
    } catch (err) {
        if (err instanceof Error) {
            if (err.name === "NotFoundError") {
                await tracker.finalize(`ERROR: That project or tag does not exist`);
                return;
            }

            await tracker.finalize(`ERROR: ${err.message}`);
            console.error(err.stack);
        } else {
            await tracker.finalize(`ERROR: ${String(err)}`);
            console.error(err);
        }
    }
}

async function executeCreateList(bot: Bot, interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString("name");

    if (!name) return;

    const list = await bot.projectListOrchestrator.createProjectChannelList(name, {
        all: [],
        any: [],
    });

    await interaction.editReply({ content: `Created project list \`${list.name}\`` });
}

async function executeDeleteList(bot: Bot, interaction: ChatInputCommandInteraction) {
    const listId = interaction.options.getString("list");
    if (!listId) return;

    await bot.projectListOrchestrator.deleteProjectList(Number(listId));
    await interaction.editReply({ content: `Deleted project list` });
}

async function executeListLists(bot: Bot, interaction: ChatInputCommandInteraction) {
    const lists = await bot.projectListOrchestrator.projectListRepo.list();

    if (!lists.length) {
        await interaction.editReply({ content: "No project lists found." });
        return;
    }

    let reply = "Project Lists\n--------------------\n";

    for (const l of lists) {
        reply += `- ${l.name} (ID: ${l.id})\n`;
    }

    await interaction.editReply({ content: reply });
}

async function executeViewList(bot: Bot, interaction: ChatInputCommandInteraction) {
    const listId = interaction.options.getString("list");
    if (!listId) return;

    const list = await bot.projectListOrchestrator.projectListRepo.getById(Number(listId));

    if (!list) {
        await interaction.editReply({ content: "List not found" });
        return;
    }

    await interaction.editReply({
        content: `**${list.name}**\nTags: ${list.tags.length}\nEntries: ${list.entries.length}\nFilters:\nALL: ${JSON.stringify(list.filters.all)}\nANY: ${JSON.stringify(list.filters.any)}`
    });
}

function applyRuleToGroup(filters: any, rule: any, group: string) {
    if (group === "all") filters.all.push(rule);
    else filters.any.push(rule);
}

function removeRuleFromGroup(filters: any, rule: any, group: string) {
    const arr = group === "all" ? filters.all : filters.any;

    const index = arr.findIndex((r: any) =>
        r.field === rule.field &&
        r.operator === rule.operator &&
        r.value === rule.value
    );

    if (index !== -1) arr.splice(index, 1);

    return index !== -1;
}

async function executeAddListFilter(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));
    const group = interaction.options.getString("group")!;
    const rule = parseAndValidateRule(interaction);

    const list = await bot.projectListOrchestrator.projectListRepo.getById(listId);
    if (!list) return;

    applyRuleToGroup(list.filters, rule, group);

    await bot.projectListOrchestrator.updateProjectList(listId, {
        filters: list.filters,
    });

    await tracker.finalize(`Added filter to ${group.toUpperCase()}`);
}

async function executeRemoveListFilter(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));
    const group = interaction.options.getString("group")!;
    const rule = parseAndValidateRule(interaction);

    const list = await bot.projectListOrchestrator.projectListRepo.getById(listId);
    if (!list) return;

    const removed = removeRuleFromGroup(list.filters, rule, group);

    if (!removed) {
        await tracker.finalize(`Filter not found`);
        return;
    }

    await bot.projectListOrchestrator.updateProjectList(listId, {
        filters: list.filters,
    });

    await tracker.finalize(`Removed filter`);
}

async function executeClearListFilters(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));

    await bot.projectListOrchestrator.updateProjectList(listId, {
        filters: { all: [], any: [] },
    });

    await tracker.finalize(`Cleared filters`);
}

async function executeCreateTag(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));
    const name = interaction.options.getString("name");

    if (!name) return;

    await bot.projectListOrchestrator.createTag(listId, {
        name,
        filters: { all: [], any: [] },
    });

    await tracker.finalize(`Created tag ${name}`);
}

async function executeDeleteTag(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));
    const tagId = Number(interaction.options.getString("tag"));

    await bot.projectListOrchestrator.deleteTag(listId, tagId);

    await tracker.finalize(`Deleted tag`);
}

async function executeRenameTag(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));
    const tagId = Number(interaction.options.getString("tag"));
    const name = interaction.options.getString("name");

    if (!name) return;

    await bot.projectListOrchestrator.updateTag(listId, tagId, { name });

    await tracker.finalize(`Renamed tag to ${name}`);
}

async function executeListTags(bot: Bot, interaction: ChatInputCommandInteraction) {
    const listId = Number(interaction.options.getString("list"));

    const list = await bot.projectListOrchestrator.projectListRepo.getById(listId);

    if (!list) return;

    let reply = `Tags for ${list.name}\n--------------------\n`;

    for (const tag of list.tags) {
        reply += `- ${tag.name}\n`;
    }

    await interaction.editReply({ content: reply });
}

async function executeAddTagFilter(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));
    const tagId = Number(interaction.options.getString("tag"));
    const group = interaction.options.getString("group")!;
    const rule = parseAndValidateRule(interaction);

    const list = await bot.projectListOrchestrator.projectListRepo.getById(listId);
    if (!list) return;

    const tag = list.tags.find(t => t.id === tagId);
    if (!tag) return;

    applyRuleToGroup(tag.filters, rule, group);

    await bot.projectListOrchestrator.updateTag(listId, tagId, {
        filters: tag.filters,
    });

    await tracker.finalize(`Added tag filter`);
}

async function executeRemoveTagFilter(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));
    const tagId = Number(interaction.options.getString("tag"));
    const group = interaction.options.getString("group")!;
    const rule = parseAndValidateRule(interaction);

    const list = await bot.projectListOrchestrator.projectListRepo.getById(listId);
    if (!list) return;

    const tag = list.tags.find(t => t.id === tagId);
    if (!tag) return;

    const removed = removeRuleFromGroup(tag.filters, rule, group);

    if (!removed) {
        await tracker.finalize(`Filter not found`);
        return;
    }

    await bot.projectListOrchestrator.updateTag(listId, tagId, {
        filters: tag.filters,
    });

    await tracker.finalize(`Removed tag filter`);
}

async function executeListTagFilters(bot: Bot, interaction: ChatInputCommandInteraction) {
    const listId = Number(interaction.options.getString("list"));
    const tagId = Number(interaction.options.getString("tag"));

    const list = await bot.projectListOrchestrator.projectListRepo.getById(listId);
    if (!list) return;

    const tag = list.tags.find(t => t.id === tagId);
    if (!tag) return;

    await interaction.editReply({
        content: `Filters:\nALL: ${JSON.stringify(tag.filters.all)}\nANY: ${JSON.stringify(tag.filters.any)}`
    });
}

async function executeClearTagFilters(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const listId = Number(interaction.options.getString("list"));
    const tagId = Number(interaction.options.getString("tag"));

    await bot.projectListOrchestrator.updateTag(listId, tagId, {
        filters: { all: [], any: [] },
    });

    await tracker.finalize(`Cleared tag filters`);
}

export { autocomplete, data, execute };

