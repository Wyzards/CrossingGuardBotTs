import { ArchitectApproval, Project, ProjectStage } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { ColorResolvable } from "discord.js";

export class ProjectStageDiscordMeta {

    static roleColor(project: Project): ColorResolvable {
        if (project.architect_approval == ArchitectApproval.HIDDEN)
            return "NotQuiteBlack";
        if (project.project_stage == ProjectStage.CLOSED)
            return "Red";
        if (project.project_stage == ProjectStage.IN_DEVELOPMENT)
            return "Blue";

        return "Green";
    }

    static channelIcon(project: Project): string {
        if (project.architect_approval == ArchitectApproval.HIDDEN)
            return "⚫";
        if (project.project_stage == ProjectStage.CLOSED)
            return "🔴";
        if (project.project_stage == ProjectStage.IN_DEVELOPMENT)
            return "🔵";

        return "🟢";
    }

}