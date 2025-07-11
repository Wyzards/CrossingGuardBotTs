import AnnouncementMessage from "./AnnouncementMessage.js";
import AnnouncementOperationType from "./AnnouncementOperationType.js";

export default class AnnouncementOperation {

    private _type;
    private _message; // The message that's already been sent in #hidden-announce-#
    private _id;

    public constructor(type: AnnouncementOperationType, message: AnnouncementMessage) {
        this._type = type;
        this._message = message;
        this._id = message.announcementMsgInHidden.id + type;
    }

    public get id() {
        return this._id;
    }

    public get type() {
        return this._type;
    }

    public get message() {
        return this._message;
    }
}