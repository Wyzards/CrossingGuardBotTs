import { AutocompleteInteraction, ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { badgeOption, userOption } from "../../../infrastructure/discord/helpers/badgeOptions.js";
import { cooldownOption, xpAmountOption, xpEventNameOption, xpEventOption } from "../../../infrastructure/discord/helpers/xpEventOptions.js";
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
            .addUserOption(userOption())
            .addStringOption(xpEventOption())
    )

    // ===== EVENTS =====
    .addSubcommandGroup(group =>
        group.setName("event")
            .setDescription("Manage XP events")

            .addSubcommand(sub =>
                sub.setName("create")
                    .setDescription("Create XP event")
                    .addStringOption(xpEventNameOption())
                    .addStringOption(badgeOption())
                    .addIntegerOption(xpAmountOption())
                    .addIntegerOption(cooldownOption())
            )

            .addSubcommand(sub =>
                sub.setName("edit")
                    .setDescription("Edit XP event")
                    .addStringOption(xpEventOption())
                    .addStringOption(xpEventNameOption(false))
                    .addIntegerOption(xpAmountOption(false))
                    .addIntegerOption(cooldownOption(false))
            )

            .addSubcommand(sub =>
                sub.setName("delete")
                    .setDescription("Delete XP event")
                    .addStringOption(xpEventOption())
            )

            .addSubcommand(sub =>
                sub.setName("list")
                    .setDescription("List XP events")
                    .addStringOption(badgeOption(false))
            )

            .addSubcommand(sub =>
                sub.setName("view")
                    .setDescription("View XP event")
                    .addStringOption(xpEventOption())
            )
    );

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === "badge") {
        return autocompleteBadges(bot, interaction, focusedOption.value)
    }

    if (focusedOption.name === "event") {
        return autocompleteXpEvents(bot, interaction, focusedOption.value);
    }
}

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

async function autocompleteXpEvents(bot: Bot, interaction: AutocompleteInteraction, query: string) {
    const xpEvents = await bot.xpOrchestrator.listXpEventDefinitions();

    const filtered = xpEvents.filter(event =>
        event.name.toLowerCase().includes(query.toLowerCase())
    );

    await interaction.respond(
        filtered.slice(0, 24).map(event => ({
            name: event.name,
            value: event.id.toString(),
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
            if (sub === "give") await executeGiveXp(bot, interaction, tracker);
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
async function executeGiveXp(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const discordUser = interaction.options.getUser("user");
    const eventId = interaction.options.getString("event");

    if (!discordUser || !eventId) {
        await tracker.finalize(`The specified user or XP event was not valid`);
        return;
    }

    const crossroadsUser = await bot.crossroadsUserOrchestrator.ensureUserForDiscord(discordUser.id);
    const event = await bot.xpOrchestrator.getXpEventDefinition(Number(eventId));

    if (!event) {
        await tracker.finalize(`The specified XP event does not exist`);
        return;
    }

    await bot.xpOrchestrator.triggerXpEvent(crossroadsUser, event);
    await tracker.finalize(`+${event.xp_amount} XP for <@${discordUser.id}> for ${event.name}`);
}

async function executeCreateEvent(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const name = interaction.options.getString("name");
    const badgeId = interaction.options.getString("badge");
    const xp = interaction.options.getInteger("xp");
    const cooldown = interaction.options.getInteger("cooldown");

    if (!name || !badgeId || xp === null || cooldown == null) return;

    const event = await bot.xpOrchestrator.createXpEventDefinition({
        name,
        badge_id: Number(badgeId),
        xp_amount: xp,
        cooldown_seconds: cooldown
    });

    await tracker.finalize(`Created event: ${event.name}`);
}

async function executeEditEvent(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const eventId = interaction.options.getString("event");
    const name = interaction.options.getString("name");
    const xp = interaction.options.getInteger("xp");
    const cooldown = interaction.options.getInteger("cooldown");

    if (!eventId) return

    if (!name && !xp && !cooldown) {
        await tracker.finalize("You must specify at least one field to edit");
        return;
    }

    const updates: any = {};

    if (name !== null) updates.name = name;
    if (xp !== null) updates.xp_amount = xp;
    if (cooldown !== null) updates.cooldown_seconds = cooldown;

    const event = await bot.xpOrchestrator.updateXpEventDefinition(Number(eventId), updates);

    await tracker.finalize(`Updated event ${event.name}`);
}

async function executeDeleteEvent(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const eventId = interaction.options.getString("event");

    if (!eventId) return;

    const event = await bot.xpOrchestrator.getXpEventDefinition(Number(eventId));

    if (!event) {
        await tracker.finalize(`The specified event does not exist`);
        return;
    }

    await bot.xpOrchestrator.deleteXpEventDefinition(event.id);

    await tracker.finalize(`Deleted event ${event.name}`);
}

async function executeListEvents(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const badgeId = interaction.options.getString("badge");
    var events = await bot.xpOrchestrator.listXpEventDefinitions();

    if (badgeId) {
        events = events.filter(event =>
            event.badge.id === Number(badgeId)
        );
    }

    const msg = events.map(e => `- ${e.badge.name} Badge: ${e.name} (${e.xp_amount} XP)`).join("\n");

    await tracker.finalize(`**Events**\n${msg}`);
}

async function executeViewEvent(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const eventId = interaction.options.getString("event");

    if (!eventId) return;

    const event = await bot.xpOrchestrator.getXpEventDefinition(Number(eventId));

    if (!event) {
        await tracker.finalize("Event not found");
        return;
    }

    await tracker.finalize(`${event.name} | ${event.badge.name} Badge → ${event.xp_amount} XP, ${event.cooldown_seconds} cooldown`);
}

export { autocomplete, data, execute };

