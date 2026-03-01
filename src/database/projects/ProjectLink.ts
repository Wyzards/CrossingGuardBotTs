export default class ProjectLink {

    private _projectId: number;
    private _id: number;
    private _label: string;
    private _url: string;

    public constructor(projectId: number, id: number, label: string, url: string) {
        this._projectId = projectId;
        this._id = id;
        this._label = label;
        this._url = url;
    }

    public get projectId(): number {
        return this._projectId;
    }

    public get id(): number {
        return this._id;
    }

    public get label(): string {
        return this._label;
    }

    public get url(): string {
        return this._url;
    }

}