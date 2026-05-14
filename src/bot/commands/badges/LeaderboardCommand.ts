import {
    ChatInputCommandInteraction,
    InteractionContextType,
    SlashCommandBuilder
} from "discord.js";
import { Bot } from "../../Bot.js";

const data = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("View progression leaderboards")
    .setContexts(
        InteractionContextType.Guild,
        InteractionContextType.BotDM,
    )
    .addStringOption(opt =>
        opt.setName("type")
            .setDescription("Leaderboard type")
            .setRequired(true)
            .addChoices(
                { name: "Hunter XP", value: "hunter" },
                { name: "Scout XP", value: "scout" },
                { name: "Total XP", value: "total" },
                { name: "Achievement Badges", value: "badge" },
            )
    );

async function execute(
    bot: Bot,
    interaction: ChatInputCommandInteraction
) {
    try {
        const viewer = await bot.crossroadsUserOrchestrator.ensureUserForDiscord(interaction.user.id);
        const type = interaction.options.getString("type", true) as any;
        const { entries, viewer_rank, viewer_is_tied, total } = await bot.crossroadsUserOrchestrator.getLeaderboard(viewer, type);

        let title = "";

        switch (type) {
            case "hunter":
                title = "Top Hunter XP Leaderboard";
                break;
            case "scout":
                title = "Top Scout XP Leaderboard";
                break;
            case "total":
                title = "Top Total XP Leaderboard";
                break;
            case "badge":
                title = "Top Achievement Badge Leaderboard";
                break;
        }

        let msg = `**${title}**\n`;

        for (const entry of entries) {
            const user = entry.discord_id
                ? await bot.users.fetch(entry.discord_id)
                : null;

            const name = user?.displayName ?? user ?? `User ${entry.user_id}`;

            msg += `**${entry.rank}.** ${name} — ${entry.value} ${type === "badge" ? entry.value > 1 ? "Achievements" : "Achievement" : "XP"}\n`;
        }

        if (viewer_rank !== null) {
            if (viewer_is_tied)
                msg += `\nYou are tied for rank #${viewer_rank} out of ${total}`;
            else
                msg += `\nYou are ranked #${viewer_rank} out of ${total}`;
        }

        await interaction.reply({
            content: msg,
            allowedMentions: {
                parse: []
            }
        });
    } catch (err) {
        await interaction.reply({ content: `ERROR: ${err instanceof Error ? err.message : String(err)}` });
    }
}

export { data, execute };

