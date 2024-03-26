import { Collection, SlashCommandBuilder } from "discord.js";
import * as fs from "fs";
import path from "path";
import { pathToFileURL } from 'url';

class CommandManager {

    private _commands: Collection<String, { data: SlashCommandBuilder, execute: Function, autocomplete?: Function }>;

    public constructor() {
        this._commands = new Collection();
    }

    public async registerCommands() {
        const foldersPath = path.join(process.cwd(), 'dist/bot/commands');
        const commandFolders = fs.readdirSync(foldersPath);

        for (const folder of commandFolders) {
            const commandsPath = path.join(foldersPath, folder);
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

            await this.registerCommandFilePaths(commandFiles, commandsPath);
        }
    }

    private async registerCommandFilePaths(commandFiles: string[], commandsPath: string) {
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);

            const command = await import(pathToFileURL(filePath).toString());

            this.registerCommandAtPath(command, filePath);
        }
    }

    private registerCommandAtPath(command: any, filePath: string) {
        if ('data' in command && 'execute' in command) {
            this._commands.set(command.data.name, command);
        } else {
            console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }

    public get commands() {
        return this._commands;
    }
}

export default CommandManager;