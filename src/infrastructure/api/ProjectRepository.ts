import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";
import { CreateProjectPayload, Project, ProjectLink, ProjectStaff, ProjectStaffRank, ProjectWithRelations } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { Attachment } from "discord.js";
import FormData from 'form-data';

export class ProjectRepository {
    constructor(private api: CrossroadsApiClient) { }

    async getById(id: number): Promise<ProjectWithRelations | null> {
        return this.api.projects.getById(id);
    }

    async getByName(name: string): Promise<ProjectWithRelations | null> {
        return this.api.projects.getByName(name);
    }

    async getByGuild(guildId: string): Promise<ProjectWithRelations | null> {
        return this.api.projects.getByGuild(guildId);
    }

    async existsByName(name: string): Promise<boolean> {
        const response = await this.api.projects.existsByName(name);
        return response.exists;
    }

    async existsByGuild(guildId: string): Promise<boolean> {
        const response = await this.api.projects.existsByGuild(guildId);
        return response.exists;
    }

    async list(): Promise<ProjectWithRelations[]> {
        return this.api.projects.list();
    }

    async save(project: Project): Promise<ProjectWithRelations> {
        return this.api.projects.update(project.id, project)
    }

    async create(payload: CreateProjectPayload): Promise<ProjectWithRelations> {
        return this.api.projects.create(payload);
    }

    async delete(projectId: number): Promise<boolean> {
        return this.api.projects.delete(projectId);
    }

    async downloadAttachments(project: Project): Promise<Buffer[]> {
        try {
            const buffers = await this.api.projects.downloadAllAttachments(project.id);

            return buffers;
        } catch (err: any) {
            console.error("Status:", err.status);
            console.error("Message:", err.message);

            if (err.data) {
                console.error("Laravel response body:");
                console.error(
                    typeof err.data === "string"
                        ? err.data
                        : Buffer.from(err.data).toString()
                );
            }

            throw err;
        }
    }

    async storeAttachments(projectId: number, attachments: Attachment[]) {
        const form = new FormData();

        // Download each file from Discord URL and append as a stream
        const buffers = await Promise.all(
            attachments.map(async (attachment, i) => {
                const res = await fetch(attachment.url);
                if (!res.ok) throw new Error(`Failed to fetch ${attachment.url}: ${res.status}`);
                const arrayBuffer = await res.arrayBuffer();
                return { buffer: Buffer.from(arrayBuffer), attachment, i };
            })
        );

        buffers.forEach(({ buffer, attachment, i }) => {
            const filename = attachment.name || `attachment-${i}.bin`;
            const contentType = attachment.contentType || 'application/octet-stream';
            form.append('files[]', buffer, { filename, contentType });
        });

        // If no files, still send a field so Laravel deletes existing attachments
        if (attachments.length === 0) {
            form.append('files[]', '');
        }

        // Call API library (which just posts FormData)
        await this.api.projects.setAttachments(projectId, form);
    }

    async addLink(projectId: number, payload: { url: string, label: string }): Promise<ProjectLink> {
        return this.api.projects.addLink(projectId, payload);
    }

    async removeLink(projectId: number, linkId: number): Promise<boolean> {
        return this.api.projects.removeLink(projectId, linkId);
    }

    async addOrSetStaff(projectId: number, userId: string, rank: ProjectStaffRank): Promise<ProjectStaff> {
        return this.api.setProjectStaffByDiscordId(projectId, userId, rank);
    }

    async removeStaffByDiscord(projectId: number, discordId: string): Promise<boolean> {
        return this.api.removeProjectStaffByDiscordId(projectId, discordId);
    }
}