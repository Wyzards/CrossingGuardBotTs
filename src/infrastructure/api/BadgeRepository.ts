import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";
import {
    Badge,
    CreateBadgePayload,
    SystemChannels,
    UpdateBadgePayload
} from "@wyzards/crossroadsclientts/dist/badges/types.js"; // adjust path if needed

export class BadgeRepository {
    constructor(private api: CrossroadsApiClient) { }

    // ========================
    // Badges
    // ========================

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

    // ========================
    // User Badges
    // ========================

    async assignBadge(userId: number, badgeId: number): Promise<boolean> {
        await this.api.badges.assignBadge(userId, badgeId);
        return true;
    }

    async removeBadge(userId: number, badgeId: number): Promise<boolean> {
        return this.api.badges.removeBadge(userId, badgeId);
    }

    // ========================
    // System Channels
    // ========================

    async getSystemChannels(): Promise<SystemChannels> {
        return this.api.badges.getSystemChannels();
    }

    async setSystemChannels(data: SystemChannels): Promise<SystemChannels> {
        return this.api.badges.setSystemChannels(data);
    }
}