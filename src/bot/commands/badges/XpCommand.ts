import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { OperationTracker } from "../../../shared/operations.js";
import { Bot } from "../../Bot.js";

const data = new SlashCommandBuilder()
    .setName("xp")
    .setDescription("Manage XP")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    // ===== GIVE =====
    .addSubcommand(sub =>
        sub.setName("give")
            .setDescription("Trigger XP event")
            .addUserOption(o => o.setName("user").setRequired(true))
            .addStringOption(o => o.setName("event").setRequired(true).setAutocomplete(true))
    )

    // ===== RECALC =====
    .addSubcommandGroup(group =>
        group.setName("recalc")
            .setDescription("Recalculate XP")

            .addSubcommand(sub =>
                sub.setName("user")
                    .setDescription("Recalculate user XP")
                    .addUserOption(o => o.setName("user").setRequired(true))
            )

            .addSubcommand(sub =>
                sub.setName("badge")
                    .setDescription("Recalculate badge XP")
                    .addStringOption(o => o.setName("badge").setRequired(true).setAutocomplete(true))
            )
    )

    // ===== EVENTS =====
    .addSubcommandGroup(group =>
        group.setName("event")
            .setDescription("Manage XP events")

            .addSubcommand(sub =>
                sub.setName("create")
                    .setDescription("Create XP event")
                    .addStringOption(o => o.setName("name").setRequired(true))
                    .addStringOption(o => o.setName("badge").setRequired(true).setAutocomplete(true))
                    .addIntegerOption(o => o.setName("xp").setRequired(true))
                    .addIntegerOption(o => o.setName("cooldown").setRequired(true))
            )

            .addSubcommand(sub =>
                sub.setName("edit")
                    .setDescription("Edit XP event")
                    .addStringOption(o => o.setName("event").setRequired(true).setAutocomplete(true))
                    .addStringOption(o => o.setName("name"))
                    .addIntegerOption(o => o.setName("xp"))
                    .addIntegerOption(o => o.setName("cooldown"))
            )

            .addSubcommand(sub =>
                sub.setName("delete")
                    .setDescription("Delete XP event")
                    .addStringOption(o => o.setName("event").setRequired(true).setAutocomplete(true))
            )

            .addSubcommand(sub =>
                sub.setName("list")
                    .setDescription("List XP events")
                    .addStringOption(o => o.setName("badge").setAutocomplete(true))
            )

            .addSubcommand(sub =>
                sub.setName("view")
                    .setDescription("View XP event")
                    .addStringOption(o => o.setName("event").setRequired(true).setAutocomplete(true))
            )
    );

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    // TODO: this!
    if (focused.name === "event") {
        return interaction.respond([]);
    }

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
            if (sub === "give") await executeGiveXp(bot, interaction, tracker);
        }

        else if (group === "recalc") {
            if (sub === "user") await executeRecalcUser(bot, interaction, tracker);
            else if (sub === "badge") await executeRecalcBadge(bot, interaction, tracker);
        }

        else if (group === "event") {
            if (sub === "create") await executeCreateEvent(bot, interaction, tracker);
            else if (sub === "edit") await executeEditEvent(bot, interaction, tracker);
            else if (sub === "delete") await executeDeleteEvent(bot, interaction, tracker);
            else if (sub === "list") await executeListEvents(bot, interaction, tracker);
            else if (sub === "view") await executeViewEvent(bot, interaction, tracker);
        }

    } catch (err) {
        await tracker.finalize(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
}

// ===== STUBS =====
async function executeGiveXp(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) { }
async function executeRecalcUser(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) { }
async function executeRecalcBadge(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) { }

async function executeCreateEvent(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const name = interaction.options.getString("name");
    const badgeId = interaction.options.getInteger("badge");
    const xp = interaction.options.getInteger("xp");
    const cooldown = interaction.options.getInteger("cooldown");

    if (!name || !badgeId || xp === null || cooldown == null) return;

    const event = await bot.xpOrchestrator.createXpEventDefinition({
        name,
        badge_id: badgeId,
        xp_amount: xp,
        cooldown_seconds: cooldown
    });

    await tracker.finalize(`Created event: ${event.name}`);
}

async function executeEditEvent(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const id = interaction.options.getInteger("event");
    const name = interaction.options.getString("name");
    const xp = interaction.options.getInteger("xp");
    const cooldown = interaction.options.getInteger("cooldown");

    if (!id) return

    if (!name && !xp && !cooldown) {
        await tracker.finalize("You must specify at least one field to edit");
        return;
    }

    const updates: any = {};

    if (name !== null) updates.name = name;
    if (xp !== null) updates.xp_amount = xp;
    if (cooldown !== null) updates.cooldown_seconds = cooldown;

    await bot.xpOrchestrator.updateXpEventDefinition(id, updates);

    await tracker.finalize(`Updated event ${id}`);
}

async function executeDeleteEvent(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const id = interaction.options.getInteger("event");

    if (!id) return;

    await bot.xpOrchestrator.deleteXpEventDefinition(id);

    await tracker.finalize(`Deleted event ${id}`);
}

async function executeListEvents(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const events = await bot.xpOrchestrator.getXpEventDefinitions();

    const msg = events.map(e => `- ${e.id}: ${e.name} (${e.xp_amount} XP)`).join("\n");

    await tracker.finalize(`**Events**\n${msg}`);
}

async function executeViewEvent(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const id = interaction.options.getInteger("event");

    if (!id) return;

    const event = await bot.xpOrchestrator.getXpEventDefinition(id);

    if (!event) {
        await tracker.finalize("Event not found");
        return;
    }

    await tracker.finalize(`${event.name} → ${event.xp_amount} XP`);
}

export { autocomplete, data, execute };
