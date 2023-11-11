class Project {

    private readonly _id: number;
    private _channelId: string;
    private _name: string;
    private _displayName: string;
    private _status: Status;
    private _description: string;
    private _discordId: string;
    private _ip: string;
    private _roleId: string;
    private _links: ProjectLink[];

    public constructor(id: number) {
        this._id = id;
    }

    public get id(): number {
        return this._id;
    }

    public get channelId(): string {
        return this._channelId;
    }

    public get name(): string {
        return this._name;
    }

    public get displayName(): string {
        return this._displayName;
    }

    public get status(): Status {
        return this._status;
    }

    public get description(): string {
        return this._description;
    }

    public get discordId(): string {
        return this._discordId;
    }

    public get ip(): string {
        return this._ip;
    }

    public get roleId(): string {
        return this._roleId;
    }

    public get links(): ProjectLink[] {
        return this._links;
    }

}