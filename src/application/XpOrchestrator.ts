import { UserBadgeXp } from "@wyzards/crossroadsclientts/dist/badges/types.js";
import { CrossroadsUser } from "@wyzards/crossroadsclientts/dist/users/types.js";
import { XpEventDefinition } from "@wyzards/crossroadsclientts/dist/xp/types.js";
import { CrossroadsUserRepository } from "../infrastructure/api/CrossroadsUserRepository.js";
import { XpRepository } from "../infrastructure/api/XpRepository.js";
import { ProjectDiscordService } from "../infrastructure/discord/ProjectDiscordService.js";
import { BadgeOrchestrator } from "./BadgeOrchestrator.js";

export class XpOrchestrator {
    constructor(
        private repo: XpRepository,
        private userRepo: CrossroadsUserRepository,
        private discordService: ProjectDiscordService,
        private badgeOrchestrator: BadgeOrchestrator // TODO: ISOLATE SYSTEM MESSAGES FROM BADGE REPO
    ) { }

    async triggerXpEvent(user: CrossroadsUser, event: XpEventDefinition): Promise<UserBadgeXp> {
        const beforeProfile = await this.userRepo.getProfile(user.id);
        const beforeXp = beforeProfile?.progression.find(
            progression => progression.badge.id === event.badge.id
        );
        const beforeLevel = beforeXp?.level ?? 0;

        const updatedXp = await this.repo.triggerXpEvent(user.id, event.id);
        const afterLevel = updatedXp.level;

        if (user.discordId) {
            await this.discordService.sendXpGainDm(
                user.discordId,
                event.name,
                event.xp_amount,
                updatedXp
            );

            if (afterLevel > beforeLevel) {
                await this.sendLevelUpAnnouncement(
                    user.discordId,
                    updatedXp.badge.name,
                    afterLevel
                );
            }
        }

        return updatedXp;
    }

    public async sendLevelUpAnnouncement(
        discordId: string,
        badgeName: string,
        level: number
    ): Promise<void> {
        const channel = await this.badgeOrchestrator.ensureAchievementChannel();

        if (channel)
            await this.discordService.sendMessage(channel, `🎉 <@${discordId}> reached **Level ${level}** in **${badgeName}**!`);
    }

    async listXpEventDefinitions(): Promise<XpEventDefinition[]> {
        return this.repo.getXpEventDefinitions();
    }

    async getXpEventDefinition(id: number): Promise<XpEventDefinition | null> {
        return this.repo.getXpEventDefinition(id);
    }

    async createXpEventDefinition(data: {
        name: string
        badge_id: number
        xp_amount: number
        cooldown_seconds: number
    }): Promise<XpEventDefinition> {
        return this.repo.createXpEventDefinition(data);
    }

    async updateXpEventDefinition(
        id: number,
        data: Partial<{
            name: string
            badge_id: number
            xp_amount: number
            cooldown_seconds: number
        }>
    ): Promise<XpEventDefinition> {
        return this.repo.updateXpEventDefinition(id, data);
    }

    async deleteXpEventDefinition(id: number): Promise<void> {
        await this.repo.deleteXpEventDefinition(id);
    }
}