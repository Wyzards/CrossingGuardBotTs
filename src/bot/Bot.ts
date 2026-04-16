import { Client, GatewayIntentBits } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { AppConfig } from '../core/config.js';
import { ProjectRepository } from '../infrastructure/api/ProjectRepository.js';
import AnnouncementManager from '../infrastructure/discord/announcements/AnnouncementManager.js';
import CommandManager from './CommandManager.js';
import { ProjectOrchestrator } from '../application/ProjectOrchestrator.js';
import { CrossroadsApiClient } from '@wyzards/crossroadsclientts';
import { ProjectDiscordService } from '../infrastructure/discord/ProjectDiscordService.js';
import { ProjectListOrchestrator } from '../application/ProjectListOrchestrator.js';
import { ProjectListRepository } from '../infrastructure/api/ProjectListRepository.js';


export class Bot extends Client {

    commandManager: CommandManager;
    announcementManager!: AnnouncementManager;
    projectOrchestrator!: ProjectOrchestrator;
    projectListOrchestrator!: ProjectListOrchestrator;

    constructor(private config: AppConfig) {
        super({ intents: Object.entries(GatewayIntentBits).filter(arr => !isNaN(+arr[0])).map(arr => +arr[0]) });

        this.commandManager = new CommandManager(this);

        this.registerServices(config);
        this.registerEvents();
        this.commandManager.registerCommands();
        this.login(this.config.discord.token);
    }

    private registerServices(config: AppConfig) {
        const api = new CrossroadsApiClient(this.config.api.url, this.config.api.token);
        const projectRepo = new ProjectRepository(api);
        const projectListRepo = new ProjectListRepository(api);
        const discordService = new ProjectDiscordService(config, this);
        const projectOrchestrator = new ProjectOrchestrator(projectRepo, discordService);
        const projectListOrchestrator = new ProjectListOrchestrator(projectListRepo, projectRepo, discordService);
        const announcementManager = new AnnouncementManager(projectRepo, this, config);

        this.announcementManager = announcementManager;
        this.projectOrchestrator = projectOrchestrator;
        this.projectListOrchestrator = projectListOrchestrator;
    }

    private async registerEvents() {
        const eventsPath = path.join(process.cwd(), 'dist/bot/events');
        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        for (const file of eventFiles) {
            await this.registerEventFileAtPath(eventsPath, file);
        }
    }

    private async registerEventFileAtPath(eventsPath: string, file: string) {
        const filePath = path.join(eventsPath, file);
        const event = await import(pathToFileURL(filePath).toString());
        if (event.once) {
            this.once(event.name, (...args) => event.execute(this, ...args));
        } else {
            this.on(event.name, (...args) => event.execute(this, ...args));
        }
    }
}