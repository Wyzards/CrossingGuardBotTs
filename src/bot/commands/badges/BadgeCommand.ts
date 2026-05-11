import { BadgeCategory, BadgeRarity, ProgressionCurveType } from "@wyzards/crossroadsclientts/dist/badges/types.js";
import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { activeOption, badgeCategoryOption, badgeDescriptionOption, badgeNameOption, badgeOption, badgeRarityOption, baseXpOption, curveOption, growthFactorOption, userOption, xpBasedOption } from "../../../infrastructure/discord/helpers/badgeOptions.js";
import { OperationTracker } from "../../../shared/operations.js";
import { Bot } from "../../Bot.js";

const data = new SlashCommandBuilder()
    .setName("badge")
    .setDescription("Manage badges")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    // ===== CREATE =====
    .addSubcommand(sub =>
        sub.setName("create")
            .setDescription("Create a badge")
            .addStringOption(badgeNameOption())
            .addStringOption(badgeCategoryOption())
            .addBooleanOption(xpBasedOption())
            .addStringOption(badgeDescriptionOption(false))
            .addStringOption(badgeRarityOption(false))
            .addBooleanOption(activeOption(false))
    )

    // ===== EDIT =====
    .addSubcommand(sub =>
        sub.setName("edit")
            .setDescription("Edit a badge")
            .addStringOption(badgeOption())
            .addStringOption(badgeNameOption(false))
            .addStringOption(badgeDescriptionOption(false))
            .addStringOption(badgeCategoryOption(false))
            .addStringOption(badgeRarityOption(false))
            .addBooleanOption(activeOption(false))
    )

    // ===== ASSIGN =====
    .addSubcommand(sub =>
        sub.setName("assign")
            .setDescription("Assign a badge to a user")
            .addUserOption(userOption())
            .addStringOption(badgeOption())
    )

    // ===== REMOVE =====
    .addSubcommand(sub =>
        sub.setName("remove")
            .setDescription("Remove a badge from a user")
            .addUserOption(userOption())
            .addStringOption(badgeOption())
    )

    // ===== PROGRESSION =====
    .addSubcommandGroup(group =>
        group.setName("progression")
            .setDescription("Manage badge progression")

            .addSubcommand(sub =>
                sub.setName("set")
                    .setDescription("Set progression curve")
                    .addStringOption(badgeOption())
                    .addIntegerOption(baseXpOption())
                    .addNumberOption(growthFactorOption())
                    .addStringOption(curveOption())
            )

            .addSubcommand(sub =>
                sub.setName("view")
                    .setDescription("View progression config")
                    .addStringOption(badgeOption())
            )
    )

    // ===== DISCOVERY =====
    .addSubcommand(sub =>
        sub.setName("list")
            .setDescription("List badges")
    )

    .addSubcommand(sub =>
        sub.setName("view")
            .setDescription("View badge details")
            .addStringOption(badgeOption())
    );

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === "badge") {
        return autocompleteBadges(bot, interaction, focusedOption.value)
    }
}

// TODO: This is duplicated across commands, extract it
async function autocompleteBadges(bot: Bot, interaction: AutocompleteInteraction, query: string) {
    const badges = await bot.badgeOrchestrator.listBadges();

    const filtered = badges.filter(badge =>
        badge.name.toLowerCase().includes(query.toLowerCase())
    );

    await interaction.respond(
        filtered.slice(0, 24).map(badge => ({
            name: badge.name,
            value: badge.id.toString(),
        }))
    );
}

