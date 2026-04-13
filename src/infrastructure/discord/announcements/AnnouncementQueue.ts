import AnnouncementManager from "./AnnouncementManager.js";
import AnnouncementMessage from "./AnnouncementMessage.js";

export default class AnnouncementQueue {

    private stack: AnnouncementMessage[];
    private timeout: NodeJS.Timeout | null = null;

    public constructor(private manager: AnnouncementManager) {
        this.stack = [];
    }

    public queueMessage(message: AnnouncementMessage) {
        this.stack.push(message);

        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        // Really not needed, only here if project messages happen to come out sandwhiched, some delay can allow for in order resolution
        this.timeout = setTimeout(() => {
            this.resolveStack();
            this.timeout = null;
        }, 10000);
    }

    public async resolveStack() {
        const stackCopy = [...this.stack];
        this.stack = [];

        const messagesByProject = new Map<Number | undefined, AnnouncementMessage[]>;

        for (const message of stackCopy) {
            const projectId = message.project?.id;

            if (!messagesByProject.has(projectId)) {
                messagesByProject.set(projectId, []);
            }

            messagesByProject.get(projectId)!.push(message);
        }

        for (const [projectId, messages] of messagesByProject.entries()) {
            for (let i = 0; i < messages.length; i++) {
                const announcementMessage = messages[i];
                await this.manager.send(announcementMessage, i === 0); // header only for first in THIS project
            }
        }
    }


}