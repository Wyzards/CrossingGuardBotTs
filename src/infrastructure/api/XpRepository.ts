import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";
import { UserBadgeXp, XpEventDefinition } from "@wyzards/crossroadsclientts/dist/badges/types.js";

export class XpRepository {
    constructor(private api: CrossroadsApiClient) { }

    async triggerXpEvent(userId: number, eventId: number): Promise<UserBadgeXp> {
        return this.api.xp.triggerXpEvent(userId, eventId);
    }

    async getXpEventDefinitions(): Promise<XpEventDefinition[]> {
        return this.api.xp.getXpEventDefinitions();
    }

    async getXpEventDefinition(id: number): Promise<XpEventDefinition | null> {
        return this.api.xp.getXpEventDefinition(id);
    }

    async createXpEventDefinition(data: {
        name: string
        badge_id: number
        xp_amount: number
        cooldown_seconds: number
    }): Promise<XpEventDefinition> {
        return this.api.xp.createXpEventDefinition(data);
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
        return this.api.xp.updateXpEventDefinition(id, data);
    }

    async deleteXpEventDefinition(id: number): Promise<boolean> {
        await this.api.xp.deleteXpEventDefinition(id);
        return true;
    }

}