async function execute(bot: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sub = interaction.options.getSubcommand();
    const group = interaction.options.getSubcommandGroup();
    const tracker = new OperationTracker(interaction);

    try {
        if (!group) {
            if (sub === "create") await executeCreateBadge(bot, interaction, tracker);
            else if (sub === "edit") await executeEditBadge(bot, interaction, tracker);
            else if (sub === "assign") await executeAssignBadge(bot, interaction, tracker);
            else if (sub === "remove") await executeRemoveBadge(bot, interaction, tracker);
            else if (sub === "list") await executeListBadges(bot, interaction, tracker);
            else if (sub === "view") await executeViewBadge(bot, interaction, tracker);
        }

        else if (group === "progression") {
            if (sub === "set") await executeSetProgression(bot, interaction, tracker);
            else if (sub === "view") await executeViewProgression(bot, interaction, tracker);
        }

    } catch (err) {
        await tracker.finalize(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
}

// ===== STUBS =====
async function executeCreateBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description") ?? "";
    const category = interaction.options.getString("category") as BadgeCategory;
    const isXpBased = interaction.options.getBoolean("xp_based");
    const rarity = interaction.options.getString("rarity") as BadgeRarity;

    if (!name || !category || isXpBased == null || !rarity) {
        await tracker.finalize(`One of the required options was not provided`);
        return;
    }

    const badge = await bot.badgeOrchestrator.createBadge({ name, description, category, is_xp_based: isXpBased, rarity, is_active: true });

    await tracker.finalize(`Created badge: ${badge.name}`);
}

async function executeEditBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badgeId = interaction.options.getString("badge");
    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description");
    const category = interaction.options.getString("category") as BadgeCategory;
    const isXpBased = interaction.options.getBoolean("xp_based");
    const rarity = interaction.options.getString("rarity") as BadgeRarity;

    if (!badgeId) return;

    if (!name && !description && !category && (isXpBased === null) && !rarity) {
        await tracker.finalize(`You must specify something to edit`);
        return;
    }

    const updates: any = {};

    if (name !== null) updates.name = name;
    if (description !== null) updates.description = description;
    if (category !== null) updates.category = category;
    if (isXpBased !== null && isXpBased !== undefined) updates.is_xp_based = isXpBased;
    if (rarity !== null) updates.rarity = rarity;

    const badge = await bot.badgeOrchestrator.updateBadge(Number(badgeId), updates);

    await tracker.finalize(`Updated badge ${badge.name}`);
}

async function executeAssignBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const discordUser = interaction.options.getUser("user");
    const badgeId = interaction.options.getString("badge");

    if (!discordUser || !badgeId) return;

    const crossroadsUser = await bot.crossroadsUserOrchestrator.ensureUserForDiscord(discordUser.id);

    const badge = await bot.badgeOrchestrator.assignBadgeAndNotify(crossroadsUser, Number(badgeId));

    await tracker.finalize(`Assigned badge ${badge?.name ?? badgeId} to user <@${discordUser.id}>`);
}

async function executeRemoveBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const discordUser = interaction.options.getUser("user");
    const badgeId = interaction.options.getString("badge");

    if (!discordUser || !badgeId) return;

    const badge = await bot.badgeOrchestrator.getBadge(Number(badgeId));

    if (!badge) {
        await tracker.finalize(`The specified badge does not exist`);
        return;
    }

    const crossroadsUser = await bot.crossroadsUserOrchestrator.ensureUserForDiscord(discordUser.id);

    await bot.badgeOrchestrator.removeBadge(crossroadsUser.id, badge.id);
    await tracker.finalize(`Removed badge ${badge.name} from user <@${discordUser.id}>`);
}

async function executeListBadges(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badges = await bot.badgeOrchestrator.listBadges();

    const msg = badges.map(b => `- ${b.id}: ${b.name}`).join("\n");

    await tracker.finalize(`**Badges**\n${msg}`);
}

async function executeViewBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badgeId = interaction.options.getString("badge");

    if (!badgeId) return;

    const badge = await bot.badgeOrchestrator.getBadge(Number(badgeId));

    if (!badge) {
        await tracker.finalize("Badge not found");
        return;
    }

    await tracker.finalize(`Badge: ${badge.name}`);
}


async function executeSetProgression(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badgeId = interaction.options.getString("badge");
    const baseXp = interaction.options.getInteger("base_xp");
    const growthFactor = interaction.options.getNumber("growth_factor");
    const curveType = interaction.options.getString("curve") as ProgressionCurveType;

    if (!badgeId || !baseXp || !growthFactor || !curveType) {
        await tracker.finalize(`One or more of the required arguments between the badge, level curve type, base xp and growth rate was not specified.`)
        return;
    }

    await bot.badgeOrchestrator.updateBadgeProgressionById(Number(badgeId), curveType, baseXp, growthFactor);

    await tracker.finalize(`The progression curve for the specified badge has been updated`);
}

async function executeViewProgression(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badgeId = interaction.options.getString("badge");

    if (!badgeId) {
        await tracker.finalize(`You must specify a badge`);
        return;
    }

    const badge = await bot.badgeOrchestrator.getBadge(Number(badgeId));

    if (!badge) {
        await tracker.finalize(`The specified badge does not exist`);
        return;
    }

    const progression = await bot.badgeOrchestrator.getBadgeProgression(badge);

    if (!progression) {
        await tracker.finalize(`The specified badge does not have an XP Progression`);
        return;
    }

    await tracker.finalize(`${badge.name} Progression:\Curve Type: ${progression.curve_type}\nBase XP: ${progression.base_xp}\nGrowth Rate: ${progression.growth_factor}`);
}

export { autocomplete, data, execute };

