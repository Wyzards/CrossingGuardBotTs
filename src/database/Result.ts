
export default class Result<T> {

    private _result: T | null;
    private _exists: boolean;

    constructor(result: T | null, success: boolean) {
        this._result = result;
        this._exists = success;
    }

    public get result(): T {
        if (this.exists)
            return this._result!;
        else
            throw new Error("Tried to retrieve from a failed result");
    }

    public get exists(): boolean {
        return this._exists;
    }
}