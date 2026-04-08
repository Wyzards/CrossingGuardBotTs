import { Client, Message, MessageFlags, TextChannel } from "discord.js";
import Bot from "../../../bot/Bot.js";
import { ProjectRepository } from "../../api/ProjectRepository.js";
import AnnouncementMessage from "./AnnouncementMessage.js";
import AnnouncementQueue from "./AnnouncementQueue.js";

export default class AnnouncementManager {

    private projectAnnouncementQueues: Map<Number, AnnouncementQueue>;
    private defaultAnnouncementQueue: AnnouncementQueue;

    public constructor(private repo: ProjectRepository, private bot: Bot) {
        this.projectAnnouncementQueues = new Map();
        this.defaultAnnouncementQueue = new AnnouncementQueue(this);
    }

    public async handleFollowedChannelMessageCreate(message: Message) {
        const sendingGuildId = message.flags.has(MessageFlags.IsCrosspost) ? message.reference!.guildId! : message.guildId!;
        const project = await this.repo.getByGuild(sendingGuildId);
        var announcementQueue;

        if (project) {
            announcementQueue = this.projectAnnouncementQueues.get(project.id);

            if (announcementQueue == undefined) {
                announcementQueue = new AnnouncementQueue(this);
                this.projectAnnouncementQueues.set(project.id, announcementQueue);
            }

            announcementQueue.queueMessage(new AnnouncementMessage(project, message));
        } else {
            announcementQueue = this.defaultAnnouncementQueue;
            announcementQueue.queueMessage(new AnnouncementMessage(null, message));
        }

    }

    public async getAnnouncementChannel(): Promise<TextChannel> {
        const announcementChannel = await this.bot.channels.fetch(Bot.ANNOUNCEMENT_CHANNEL_ID);

        if (announcementChannel == null)
            throw new Error("Announcement channel did not exist on retrieval. Check configurations?");

        return announcementChannel as TextChannel;
    }

    public async send(announcement: AnnouncementMessage, includeHeading: boolean) {
        const announcementChannel = await this.getAnnouncementChannel();
        const roleID = announcement.project == null ? Bot.DEFAULT_PING_ROLE_ID : announcement.project.roleId;
        const channelId = announcement.project?.channelId;
        const heading = `**From ${announcement.announcementMsgInHidden.author.displayName}**\n<@&${roleID}> ${channelId ? `<#${channelId}>` : ""}\n\n`;
        const message = announcement.announcementMsgInHidden;

        if (includeHeading)
            await announcementChannel.send({ content: heading, allowedMentions: { parse: ['users'] } });

        await message.forward(announcementChannel);
    }
}