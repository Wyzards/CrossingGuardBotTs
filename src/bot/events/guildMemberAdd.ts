import { GuildMember } from "discord.js";
import { Bot } from "../Bot.js";

const name = "guildMemberAdd";

const execute = async function (bot: Bot, member: GuildMember) {
    try {
        const user = await bot.crossroadsUserOrchestrator.ensureUserForDiscord(member.user.id);

        // await bot.eraOrchestrator.syncUserEra(user);
    } catch (err) {
        console.error("Failed to sync user on join:", err);
    }
};

export {
    name,
    execute
};