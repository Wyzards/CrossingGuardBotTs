import { FilterGroup } from "@wyzards/crossroadsclientts/dist/types/filter.js";
import { ForumChannel, ForumThreadChannel } from "discord.js";
import { ProjectListRepository } from "../infrastructure/api/ProjectListRepository.js";
import { ProjectRepository } from "../infrastructure/api/ProjectRepository.js";
import { ProjectDiscordService } from "../infrastructure/discord/ProjectDiscordService.js";
import { ProjectList, ProjectListTag, ProjectListWithRelations } from "@wyzards/crossroadsclientts/dist/projectLists/types.js";
import { Project, ProjectWithRelations } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { ProjectListEntry } from "@wyzards/crossroadsclientts/dist/projectListEntries/types.js";

export class ProjectListOrchestrator {
    constructor(
        public readonly projectListRepo: ProjectListRepository,
        public readonly projectRepo: ProjectRepository,
        private discordService: ProjectDiscordService
    ) { }

    async ensureChannel(list: ProjectList): Promise<ForumChannel | null> {
        let channel = list.channel_id
            ? await this.discordService.fetchChannel(list.channel_id)
            : null;

        if (!channel && list.is_active) {
            channel = await this.discordService.createChannel(list.name);

            await this.projectListRepo.update(list.id, {
                channel_id: channel.id,
            });

            list.channel_id = channel.id;
        } else if (channel && !list.is_active) {
            this.discordService.deleteChannel(channel);
            return null;
        }

        return channel;
    }

    async createProjectChannelList(name: string, filters: FilterGroup): Promise<ProjectList> {
        // 1. create DB record FIRST (no channel yet)
        const list = await this.projectListRepo.create({
            name: name,
            filters: filters,
            channel_id: null,
            is_active: true,
        });

        await this.syncList(list);

        return this.projectListRepo.getById(list.id);
    }


    async updateProjectList(
        id: number,
        updates: {
            name?: string;
            filters?: FilterGroup;
            is_active?: boolean;
        }
    ): Promise<ProjectListWithRelations> {
        const list = await this.projectListRepo.update(id, updates);

        await this.syncList(list);

        return this.projectListRepo.getById(list.id);;
    }

    async deleteProjectList(id: number) {
        const list = await this.projectListRepo.getById(id);

        if (list.channel_id) {
            const channel = await this.discordService.fetchChannel(list.channel_id);

            if (channel) {
                await this.discordService.deleteChannel(channel);
            }
        }

        await this.projectListRepo.delete(id);
    }

    async syncList(list: ProjectListWithRelations) {
        const channel = await this.ensureChannel(list);
        if (!channel)
            return;

        const syncedChannel = await this.syncChannel(list, channel);
        await this.syncEntries(list, syncedChannel);
    }

    async syncChannel(list: ProjectListWithRelations, channel: ForumChannel): Promise<ForumChannel> {
        const existingTags = channel.availableTags;
        const nextTags = list.tags.map(dbTag => {
            const existing = existingTags.find(t => t.name === dbTag.name);

            return {
                id: existing?.id,
                name: dbTag.name,
                moderated: existing?.moderated ?? false,
                emoji: existing?.emoji ?? null
            }
        });

        const hasTagDiff =
            existingTags.length !== list.tags.length ||
            list.tags.some(dbTag => !existingTags.find(t => t.name === dbTag.name));

        const hasNameDiff = channel.name !== list.name;

        if (!hasTagDiff && !hasNameDiff) {
            return channel;
        }

        const updatedChannel = await channel.edit({ name: list.name, availableTags: nextTags });

        return updatedChannel;
    }

    async syncEntries(list: ProjectListWithRelations, channel: ForumChannel) {
        const projects = await this.projectRepo.search(list.filters);
        const existingEntries = list.entries;

        const tagResults = await this.evaluateTagsBulk(list, projects);

        const finalEntries = await this.syncProjectThreads(
            channel,
            projects,
            existingEntries,
            tagResults
        );

        await this.cleanupRemovedThreads(projects, existingEntries);

        await this.persistEntries(list.id, finalEntries);
    }

