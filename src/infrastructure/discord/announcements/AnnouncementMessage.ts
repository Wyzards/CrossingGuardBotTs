import { Attachment, Embed, Message, MessageCreateOptions, MessageEditOptions } from "discord.js";
import Project from "../../../domain/project/Project.js";
import Bot from "../../../bot/Bot.js";
import AnnouncementManager from "./AnnouncementManager.js";

export default class AnnouncementMessage {

    announcementMsgInHidden;
    project;

    public constructor(project: Project | null, announcementMsg: Message) {
        this.project = project;
        this.announcementMsgInHidden = announcementMsg;
    }
}