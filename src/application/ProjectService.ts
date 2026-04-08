import { ProjectLink, ProjectStaffRank } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import Project from "../domain/project/Project.js";
import { ProjectRepository } from "../infrastructure/api/ProjectRepository.js";
import { IOperationReporter } from "../shared/operations.js";

export class ProjectService {
    constructor(
    ) { }

    addLink(project: Project, link: ProjectLink): void {
        project.links.push(link);
    }

    async removeLink(project: Project, link: ProjectLink, reporter?: IOperationReporter) {
        await this.repo.removeLink(project.id, link.id);

        const links = project.links.filter(l => l.label !== link.label);
        project.links = links;
        await project.sync(true, reporter);
    }

    async save(project: Project, updateChannel: boolean = true, reporter?: IOperationReporter): Promise<void> {
        await this.repo.save(project);
        await project.sync(updateChannel, reporter);
    }

    async addOrSetStaff(project: Project, userId: string, rank: ProjectStaffRank, reporter?: IOperationReporter) {
        const newStaff = await this.repo.addOrSetStaff(project.id, userId, rank);

        const existingIndex = project.staff.findIndex(s => s.user?.id === newStaff.user.id);

        if (existingIndex >= 0) {
            project.staff[existingIndex] = new ProjectStaff(project.id, newStaff.user, newStaff.rank);
        } else {
            project.staff.push(new ProjectStaff(project.id, newStaff.user, newStaff.rank));
        }

        await project.sync(true, reporter);
    }

    async removeStaff(project: Project, userId: string, reporter?: IOperationReporter) {
        const existing = project.staff.find(s => s.user?.discordId === userId);
        if (existing) {
            await this.repo.removeStaff(project.id, userId);
            const staff = project.staff.filter(s => s.user.discordId !== userId);
            project.staff = staff;
            await project.sync(true, reporter);
        }
    }
}