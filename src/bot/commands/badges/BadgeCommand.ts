import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { OperationTracker } from "../../../shared/operations.js";
import { Bot } from "../../Bot.js";
import { BadgeCategory, BadgeRarity } from "@wyzards/crossroadsclientts/dist/badges/types.js";

const data = new SlashCommandBuilder()
    .setName("badge")
    .setDescription("Manage badges")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    // ===== CREATE =====
    .addSubcommand(sub =>
        sub.setName("create")
            .setDescription("Create a badge")
            .addStringOption(o => o.setName("name").setRequired(true))
            .addStringOption(o => o.setName("description"))
            .addStringOption(o => o.setName("category")
                .addChoices(
                    { name: "Progression", value: "progression" },
                    { name: "Community", value: "community" },
                    { name: "Achievement", value: "achievement" },
                    { name: "Artifact", value: "artifact" },
                )
                .setRequired(true))
            .addBooleanOption(o => o.setName("xp_based").setRequired(true))
            .addStringOption(o => o.setName("rarity")
                .addChoices(
                    { name: "Common", value: "common" },
                    { name: "Uncommon", value: "uncommon" },
                    { name: "Rare", value: "rare" },
                    { name: "Legendary", value: "legendary" },
                ))
            .addBooleanOption(o => o.setName("active"))
    )

    // ===== EDIT =====
    .addSubcommand(sub =>
        sub.setName("edit")
            .setDescription("Edit a badge")
            .addStringOption(o => o.setName("badge").setRequired(true).setAutocomplete(true))
            .addStringOption(o => o.setName("name"))
            .addStringOption(o => o.setName("description"))
            .addStringOption(o => o.setName("category")
                .addChoices(
                    { name: "Progression", value: "progression" },
                    { name: "Community", value: "community" },
                    { name: "Achievement", value: "achievement" },
                    { name: "Artifact", value: "artifact" },
                ))
            .addStringOption(o => o.setName("rarity")
                .addChoices(
                    { name: "Common", value: "common" },
                    { name: "Uncommon", value: "uncommon" },
                    { name: "Rare", value: "rare" },
                    { name: "Legendary", value: "legendary" },
                ))
            .addBooleanOption(o => o.setName("active"))
    )

    // ===== ASSIGN =====
    .addSubcommand(sub =>
        sub.setName("assign")
            .setDescription("Assign a badge to a user")
            .addUserOption(o => o.setName("user").setRequired(true))
            .addStringOption(o => o.setName("badge").setRequired(true).setAutocomplete(true))
    )

    .addSubcommand(sub =>
        sub.setName("remove")
            .setDescription("Remove a badge from a user")
            .addUserOption(o => o.setName("user").setRequired(true))
            .addStringOption(o => o.setName("badge").setRequired(true).setAutocomplete(true))
    )

    // ===== PROGRESSION =====
    .addSubcommandGroup(group =>
        group.setName("progression")
            .setDescription("Manage badge progression")

            .addSubcommand(sub =>
                sub.setName("set")
                    .setDescription("Set progression curve")
                    .addStringOption(o => o.setName("badge").setRequired(true).setAutocomplete(true))
                    .addIntegerOption(o => o.setName("base_xp").setRequired(true))
                    .addNumberOption(o => o.setName("growth_factor").setRequired(true))
                    .addStringOption(o => o.setName("curve")
                        .addChoices(
                            { name: "Linear", value: "linear" },
                            { name: "Exponential", value: "exponential" },
                        )
                        .setRequired(true))
            )

            .addSubcommand(sub =>
                sub.setName("view")
                    .setDescription("View progression config")
                    .addStringOption(o => o.setName("badge").setRequired(true).setAutocomplete(true))
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
            .addStringOption(o => o.setName("badge").setRequired(true).setAutocomplete(true))
    );

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    if (focused.name === "badge") {
        return interaction.respond([]);
    }
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
    const isXpBased = interaction.options.getBoolean("is_xp_based");
    const rarity = interaction.options.getString("rarity") as BadgeRarity;

    if (!name || !category || !isXpBased || !rarity) return;

    const badge = await bot.badgeOrchestrator.createBadge({ name, description, category, is_xp_based: isXpBased, rarity, is_active: true });

    await tracker.finalize(`Created badge: ${badge.name}`);
}

async function executeEditBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badgeId = interaction.options.getInteger("badge");
    const name = interaction.options.getString("name");
    const description = interaction.options.getString("description") ?? "";
    const category = interaction.options.getString("category") as BadgeCategory;
    const isXpBased = interaction.options.getBoolean("is_xp_based");
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

    await bot.badgeOrchestrator.updateBadge(badgeId, updates);

    await tracker.finalize(`Updated badge ${badgeId}`);
}

async function executeAssignBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const userId = interaction.options.getInteger("user");
    const badgeId = interaction.options.getInteger("badge");

    if (!userId || !badgeId) return;

    await bot.badgeOrchestrator.assignBadgeAndNotify(userId, badgeId);

    await tracker.finalize(`Assigned badge ${badgeId} to user ${userId}`);
}

async function executeRemoveBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const userId = interaction.options.getInteger("user");
    const badgeId = interaction.options.getInteger("badge");

    if (!userId || !badgeId) return;

    await bot.badgeOrchestrator.removeBadge(userId, badgeId);

    await tracker.finalize(`Removed badge ${badgeId} from user ${userId}`);
}

async function executeListBadges(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badges = await bot.badgeOrchestrator.getBadges();

    const msg = badges.map(b => `- ${b.id}: ${b.name}`).join("\n");

    await tracker.finalize(`**Badges**\n${msg}`);
}

async function executeViewBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badgeId = interaction.options.getInteger("badge");

    if (!badgeId) return;

    const badge = await bot.badgeOrchestrator.getBadge(badgeId);

    if (!badge) {
        await tracker.finalize("Badge not found");
        return;
    }

    await tracker.finalize(`Badge: ${badge.name}`);
}


async function executeSetProgression(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {

}

async function executeViewProgression(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) { }

export { data, autocomplete, execute };