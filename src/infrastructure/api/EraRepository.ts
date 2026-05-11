import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";
import { Era } from "@wyzards/crossroadsclientts/dist/eras/type.js";
import { CrossroadsUser } from "@wyzards/crossroadsclientts/dist/users/types.js";

export class EraRepository {
    constructor(private api: CrossroadsApiClient) { }

    async listEras(): Promise<Era[]> {
        return this.api.eras.getEras();
    }

    async getEra(id: number): Promise<Era | null> {
        return this.api.eras.getEra(id);
    }

    async createEra(name: string, roleId: string): Promise<Era> {
        return this.api.eras.createEra({ name, role_id: roleId });
    }

    async updateEra(era: Era, data: Partial<{ name: string, role_id: string }>): Promise<Era> {
        return this.api.eras.updateEra(era.id, data);
    }

    async activateEra(id: number): Promise<CrossroadsUser[]> {
        return this.api.eras.activateEra(id);
    }

}