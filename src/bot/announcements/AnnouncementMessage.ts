import { Attachment, AttachmentBuilder, Collection, Embed, Message, MessageCreateOptions, MessageEditOptions, TextChannel } from "discord.js";
import AnnouncementManager from "./AnnouncementManager.js";
import Project from "../../database/projects/Project.js";
import Bot from "../Bot.js";

export default class AnnouncementMessage {

    private _hiddenMessage;
    private _project;

    public constructor(project: Project | null, hiddenMessage: Message) {
        this._project = project;
        this._hiddenMessage = hiddenMessage;
    }

    public async hasBeenSent() {
        const associatedMessages = await AnnouncementManager.findAnnouncementMessages(this.hiddenMessage);

        return associatedMessages.length > 0;
    }

    public async send(includeHeading: boolean) {
        const announcementChannel = await AnnouncementManager.getAnnouncementChannel();
        const roleID = this.project == null ? Bot.DEFAULT_PING_ROLE_ID : this.project.roleId;
        var content = this.hiddenMessage.content;

        if (includeHeading)
            content = `**From ${this.hiddenMessage.author.displayName}**\n<@&${roleID}>\n\n${this.hiddenMessage.content}`;

        for (const messageToSend of AnnouncementMessage.splitMessageContent(this.hiddenMessage.id, content, this.hiddenMessage.embeds, Array.from(this.hiddenMessage.attachments.values()), false))
            try {
                await announcementChannel.send(messageToSend as MessageCreateOptions);
            } catch (error) {
                const adminChannel = await (await Bot.getInstance().guild).channels.fetch(Bot.ADMIN_CHANNEL_ID) as TextChannel;
                if (error instanceof Error) {
                    const attachment = new AttachmentBuilder(Buffer.from(error.stack as string), { name: 'error.txt', description: 'The error stack' })
                    await adminChannel.send({ content: "An error occurred while sending an announcement:", files: [attachment] })
                } else {
                    try {
                        await adminChannel.send({ content: JSON.stringify(error) })
                    } catch (e) {
                        await adminChannel.send({ content: "An error occurred but there was another error while stringifying that error... Ironic." });
                    }
                }
            }
    }

    public async update() {
        const roleID = this.project == null ? Bot.DEFAULT_PING_ROLE_ID : this.project.roleId;
        var content = this.hiddenMessage.content;
        const heading = `**From ${this.hiddenMessage.author.displayName}**\n<@&${roleID}>\n\n`;


        const oldMessages = await AnnouncementManager.findAnnouncementMessages(this.hiddenMessage);

        var includeHeading = oldMessages.length > 0 && oldMessages[0].content.startsWith(heading);

        if (includeHeading)
            content = heading + this.hiddenMessage.content;

        const newMessages = AnnouncementMessage.splitMessageContent(this.hiddenMessage.id, content, this.hiddenMessage.embeds, Array.from(this.hiddenMessage.attachments.values()), true);

        for (var i = 0; i < oldMessages.length; i++) {
            oldMessages[i].edit(newMessages[i] as MessageEditOptions);
        }
    }

    public static splitMessageContent(hiddenMessageId: string, content: string, embeds: Embed[], attachments: Attachment[], isEdit: boolean) {
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
                    nonce: hiddenMessageId
                };
            }

            content = content.substring(sending.length, content.length);

            if (content.length < 1) {
                messageToSend.files = AnnouncementMessage.parseAttachmentFileSizes(content, Array.from(attachments.values()));
                messageToSend.embeds = embeds.filter(embed => { return !embed.video; });
            }

            messages.push(messageToSend);
        } while (content.length > 0);

        return messages;
    }

    public get project() {
        return this._project;
    }

    public get hiddenMessage() {
        return this._hiddenMessage;
    }

    public static parseAttachmentFileSizes(announcementContent: string, attachments: Attachment[]): Attachment[] {
        var files = [];

        for (const attachment of Array.from(attachments.values())) {
            if (attachment.size > 26209158) {
                announcementContent += "\n" + attachment.url;
            } else {
                files.push(attachment);
            }
        }

        return files;
    }

}