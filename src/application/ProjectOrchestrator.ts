import Project from "../domain/project/Project.js";
import { ProjectRepository } from "../infrastructure/api/ProjectRepository.js";
import { ProjectDiscordService } from "../infrastructure/discord/ProjectDiscordService.js";
import { IOperationReporter } from "../shared/operations.js";
import { ProjectService } from "./ProjectService.js";

export class ProjectOrchestrator {
    constructor(
        private repo: ProjectRepository,
        private modelService: ProjectService,
        private discordService: ProjectDiscordService
    ) { }

    async addLink(project: Project, label: string, url: string, reporter?: IOperationReporter) {
        const link = await this.repo.addLink(project.id, { url: url, label: label });
        project.links.push(link);
        await this.discordService.sync(project, true, reporter);
    }
}