import { Accessibility, ArchitectApproval, CommunityVetted, Project, ProjectType } from "@wyzards/crossroadsclientts/dist/projects/types.js";

export function shouldHaveRole(project: Project): boolean {
    return project.architect_approval == ArchitectApproval.APPROVED && [CommunityVetted.ACCEPTED, CommunityVetted.SKIPPED].includes(project.community_vetted) && project.accessibility != Accessibility.CLOSED
}

export function shouldHaveChannel(project: Project): boolean {
    return project.type != ProjectType.MAP && project.architect_approval == ArchitectApproval.APPROVED && ![CommunityVetted.ACCEPTED, CommunityVetted.SKIPPED].includes(project.community_vetted) && project.accessibility != Accessibility.CLOSED
}

export function isInMainList(project: Project): boolean {
    return project.architect_approval == ArchitectApproval.APPROVED && [CommunityVetted.ACCEPTED, CommunityVetted.SKIPPED].includes(project.community_vetted) && project.accessibility != Accessibility.CLOSED;
}

export function shouldHaveDiscoveryThread(project: Project): boolean {
    return isInMainList(project);
}

export function shouldHaveMapsThread(project: Project): boolean {
    return isInMainList(project) && project.type == ProjectType.MAP;
}