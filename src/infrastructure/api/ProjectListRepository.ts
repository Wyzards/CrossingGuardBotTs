import { CrossroadsApiClient } from "@wyzards/crossroadsclientts";
import { ProjectListEntry } from "@wyzards/crossroadsclientts/dist/projectListEntries/types.js";
import { ProjectListTag, ProjectListWithRelations } from "@wyzards/crossroadsclientts/dist/projectLists/types.js";
import { FilterGroup } from "@wyzards/crossroadsclientts/dist/types/filter.js";

export class ProjectListRepository {
    constructor(private api: CrossroadsApiClient) { }

    list() {
        return this.api.projectLists.list();
    }

    getById(id: number): Promise<ProjectListWithRelations> {
        return this.api.projectLists.getById(id);
    }

    create(data: {
        name: string;
        channel_id: string | null;
        filters: FilterGroup;
        is_active?: boolean;
    }): Promise<ProjectListWithRelations> {
        return this.api.projectLists.create(data);
    }

    update(id: number, data: Partial<{
        name: string;
        channel_id: string | null;
        filters: FilterGroup;
        is_active: boolean;
    }>): Promise<ProjectListWithRelations> {
        return this.api.projectLists.update(id, data);
    }

    delete(id: number): Promise<void> {
        return this.api.projectLists.delete(id);
    }

    getEntriesForList(listId: number): Promise<ProjectListEntry[]> {
        return this.api.projectListEntries.getForList(listId);
    }

    syncEntries(payload: {
        project_list_id: number;
        entries: { project_id: number; thread_channel_id: string }[];
    }): Promise<void> {
        return this.api.projectListEntries.sync(payload);
    }

    getTags(listId: number): Promise<ProjectListTag[]> {
        return this.api.projectLists.getTags(listId);
    }

    createTag(
        listId: number,
        data: {
            name: string;
            filters: FilterGroup;
        }
    ): Promise<ProjectListTag> {
        return this.api.projectLists.createTag(listId, data);
    }

    updateTag(
        listId: number,
        tagId: number,
        data: Partial<{
            name: string;
            filters: FilterGroup;
        }>
    ): Promise<ProjectListTag> {
        return this.api.projectLists.updateTag(listId, tagId, data);
    }

    deleteTag(listId: number, tagId: number): Promise<void> {
        return this.api.projectLists.deleteTag(listId, tagId);
    }

    evaluateTags(
        listId: number,
        projectId: number
    ): Promise<ProjectListTag[]> {
        return this.api.projectLists.evaluateTags(listId, projectId);
    }

    evaluateTagsBulk(
        listId: number,
        projectIds: number[]
    ): Promise<Record<number, ProjectListTag[]>> {
        return this.api.projectLists.evaluateTagsBulk(listId, {
            project_ids: projectIds
        });
    }
}