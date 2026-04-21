import { Accessibility, ArchitectApproval, CommunityVetted, Project, ProjectStage, ProjectType } from "@wyzards/crossroadsclientts/dist/projects/types.js";

export function shouldHaveRole(project: Project): boolean {
    return isInMainList(project);
}

export function shouldHaveChannel(project: Project): boolean {
    return (project.type != ProjectType.MAP && isInMainList(project));
}

export function isInMainList(project: Project): boolean {
    return project.architect_approval == ArchitectApproval.APPROVED
        && (([CommunityVetted.ACCEPTED, CommunityVetted.SKIPPED].includes(project.community_vetted) && project.accessibility != Accessibility.CLOSED) || project.project_stage == ProjectStage.IN_DEVELOPMENT);
}