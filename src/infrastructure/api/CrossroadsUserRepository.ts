import { CrossroadsApiClient } from "@wyzards/crossroadsclientts"
import { CreateCrossroadsUserPayload, CrossroadsUser, UserProfile } from "@wyzards/crossroadsclientts/dist/users/types.js"

export class CrossroadsUserRepository {
    constructor(private api: CrossroadsApiClient) { }

    // ========================
    // Create
    // ========================

    async create(payload: CreateCrossroadsUserPayload): Promise<CrossroadsUser> {
        return this.api.users.create(payload)
    }

    // ========================
    // List
    // ========================

    async list(): Promise<CrossroadsUser[]> {
        return this.api.users.list()
    }

    // ========================
    // Get by ID
    // ========================

    async get(id: number): Promise<CrossroadsUser> {
        return this.api.users.get(id)
    }

    // ========================
    // Delete
    // ========================

    async delete(id: number): Promise<void> {
        await this.api.users.delete(id)
    }

    // ========================
    // Find by Minecraft UUID
    // ========================

    async findByMinecraftUuid(uuid: string): Promise<CrossroadsUser | null> {
        return this.api.users.findByMinecraftUuid(uuid)
    }

    // ========================
    // Find by Discord ID
    // ========================

    async findByDiscordId(discordId: string): Promise<CrossroadsUser | null> {
        return this.api.users.findByDiscordId(discordId)
    }

    async getProfile(userId: number): Promise<UserProfile | null> {
        return this.api.users.getProfile(userId);
    }
}