    private async syncProjectThreads(
        channel: ForumChannel,
        projects: ProjectWithRelations[],
        existingEntries: ProjectListEntry[],
        tagResults: Record<number, ProjectListTag[]>
    ) {
        const existingMap = new Map(existingEntries.map(e => [e.project_id, e]));

        const results: {
            project_id: number;
            thread_channel_id: string;
        }[] = [];


        for (const project of projects) {
            const attachments = await this.projectRepo.downloadAttachments(project);
            const thread = await this.ensureThreadForProject(
                channel,
                project,
                attachments,
                existingMap.get(project.id)
            );

            if (!thread) continue;

            await this.syncThreadContent(project, thread, attachments);

            await this.applyThreadTags(
                channel,
                thread,
                tagResults[project.id] ?? []
            );

            results.push({
                project_id: project.id,
                thread_channel_id: thread.id,
            });
        }

        return results;
    }

    private async ensureThreadForProject(
        channel: ForumChannel,
        project: Project,
        attachments: Buffer[],
        entry?: ProjectListEntry
    ): Promise<ForumThreadChannel | null> {
        const existing = entry
            ? await this.discordService.fetchThread(entry.thread_channel_id)
            : null;

        if (existing) return existing as ForumThreadChannel;

        return this.discordService.createListThread(channel, project, attachments);
    }

    private async applyThreadTags(
        channel: ForumChannel,
        thread: ForumThreadChannel,
        tags: ProjectListTag[]
    ) {
        const tagIds = tags
            .map(tag =>
                channel.availableTags.find(t => t.name === tag.name)?.id
            )
            .filter(Boolean) as string[];

        await thread.edit({ appliedTags: tagIds });
    }

    private async cleanupRemovedThreads(
        projects: ProjectWithRelations[],
        existingEntries: ProjectListEntry[]
    ) {
        const desiredIds = new Set(projects.map(p => p.id));

        for (const entry of existingEntries) {
            if (!desiredIds.has(entry.project_id)) {
                const thread = await this.discordService.fetchThread(entry.thread_channel_id);

                if (thread) {
                    await this.discordService.deleteThread(thread);
                }
            }
        }
    }

    private async persistEntries(
        listId: number,
        entries: { project_id: number; thread_channel_id: string }[]
    ) {
        await this.projectListRepo.syncEntries({
            project_list_id: listId,
            entries,
        });
    }

    async syncThreadContent(
        project: ProjectWithRelations,
        thread: ForumThreadChannel,
        attachments: Buffer[]
    ): Promise<void> {

        const starterMessage = await thread.fetchStarterMessage();
        const messages = await thread.messages.fetch();

        if (starterMessage) {
            const content = await this.discordService.buildListThreadStarterMessage(project, attachments);
            await starterMessage.edit(content);
            messages.delete(starterMessage.id);
        }

        // ✅ clear old messages
        for (const message of messages.values()) {
            if (!message.system) {
                await thread.messages.delete(message);
            }
        }

        // ✅ send fresh content
        await this.discordService.sendListThreadMessage(project, thread);
    }

    async createTag(
        listId: number,
        data: { name: string; filters: FilterGroup }
    ) {
        return this.projectListRepo.createTag(listId, data);
    }

    async updateTag(
        listId: number,
        tagId: number,
        data: { name?: string; filters?: FilterGroup }
    ) {
        return this.projectListRepo.updateTag(listId, tagId, data);
    }

    async deleteTag(listId: number, tagId: number) {
        return this.projectListRepo.deleteTag(listId, tagId);
    }

    async evaluateTagsForProject(
        list: ProjectListWithRelations,
        project: Project
    ): Promise<ProjectListTag[]> {
        return this.projectListRepo.evaluateTags(list.id, project.id);
    }

    async evaluateTagsBulk(list: ProjectListWithRelations, projects: ProjectWithRelations[]): Promise<Record<number, ProjectListTag[]>> {
        return this.projectListRepo.evaluateTagsBulk(list.id, projects.map(p => p.id));
    }

}