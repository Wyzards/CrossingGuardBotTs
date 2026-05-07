import { Badge, BadgeProgression, CreateBadgePayload, ProgressionCurveType, UpdateBadgePayload } from "@wyzards/crossroadsclientts/dist/badges/types.js";
import { TextChannel } from "discord.js";
import { BadgeRepository } from "../infrastructure/api/BadgeRepository.js";
import { ProjectDiscordService } from "../infrastructure/discord/ProjectDiscordService.js";
import { XpOrchestrator } from "./XpOrchestrator.js";

export class BadgeOrchestrator {
    constructor(
        private readonly repo: BadgeRepository,
        private discordService: ProjectDiscordService
    ) { }

    // ========================
    // BADGES
    // ========================
    async getBadge(id: number): Promise<Badge | null> {
        return this.repo.getBadge(id);
    }

    async getBadges(): Promise<Badge[]> {
        return this.repo.getBadges();
    }

    async createBadge(data: CreateBadgePayload): Promise<Badge> {
        return this.repo.createBadge(data);
    }

    async updateBadge(id: number, data: UpdateBadgePayload) {
        return this.repo.updateBadge(id, data);
    }

    async assignBadgeAndNotify(userId: number, badgeId: number): Promise<void> {
        await this.repo.assignBadge(userId, badgeId);

        // optional: fetch badge for messaging
        const badges = await this.repo.getBadges();
        const badge = badges.find(b => b.id === badgeId);

        if (!badge) return;

        await this.sendBadgeAnnouncement(userId, badge);
    }

    async removeBadge(userId: number, badgeId: number): Promise<void> {
        await this.repo.removeBadge(userId, badgeId);
    }

    async getBadgeProgressionById(badgeId: number): Promise<BadgeProgression | null> {
        const badge = await this.getBadge(badgeId);

        if (badge)
            return this.getBadgeProgression(badge);

        return null;
    }

    async getBadgeProgression(badge: Badge): Promise<BadgeProgression | null> {
        if (!badge.is_xp_based) return null;

        return this.repo.getBadgeProgression(badge.id)
    }

    async updateBadgeProgressionById(badgeId: number, curveType: ProgressionCurveType, baseXp: number, growthRate: number): Promise<BadgeProgression | null> {
        const badge = await this.getBadge(badgeId);

        if (!badge) return null;

        return this.updateBadgeProgression(badge, curveType, baseXp, growthRate);
    }

    async updateBadgeProgression(badge: Badge, curveType: ProgressionCurveType, baseXp: number, growthRate: number): Promise<BadgeProgression | null> {
        if (!badge.is_xp_based) return null;

        return this.repo.updateBadgeProgression(badge.id, curveType, baseXp, growthRate);
    }

    async ensureAchievementChannel(): Promise<TextChannel> {
        const system = await this.repo.getSystemChannels();
        const channel = system.achievements_channel_id ? await this.discordService.fetchChannel(system.achievements_channel_id) as TextChannel : null;

        if (!channel) {
            const created = await this.discordService.createTextChannel("achievements");

            await this.repo.setSystemChannels({
                achievements_channel_id: created.id
            });

            return created;
        }

        return channel;
    }

    private async sendBadgeAnnouncement(userId: number, badge: Badge) {
        const channel = await this.ensureAchievementChannel();

        if (!channel) return;

        await this.discordService.sendMessage(channel, `User ${userId} earned ${badge.name}`);
    }
}