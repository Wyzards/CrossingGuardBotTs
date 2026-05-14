import { CrossroadsUser, LeaderboardEntry, LeaderboardResponse, LeaderboardType, UserProfile } from "@wyzards/crossroadsclientts/dist/users/types.js";
import { CrossroadsUserRepository } from "../infrastructure/api/CrossroadsUserRepository.js";
import { ProjectDiscordService } from "../infrastructure/discord/ProjectDiscordService.js";

export class CrossroadsUserOrchestrator {
    constructor(
        private repo: CrossroadsUserRepository,
        private discordService: ProjectDiscordService
    ) { }

    async getLeaderboard(viewer: CrossroadsUser, type: LeaderboardType): Promise<LeaderboardResponse> {
        return this.repo.getLeaderboard(viewer.id, type);
    }

    async handleProfileCommand(targetUserId: number, userIsTarget: boolean): Promise<string> {
        const profile = await this.repo.getProfile(targetUserId);

        if (!profile) {
            throw new Error("User profile not found");
        }

        return this.formatProfile(profile, userIsTarget);
    }

    private formatProfile(profile: UserProfile, userIsTarget: boolean): string {
        let msg = profile.user.discordId ? `**<@${profile.user.discordId}>'s Profile**\n` : `**User Profile**\n`;

        if (profile.era) {
            msg += `*${profile.era.name} Era*\n`;
        }

        const progressionMap = new Map(
            profile.progression.map(p => [p.badge.id, p])
        );

        msg += `\n**Badges**`;

        const categoryOrder = [
            "artifact",
            "progression",
            "community",
            "achievement",
        ] as const;

        for (const category of categoryOrder) {
            let userBadges = profile.badges[category];

            if (category === "progression") {
                userBadges = profile.progression_badges.map(badge => ({
                    id: 0,
                    earned_at: "",
                    badge,
                }));
            }

            if (!userBadges || userBadges.length === 0)
                continue;

            msg += `\n__${category.toUpperCase()}__\n`;

            for (const userBadge of userBadges) {
                const xp = progressionMap.get(userBadge.badge.id);
                const badge = userBadge.badge;

                if (badge.is_xp_based) {
                    msg += `- ${badge.name} - Lvl. ${xp ? xp.level : 0} (*${xp ? xp.total_xp : 0} XP*)\n`;
                } else {
                    msg += `- ${badge.name}${badge.rarity ? ` (${this.capitalize(badge.rarity)})` : ""}\n`;
                }

                // description line for ALL owned badges
                if (category != "progression" && badge.description) {
                    const earnedAt = new Date(userBadge.earned_at)
                        .toLocaleDateString("en-US");


                    msg += `-# ${badge.description}\n-# *Earned on ${earnedAt}*\n`;
                }
            }
        }

        if (userIsTarget && profile.locked_achievements?.length) {
            msg += `\n\n**Locked Achievements**\n`;

            for (const badge of profile.locked_achievements) {
                msg += `- ???${badge.rarity ? ` (${this.capitalize(badge.rarity)})` : ""}\n`;
                msg += `-# ${badge.description}\n`;
            }
        }

        return msg;
    }

    capitalize(word: string): string {
        if (!word) return word;

        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }

    async ensureUserForDiscord(discordId: string): Promise<CrossroadsUser> {
        const user = await this.repo.findByDiscordId(discordId);

        if (!user) {
            return this.repo.create({ discordId });
        }

        return user;
    }

    async ensureUserForAllDiscord(): Promise<void> {
        const members = await this.discordService.getAllMemberIds();

        await Promise.all(
            members.map(member =>
                this.ensureUserForDiscord(member)
            )
        );
    }
}