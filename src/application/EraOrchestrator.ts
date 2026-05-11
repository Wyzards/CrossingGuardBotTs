import { Role } from "discord.js";
import { CrossroadsUserRepository } from "../infrastructure/api/CrossroadsUserRepository.js";
import { EraRepository } from "../infrastructure/api/EraRepository.js";
import { ProjectDiscordService } from "../infrastructure/discord/ProjectDiscordService.js";
import { Era } from "@wyzards/crossroadsclientts/dist/eras/type.js";
import { CrossroadsUser } from "@wyzards/crossroadsclientts/dist/users/types.js";

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

    async listEras(): Promise<Era[]> {
        return this.repo.listEras();
    }

    async getEra(id: number): Promise<Era | null> {
        return this.repo.getEra(id);
    }

    async activateEra(era: Era): Promise<void> {
        const usersToSync = await this.repo.activateEra(era.id);

        for (const user of usersToSync)
            await this.syncUserEra(user)
    }

    async renameEra(era: Era, name: string): Promise<Era> {
        return this.repo.updateEra(era, { name });
    }

    async ensureEraRole(era: Era): Promise<Role> {
        const updatedEra = await this.repo.getEra(era.id);

        if (!updatedEra)
            throw new Error("Role to ensure era for does not exist!");

        const role = updatedEra.role_id ? await this.discordService.fetchRole(updatedEra.role_id) : null;

        if (!role) {
            const newRole = await this.discordService.createRole(updatedEra.name);

            await this.repo.updateEra(updatedEra, { role_id: newRole.id });

            return newRole;
        }

        return role;
    }

    async syncUserEraById(userId: number): Promise<void> {
        const user = await this.userRepo.get(userId);

        await this.syncUserEra(user);
    }

    async syncUserEra(user: CrossroadsUser) {
        if (!user.era)
            return;

        const eraRole = await this.ensureEraRole(user.era);

        if (!user.discordId)
            return

        const allEras = await this.repo.listEras();

        await this.discordService.syncUserEra(user, eraRole, allEras)
    }

}