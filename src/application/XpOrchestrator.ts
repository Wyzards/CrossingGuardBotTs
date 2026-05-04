import { UserBadgeXp, XpEventDefinition } from "@wyzards/crossroadsclientts/dist/badges/types.js";
import { XpRepository } from "../infrastructure/api/XpRepository.js";

export class XpOrchestrator {
    constructor(
        private repo: XpRepository,
    ) { }

    async triggerXpEvent(userId: number, eventId: number): Promise<UserBadgeXp> {
        return this.repo.triggerXpEvent(userId, eventId);
    }

    async getXpEventDefinitions(): Promise<XpEventDefinition[]> {
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