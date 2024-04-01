import { Message, MessageFlags, TextChannel } from "discord.js";
import Project from "../../database/projects/Project.js";
import AnnouncementQueue from "./AnnouncementQueue.js";
import Database from "../../database/Database.js";
import Bot from "../Bot.js";
import AnnouncementMessage from "./AnnouncementMessage.js";

export default class AnnouncementManager {

    private projectAnnouncementQueues: Map<Project, AnnouncementQueue>;
    private defaultAnnouncementQueue: AnnouncementQueue;

    public constructor() {
        this.projectAnnouncementQueues = new Map();
        this.defaultAnnouncementQueue = new AnnouncementQueue();
    }

    public static async findAnnouncementMessages(hiddenMessage: Message) {
        const messages: Message[] = [];
        const announcementChannel = await AnnouncementManager.getAnnouncementChannel();
        const announcedMessages = await announcementChannel.messages.fetch();

        // TODO: Optimize this
        for (const announcedMessage of announcedMessages.values()) {
            if (announcedMessage.nonce == hiddenMessage.id)
                messages.push(announcedMessage);
        }

        return messages;
    }

    public async handleFollowedChannelMessageCreate(message: Message) {
        const sendingGuildId = message.flags.has(MessageFlags.IsCrosspost) ? message.reference!.guildId! : message.guildId!;
        const sendingProjectResult = await Database.getProjectByGuild(sendingGuildId);
        var announcementQueue;

        if (sendingProjectResult.exists) {
            announcementQueue = this.projectAnnouncementQueues.get(sendingProjectResult.result);

            if (announcementQueue == undefined) {
                announcementQueue = new AnnouncementQueue();
                this.projectAnnouncementQueues.set(sendingProjectResult.result, announcementQueue);
            }

            announcementQueue.addMessage(new AnnouncementMessage(sendingProjectResult.result, message));
        } else {
            announcementQueue = this.defaultAnnouncementQueue;
            announcementQueue.addMessage(new AnnouncementMessage(null, message));
        }

    }

    public async handleFollowedChannelMessageUpdate(message: Message) {
        const sendingGuildId = message.flags.has(MessageFlags.IsCrosspost) ? message.reference!.guildId! : message.guildId!;
        const sendingProjectResult = await Database.getProjectByGuild(sendingGuildId);
        var announcementQueue;

        if (sendingProjectResult.exists) {
            announcementQueue = this.projectAnnouncementQueues.get(sendingProjectResult.result);

            if (announcementQueue == undefined) {
                announcementQueue = new AnnouncementQueue();
                this.projectAnnouncementQueues.set(sendingProjectResult.result, announcementQueue);
            }

            announcementQueue.updateMessage(new AnnouncementMessage(sendingProjectResult.result, message));
        } else {
            announcementQueue = this.defaultAnnouncementQueue;
            announcementQueue.updateMessage(new AnnouncementMessage(null, message));
        }

    }

    public static async getAnnouncementChannel(): Promise<TextChannel> {
        const guild = await Bot.guild;
        const announcementChannel = await guild.channels.fetch(Bot.ANNOUNCEMENT_CHANNEL_ID);

        if (announcementChannel == null)
            throw new Error("Announcement channel did not exist on retrieval. Check configurations?");

        return announcementChannel as TextChannel;
    }
}