
export default class Result<T> {

    private _result: T | null;
    private _success: boolean;

    constructor(result: T | null, success: boolean) {
        this._result = result;
        this._success = success;
    }

    public get result(): T {
        if (this.success)
            return this._result!;
        else
            throw new Error("Tried to retrieve from a failed result");
    }

    public get success(): boolean {
        return this._success;
    }
}