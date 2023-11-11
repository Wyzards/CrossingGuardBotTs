class ProjectLink {

    private _projectId: number;
    private _linkId: number;
    private _linkName: string;
    private _linkUrl: string;

    public constructor(projectId: number, linkId: number, linkName: string, linkUrl: string) {
        this._projectId = projectId;
        this._linkId = linkId;
        this._linkName = linkName;
        this._linkUrl = linkUrl;
    }

    public get projectId(): number {
        return this._projectId;
    }

    public get linkId(): number {
        return this._linkId;
    }

    public get linkName(): string {
        return this._linkName;
    }

    public get linkUrl(): string {
        return this._linkUrl;
    }

}