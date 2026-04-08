import { ChatInputCommandInteraction } from "discord.js";

type TaskStatus = "pending" | "done" | "failed";

export interface TrackedTask {
    name: string;
    status: TaskStatus;
}

export interface IOperationReporter {
    track<T>(name: string, promise: Promise<T>): Promise<T>;
}

export class OperationTracker implements IOperationReporter {
    private tasks: TrackedTask[] = [];
    private finalMessage?: string;
    private finalized = false;

    constructor(
        private interaction: ChatInputCommandInteraction
    ) { }

    track<T>(name: string, promise: Promise<T>): Promise<T> {
        const task: TrackedTask = { name, status: "pending" };
        this.tasks.push(task);

        this.updateMessage();

        return promise
            .then((result) => {
                task.status = "done";
                this.updateMessage();
                return result;
            })
            .catch((err) => {
                task.status = "failed";
                this.updateMessage();
                throw err;
            });
    }

    private async updateMessage() {
        const lines = this.tasks.map(t => {
            if (t.status === "pending") return `⏳ ${t.name}`;
            if (t.status === "done") return `✅ ${t.name}`;
            return `❌ ${t.name}`;
        });

        await this.interaction.editReply({
            content: lines.join("\n")
        });
    }

    public async finalize(message?: string) {
        if (this.finalized) return;
        this.finalized = true;

        const hasFailure = this.tasks.some(t => t.status === "failed");

        if (message) {
            await this.interaction.editReply({ content: message });
            return;
        }

        if (hasFailure) {
            await this.interaction.editReply({
                content: "❌ Some operations failed."
            });
        } else {
            await this.interaction.editReply({
                content: "✅ All operations completed successfully."
            });
        }
    }
}

export function track<T>(
    reporter: IOperationReporter | undefined,
    name: string,
    promise: Promise<T>
): Promise<T> {
    return reporter ? reporter.track(name, promise) : promise;
}