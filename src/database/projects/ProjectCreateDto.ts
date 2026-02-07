import { DefaultReactionEmoji } from "discord.js";
import ProjectAttachment from "./ProjectAttachment.js";
import ProjectLink from "./ProjectLink.js";
import ProjectStaff from "./ProjectStaff.js";
import { ProjectStatus } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { ProjectType } from "@wyzards/crossroadsclientts/dist/projects/types.js";

export type ProjectCreateDto = {
    channelId: string | null;
    name: string;
    displayName: string;
    status?: ProjectStatus;
    description?: string;
    guildId?: string;
    ip?: string;
    roleId: string;
    links?: ProjectLink[];
    staff?: ProjectStaff[];
    attachments?: ProjectAttachment[];
    type: ProjectType;
    emoji?: DefaultReactionEmoji | null;
};
