import { AttachmentPayload, JSONEncodable } from "discord.js";

export default class ProjectLink {

    private _projectId: number;
    private _id: number;
    private _path: string;

    public constructor(projectId: number, id: number, url: string) {
        this._projectId = projectId;
        this._id = id;
        this._path = url;
    }

    public get projectId(): number {
        return this._projectId;
    }

    public get id(): number {
        return this._id;
    }

    public get filePath(): string {
        return this._path;
    }

    public get sendableAttachment(): AttachmentPayload {
        return { attachment: `dist/database/projects/images/${this.filePath}` };
    }

}