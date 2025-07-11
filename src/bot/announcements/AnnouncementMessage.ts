import { Attachment, AttachmentBuilder, Embed, Message, DiscordAPIError, MessageCreateOptions, MessageEditOptions, TextChannel } from "discord.js";
import Project from "../../database/projects/Project.js";
import Bot from "../Bot.js";
import AnnouncementManager from "./AnnouncementManager.js";

export default class AnnouncementMessage {

    private _announcementMsgToHiddenChannel;
    private _project;

    public constructor(project: Project | null, announcementMsg: Message) {
        this._project = project;
        this._announcementMsgToHiddenChannel = announcementMsg;
    }

    public async hasBeenSent() {
        const associatedMessages = await AnnouncementManager.findAnnouncementMessages(this.announcementMsgInHidden);

        return associatedMessages.length > 0;
    }

    public async send(includeHeading: boolean) {
        const announcementChannel = await AnnouncementManager.getAnnouncementChannel();
        const roleID = this.project == null ? Bot.DEFAULT_PING_ROLE_ID : this.project.roleId;
        var content = this.announcementMsgInHidden.content;

        if (includeHeading)
            content = `**From ${this.announcementMsgInHidden.author.displayName}**\n<@&${roleID}>\n\n${this.announcementMsgInHidden.content}`;


        var messages = AnnouncementMessage.splitMessageContent(this.announcementMsgInHidden.id, content, this.announcementMsgInHidden.embeds, Array.from(this.announcementMsgInHidden.attachments.values()), false);
        for (const messageToSend of messages) {
            let messageSent = false;

            do {
                try {
                    await announcementChannel.send(messageToSend as MessageCreateOptions);
                    messageSent = true;
                } catch (error) {
                    // If error code == 40005 (file size error, caused by announcement sent from nitro user bypassing default file attachment size limit)
                    if (error instanceof DiscordAPIError && error.code == 40005 && messageToSend.files != null) {
                        // Get attachments, sorted by file size
                        const attachments = messageToSend.files.filter((file): file is Attachment => file instanceof Attachment);
                        const largestAttachment = attachments.reduce((largest, current) => current.size > largest.size ? current : largest);
                        // Take the largest attachment, remove from attachments list
                        messageToSend.files = messageToSend.files.filter(file => file != largestAttachment);
                        // append url to content

                        messageToSend.content += "\n" + largestAttachment.url;

                        // Try send again
                        continue;
                    }

                    const adminChannel = await (await Bot.getInstance().guild).channels.fetch(Bot.ADMIN_CHANNEL_ID) as TextChannel;

                    if (error instanceof DiscordAPIError && error.code == 50035) {
                        const attachment = new AttachmentBuilder(Buffer.from(error.stack as string), { name: 'error.txt', description: 'The error stack' })
                        await adminChannel.send({ content: "Message body length edge case error occurred while sending an announcement:", files: [attachment] })
                    }

                    // If it wasn't a file size error...
                    // Send announcement send error to architect/admin channel
                    if (error instanceof Error) {
                        const attachment = new AttachmentBuilder(Buffer.from(error.stack as string), { name: 'error.txt', description: 'The error stack' })
                        await adminChannel.send({ content: "An error occurred while sending an announcement:", files: [attachment] })
                        messageSent = true;
                    } else {
                        try {
                            await adminChannel.send({ content: JSON.stringify(error) })
                        } catch (e) {
                            await adminChannel.send({ content: "An error occurred but there was another error while stringifying that error... Ironic." });
                        }
                    }
                }
            } while (!messageSent);
        }
    }

    public async update() {
        const roleID = this.project == null ? Bot.DEFAULT_PING_ROLE_ID : this.project.roleId;
        var content = this.announcementMsgInHidden.content;
        const heading = `**From ${this.announcementMsgInHidden.author.displayName}**\n<@&${roleID}>\n\n`;


        const oldMessages = await AnnouncementManager.findAnnouncementMessages(this.announcementMsgInHidden);

        var includeHeading = oldMessages.length > 0 && oldMessages[0].content.startsWith(heading);

        if (includeHeading)
            content = heading + this.announcementMsgInHidden.content;

        const newMessages = AnnouncementMessage.splitMessageContent(this.announcementMsgInHidden.id, content, this.announcementMsgInHidden.embeds, Array.from(this.announcementMsgInHidden.attachments.values()), true);

        for (var i = 0; i < oldMessages.length; i++) {
            oldMessages[i].edit(newMessages[i] as MessageEditOptions);
        }
    }

    public static splitMessageContent(announcementMsgInHiddenId: string, content: string, embeds: Embed[], attachments: Attachment[], isEdit: boolean) {
        const messages = [];

        do {
            var maxSnippet = content.substring(0, 2001);
            var lastSpace = maxSnippet.lastIndexOf(' ');
            var lastNewline = maxSnippet.lastIndexOf('\n');
            var sending = maxSnippet.substring(0, (content.length > 2000 ? (lastNewline > 0 ? lastNewline : (lastSpace > 0 ? lastSpace : maxSnippet.length)) : maxSnippet.length));
            var messageToSend: MessageCreateOptions | MessageEditOptions;

            if (isEdit) {
                messageToSend = {
                    content: sending.trim(),
                    allowedMentions: { parse: ['users'] },
                };
            } else {
                messageToSend = {
                    content: sending.trim(),
                    allowedMentions: { parse: ['users'] },
                    nonce: announcementMsgInHiddenId
                };
            }

            content = content.substring(sending.length, content.length);

            if (content.length < 1) {
                messageToSend.files = Array.from(attachments.values());
                messageToSend.embeds = embeds.filter(embed => { return !embed.video; });
            }

            messages.push(messageToSend);
        } while (content.length > 0);

        return messages;
    }

    public get project() {
        return this._project;
    }

    public get announcementMsgInHidden() {
        return this._announcementMsgToHiddenChannel;
    }
}