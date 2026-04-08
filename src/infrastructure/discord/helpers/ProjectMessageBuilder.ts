import { Accessibility, ProjectStaff, ProjectStaffRankHelper } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import Project from "../../../domain/project/Project.js";

export class ProjectMessageBuilder {

    static buildChannelContent(project: Project): string {
        let linksContent = project.links.length > 0 ? "# Links\n" : "";
        let staffContent = project.staff.length > 0 ? "# Staff\n" : "";
        let discordLink = project.links.filter(link => link.label === "Discord").length ? project.links.filter(link => link.label === "Discord")[0].url : null;

        project.links.forEach(link => {
            linksContent += `- [${link.label}](${link.url})\n`;
        });

        function compare(staff1: ProjectStaff, staff2: ProjectStaff) {
            if (staff1.rank < staff2.rank)
                return -1;
            if (staff1.rank > staff2.rank)
                return 1;
            return 0;
        }

        project.staff.sort(compare).forEach(staff => {
            if (staff.user.discordId)
                staffContent += `- <@${staff.user.discordId}> ~ ${ProjectStaffRankHelper.pretty(staff.rank)}\n`;
        });

        if (project.links.length > 0)
            linksContent += "\n";
        if (project.staff.length > 0)
            staffContent += "\n";

        const content = (project.attachments.length > 0 ? project.description + "\n\n" : "") + linksContent + staffContent + (discordLink ? `**Discord:** ${discordLink}` : "");

        return content;
    }

    static buildThreadName(project: Project) {
        var name = project.displayName;

        if (project.accessibility == Accessibility.PUBLIC) {
            if (project.ip)
                name += " >>> " + project.ip;
            if (project.version)
                name += " (" + project.version + ")";
        }

        return name;
    }

}