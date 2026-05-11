import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder
} from "discord.js";
import { OperationTracker, track } from "../../../shared/operations.js";
import { Bot } from "../../Bot.js";

const data = new SlashCommandBuilder()
    .setName("era")
    .setDescription("Manage eras")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

    .addSubcommand(sub =>
        sub.setName("create")
            .setDescription("Create an era")
            .addStringOption(o =>
                o.setName("name")
                    .setDescription("The name of the era to create")
                    .setRequired(true)
            )
    )

    .addSubcommand(sub =>
        sub.setName("rename")
            .setDescription("Rename an era")
            .addStringOption(o =>
                o.setName("era")
                    .setDescription("The era to rename")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addStringOption(o =>
                o.setName("name")
                    .setDescription("The new name for the era")
                    .setRequired(true)
            )
    )

    .addSubcommand(sub =>
        sub.setName("activate")
            .setDescription("Activate an era")
            .addStringOption(o =>
                o.setName("era")
                    .setDescription("The era to activate")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
    );

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    const focusedOption = interaction.options.getFocused(true);

    if (focusedOption.name === "era") {
        return autocompleteEra(bot, interaction, focusedOption.value)
    }
}

async function autocompleteEra(bot: Bot, interaction: AutocompleteInteraction, query: string) {
    const eras = await bot.eraOrchestrator.listEras();

    const filtered = eras.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase())
    );

    await interaction.respond(
        filtered.slice(0, 24).map(e => ({
            name: e.name,
            value: e.id.toString(),
        }))
    );
}

async function execute(bot: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const sub = interaction.options.getSubcommand();
    const tracker = new OperationTracker(interaction);

    await tracker.finalize(`Silas decided not to implement this feature lol`);
    // try {
    //     if (sub === "create")
    //         await executeCreateEra(bot, interaction, tracker);

    //     else if (sub === "rename")
    //         await executeRenameEra(bot, interaction, tracker);

    //     else if (sub === "activate")
    //         await executeActivateEra(bot, interaction, tracker);

    // } catch (err) {
    //     await tracker.finalize(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    // }
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
    const eraId = interaction.options.getString("era");

    if (!name || !eraId) return;

    const era = await bot.eraOrchestrator.getEra(Number(eraId));

    if (!era) {
        await tracker.finalize("Era not found");
        return;
    }

    const renamed = await bot.eraOrchestrator.renameEra(era, name);

    await tracker.finalize(`Renamed era ${era.name} to ${renamed.name}`);
}

async function executeActivateEra(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    const eraId = interaction.options.getString("era");
    if (!eraId) return

    const era = await bot.eraOrchestrator.getEra(Number(eraId));

    if (!era) {
        await tracker.finalize("Era not found");
        return;
    }

    await track(tracker, `Ensuring all discord users are in The Crossroads database... This may take a bit!`, bot.crossroadsUserOrchestrator.ensureUserForAllDiscord());
    await track(tracker, 'Syncing user era roles... You can dismiss this message and it will still eventually complete.', bot.eraOrchestrator.activateEra(era));

    await tracker.finalize(`Activated era: ${era.name}`);
}

export { autocomplete, data, execute };