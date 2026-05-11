import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    InteractionContextType,
    MessageFlags,
    SlashCommandBuilder
} from "discord.js";
import { OperationTracker } from "../../../shared/operations.js";
import { Bot } from "../../Bot.js";

const data = new SlashCommandBuilder()
    .setName("profile")
    .setDescription("View a user's profile")
    .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
    )

    .addUserOption(o =>
        o.setName("user")
            .setDescription("User to view")
            .setRequired(false)
    );

async function autocomplete(bot: Bot, interaction: AutocompleteInteraction) {
    return interaction.respond([]);
}

async function execute(bot: Bot, interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const tracker = new OperationTracker(interaction);

    try {
        await executeProfile(bot, interaction, tracker);
    } catch (err) {
        await tracker.finalize(`ERROR: ${err instanceof Error ? err.message : String(err)}`);
    }
}

// ===== STUB =====
async function executeProfile(bot: Bot, interaction: ChatInputCommandInteraction, tracker: OperationTracker) {
    var targetDiscordUser = interaction.options.getUser("user");

    if (!targetDiscordUser)
        targetDiscordUser = interaction.user;

    const userIsTarget = targetDiscordUser.id === interaction.user.id
    const user = await bot.crossroadsUserOrchestrator.ensureUserForDiscord(targetDiscordUser.id);
    const msg = await bot.crossroadsUserOrchestrator.handleProfileCommand(user.id, userIsTarget);

    await tracker.finalize(msg);
}

export { autocomplete, data, execute };