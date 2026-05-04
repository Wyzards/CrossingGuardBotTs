import { Role } from "discord.js";
import { CrossroadsUserRepository } from "../infrastructure/api/CrossroadsUserRepository.js";
import { EraRepository } from "../infrastructure/api/EraRepository.js";
import { ProjectDiscordService } from "../infrastructure/discord/ProjectDiscordService.js";
import { Era } from "@wyzards/crossroadsclientts/dist/eras/type.js";

export class EraOrchestrator {
    constructor(
        private repo: EraRepository,
        private userRepo: CrossroadsUserRepository,
        private discordService: ProjectDiscordService
    ) { }

    async createEra(name: string): Promise<Era> {
        const role = await this.discordService.createRole(name);

        return this.repo.createEra(name, role.id);
    }

    async getEra(id: number): Promise<Era | null> {
        return this.repo.getEra(id);
    }

    async activateEra(era: Era): Promise<Era> {
        return this.repo.activateEra(era.id);
    }

    async renameEra(era: Era, name: string): Promise<Era> {
        return this.repo.updateEra(era, { name });
    }

    async ensureEraRole(era: Era): Promise<Role> {
        const role = era.role_id ? await this.discordService.fetchRole(era.role_id) : null;

        if (!role) {
            const newRole = await this.discordService.createRole(era.name);

            await this.repo.updateEra(era, { role_id: newRole.id });

            return newRole;
        }

        return role;
    }

    async syncUserEra(userId: number): Promise<void> {
        const user = await this.userRepo.get(userId);
        const era = user.era;

        if (!era)
            return;

        const eraRole = await this.ensureEraRole(era);

        if (!user.discordId)
            return

        const allEras = await this.repo.getEras();

        this.discordService.syncUserEra(user, eraRole, allEras)
    }

}