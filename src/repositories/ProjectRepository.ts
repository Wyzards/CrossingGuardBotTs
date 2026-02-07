import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";
import { CreateProjectPayload } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import Project from "../database/projects/Project.js";

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

    async save(project: Project): Promise<void> {
        await this.api.projects.update(project.id, project.toUpdatePayload());
        await project.updateView();
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
}