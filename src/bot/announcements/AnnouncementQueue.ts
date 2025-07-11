import { Message } from "discord.js";
import AnnouncementOperation from "./AnnouncementOperation.js";
import AnnouncementOperationType from "./AnnouncementOperationType.js";
import AnnouncementMessage from "./AnnouncementMessage.js";
import Bot from "../Bot.js";

export default class AnnouncementQueue {

    private stack: AnnouncementOperation[];

    public constructor() {
        this.stack = [];
    }

    public addMessage(message: AnnouncementMessage) {
        const addOperation = new AnnouncementOperation(AnnouncementOperationType.Create, message);

        this.queueOperation(addOperation);
    }

    public updateMessage(newMessage: AnnouncementMessage) {
        const updateOperation = new AnnouncementOperation(AnnouncementOperationType.Update, newMessage);

        this.queueOperation(updateOperation);
    }

    public queueOperation(operation: AnnouncementOperation) {
        this.stack.push(operation);

        const queue = this;

        setTimeout(() => {
            if (queue.stack.length > 0 && queue.stack[queue.stack.length - 1].id == operation.id) {
                this.resolveStack();
            }
        }, Bot.ANNOUNCEMENT_COOLDOWN);
    }

    public async resolveStack() {
        const newMessages = new Map<string, AnnouncementMessage>;
        const messageUpdates: AnnouncementMessage[] = [];

        for (const operation of this.stack) {
            if (operation.type == AnnouncementOperationType.Create) {
                newMessages.set(operation.message.announcementMsgInHidden.id, operation.message);
            } else if (operation.type == AnnouncementOperationType.Update) {
                if (await operation.message.hasBeenSent()) {
                    messageUpdates.push(operation.message);
                } else {
                    newMessages.set(operation.message.announcementMsgInHidden.id, operation.message);
                }
            }
        }

        Array.from(newMessages.values()).forEach(async (announcementMessage, i) => {
            await announcementMessage.send(i == 0);
        });

        if (messageUpdates.length > 0) {
            for (const messageUpdate of messageUpdates) {
                await messageUpdate.update();
            }
        }

        this.stack.length = 0;
    }
}