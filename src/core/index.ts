import { ProjectRepository } from '../infrastructure/api/ProjectRepository.js';
import { getApiClient } from '../infrastructure/api/apiClient.js';
import { ProjectService } from '../application/ProjectService.js';
import Bot from '../bot/Bot.js';
import { ProjectDiscordService } from '../infrastructure/discord/ProjectDiscordService.js';

export function createApp() {
    const apiClient = getApiClient();

    const projectRepo = new ProjectRepository(apiClient);
    const projectService = new ProjectService();
    const projectDiscordService = new ProjectDiscordService(projectRepo);

    const bot = new Bot(projectService, projectDiscordService);

    return bot;
}