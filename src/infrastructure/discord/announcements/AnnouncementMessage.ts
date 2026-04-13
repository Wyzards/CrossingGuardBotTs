import { Project } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { Message } from "discord.js";

export default class AnnouncementMessage {

    announcementMsgInHidden;
    project;

    public constructor(project: Project | null, announcementMsg: Message) {
        this.project = project;
        this.announcementMsgInHidden = announcementMsg;
    }
}