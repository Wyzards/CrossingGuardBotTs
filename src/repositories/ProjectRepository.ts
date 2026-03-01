import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";
import { CreateProjectPayload } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { Attachment } from "discord.js";
import FormData from 'form-data';
import Project from "../database/projects/Project.js";
import { IOperationReporter } from "../util/operations.js";
import ProjectLink from "../database/projects/ProjectLink.js";

export class ProjectRepository {
    constructor(private api: CrossroadsApiClient) { }

    async getById(id: number): Promise<Project | null> {
        const dto = await this.api.projects.getById(id);
        if (!dto) return null;

        return Project.fromApi(dto);
    }

    async getByName(name: string): Promise<Project | null> {
        const dto = await this.api.projects.getByName(name);
        if (!dto) return null;

        return Project.fromApi(dto);
    }

    async getByGuild(guildId: string): Promise<Project | null> {
        const dto = await this.api.projects.getByGuild(guildId);
        if (!dto) return null;

        return Project.fromApi(dto);
    }

    async existsByName(name: string): Promise<boolean> {
        const response = await this.api.projects.existsByName(name);
        return response.exists;
    }

    async existsByGuild(guildId: string): Promise<boolean> {
        const response = await this.api.projects.existsByGuild(guildId);
        return response.exists;
    }

    async list(): Promise<Project[]> {
        const dtos = await this.api.projects.list();
        return dtos.map(Project.fromApi);
    }

    async save(project: Project, updateChannel: boolean = true, reporter?: IOperationReporter): Promise<void> {
        await this.api.projects.update(project.id, project.toUpdatePayload());
        await project.updateView(updateChannel, reporter);
    }

    async create(payload: CreateProjectPayload): Promise<Project> {
        const projectDto = await this.api.projects.create(payload);
        return Project.fromApi(projectDto);
    }

    async delete(project: Project): Promise<boolean> {
        try {
            await this.api.projects.delete(project.id);
            return true;
        } catch (err) {
            console.error(`Failed to delete project with ID ${project.id}:`, err);
            return false
        }
    }

    async downloadAttachments(project: Project): Promise<Buffer[]> {
        try {
            // Now this returns an array of base64 strings
            const buffers = await this.api.projects.downloadAllAttachments(project.id);

            // buffers is already an array of Buffer objects thanks to the updated API library
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

    async storeAttachments(project: Project, attachments: Attachment[]): Promise<void> {
        const form = new FormData();

        // Download each file from Discord URL and append as a stream
        for (let i = 0; i < attachments.length; i++) {
            const attachment = attachments[i];

            const res = await fetch(attachment.url);


            if (!res.ok) {
                throw new Error(`Failed to fetch ${attachment.url}: ${res.status} ${res.statusText}`);
            }

            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Detect file type and MIME
            const filename = attachment.name || `attachment-${i}.bin`;
            const contentType = attachment.contentType || 'application/octet-stream';

            form.append('files[]', buffer, { filename, contentType });
        }

        // If no files, still send a field so Laravel deletes existing attachments
        if (attachments.length === 0) {
            form.append('files[]', '');
        }

        // Call API library (which just posts FormData)
        await this.api.projects.setAttachments(project.id, form);
    }

    async addLink(project: Project, label: string, url: string, reporter?: IOperationReporter) {
        const validatedLink = await this.api.projects.addLink(project.id, { url: url, label: label });

        project.links.push(new ProjectLink(project.id, validatedLink.id, validatedLink.label, validatedLink.url));
        await project.updateView(true, reporter);
    }

    async removeLink(project: Project, link: ProjectLink, reporter?: IOperationReporter) {
        await this.api.projects.removeLink(project.id, link.id);

        project.links.filter(l => l !== link);
        await project.updateView(true, reporter);
    }
}