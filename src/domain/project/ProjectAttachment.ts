import { AttachmentPayload } from "discord.js";

import { ProjectAttachment as AttachmentDto } from "@wyzards/crossroadsclientts/dist/projects/types.js";

export default class ProjectAttachment {

    id: number;
    path: string;

    public constructor(dto: AttachmentDto) {
        this.id = dto.id;
        this.path = dto.path;
    }

    public get sendableAttachment(): AttachmentPayload {
        return { attachment: `dist/database/projects/images/${this.path}` };
    }

}