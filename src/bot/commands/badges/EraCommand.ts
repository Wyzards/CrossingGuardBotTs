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
    .setName("era")
    .setDescription("Manage eras")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    .addSubcommand(sub =>
        sub.setName("create")
            .setDescription("Create an era")
            .addStringOption(o => o.setName("name").setRequired(true))
    )

    .addSubcommand(sub =>
        sub.setName("rename")
            .setDescription("Rename an era")
            .addNumberOption(o => o.setName("era").setRequired(true).setAutocomplete(true))
            .addStringOption(o => o.setName("name").setRequired(true))
    )

    .addSubcommand(sub =>
        sub.setName("activate")
            .setDescription("Activate an era")
            .addNumberOption(o => o.setName("era").setRequired(true).setAutocomplete(true))
    );

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    if (focused.name === "era") {
        return interaction.respond([]);
    }
}

async function execute(bot: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sub = interaction.options.getSubcommand();
    const tracker = new OperationTracker(interaction);

    try {
        if (sub === "create")
            await executeCreateEra(bot, interaction, tracker);

        else if (sub === "rename")
            await executeRenameEra(bot, interaction, tracker);

        else if (sub === "activate")
            await executeActivateEra(bot, interaction, tracker);

    } catch (err) {
        await tracker.finalize(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
}

// ===== STUBS =====
async function executeCreateEra(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const name = interaction.options.getString("name");

    if (!name) return;

    const era = await bot.eraOrchestrator.createEra(name);

    await tracker.finalize(`Created era: ${era.name}`);
}

async function executeRenameEra(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const name = interaction.options.getString("name");
    const eraId = interaction.options.getNumber("era");

    if (!name || !eraId) return;

    const era = await bot.eraOrchestrator.getEra(eraId);

    if (!era) {
        await tracker.finalize("Era not found");
        return;
    }

    const renamed = await bot.eraOrchestrator.renameEra(era, name);

    await tracker.finalize(`Renamed era ${era.name} to ${renamed.name}`);
}

async function executeActivateEra(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const eraId = interaction.options.getInteger("era");
    if (!eraId) return

    const era = await bot.eraOrchestrator.getEra(eraId);

    if (!era) {
        await tracker.finalize("Era not found");
        return;
    }

    await bot.eraOrchestrator.activateEra(era);

    await tracker.finalize(`Activated era: ${era.name}`);
}

export { data, autocomplete, execute };