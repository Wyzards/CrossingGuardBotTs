import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";
import {
    Badge,
    BadgeProgression,
    CreateBadgePayload,
    ProgressionCurveType,
    SystemChannels,
    UpdateBadgePayload
} from "@wyzards/crossroadsclientts/dist/badges/types.js"; // adjust path if needed

export class BadgeRepository {
    constructor(private api: CrossroadsApiClient) { }

    async getBadges(): Promise<Badge[]> {
        return this.api.badges.getBadges();
    }

    async getBadge(id: number): Promise<Badge | null> {
        return this.api.badges.getBadge(id);
    }

    async createBadge(data: CreateBadgePayload): Promise<Badge> {
        return this.api.badges.createBadge(data);
    }

    async updateBadge(id: number, data: UpdateBadgePayload): Promise<Badge> {
        return this.api.badges.updateBadge(id, data);
    }

    async assignBadge(userId: number, badgeId: number): Promise<boolean> {
        await this.api.badges.assignBadge(userId, badgeId);
        return true;
    }

    async removeBadge(userId: number, badgeId: number): Promise<boolean> {
        return this.api.badges.removeBadge(userId, badgeId);
    }

    async getBadgeProgression(badgeId: number): Promise<BadgeProgression> {
        return this.api.badges.getBadgeProgression(badgeId);
    }

    async updateBadgeProgression(badgeId: number, curveType: ProgressionCurveType, baseXp: number, growthRate: number): Promise<BadgeProgression> {
        return this.api.badges.updateBadgeProgression(badgeId, { curve_type: curveType, base_xp: baseXp, growth_rate: growthRate });
    }

    // Todo: Move these somewhere else
    async getSystemChannels(): Promise<SystemChannels> {
        return this.api.badges.getSystemChannels();
    }

    async setSystemChannels(data: SystemChannels): Promise<SystemChannels> {
        return this.api.badges.setSystemChannels(data);
    }
}