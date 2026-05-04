import { CrossroadsUser, UserProfile } from "@wyzards/crossroadsclientts/dist/users/types.js";
import { CrossroadsUserRepository } from "../infrastructure/api/CrossroadsUserRepository.js";

export class CrossroadsUserOrchestrator {
    constructor(
        private repo: CrossroadsUserRepository,
    ) { }

    async handleProfileCommand(targetUserId: number): Promise<string> {
        const profile = await this.repo.getProfile(targetUserId);

        if (!profile) {
            throw new Error("User profile not found");
        }

        return this.formatProfile(profile);
    }

    private formatProfile(profile: UserProfile): string {
        let msg = `**User Profile**\n`;

        if (profile.era) {
            msg += `Era: ${profile.era.name}\n`;
        }

        msg += `\n**Badges**\n`;

        for (const [category, badges] of Object.entries(profile.badges)) {
            if (badges.length === 0) continue;

            msg += `\n${category.toUpperCase()}:\n`;
            for (const b of badges) {
                msg += `- ${b.badge.name}\n`;
            }
        }

        if (profile.progression.length > 0) {
            msg += `\n**Progression**\n`;
            for (const p of profile.progression) {
                msg += `- ${p.badge.name}: Lv ${p.level} (${p.total_xp} XP)\n`;
            }
        }

        return msg;
    }

    async findByDiscordId(discordId: string): Promise<CrossroadsUser> {
        return this.repo.findByDiscordId(discordId)
    }
}