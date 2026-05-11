import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

dotenv.config({ quiet: true });

const guildCommands: any[] = [];
const globalCommands: any[] = [];
const foldersPath = path.join(process.cwd(), 'dist/bot/commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = await import(pathToFileURL(filePath).toString());

        if ('data' in command && 'execute' in command) {

            const json = command.data.toJSON();

            // Commands allowed in DMs / globally
            if (json.name === "profile") {
                globalCommands.push(json);
            }
            else {
                guildCommands.push(json);
            }

        } else {
            console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
    }
}

// Read config synchronously to avoid async/callback race conditions

const rest = new REST().setToken(process.env.TOKEN!);

(async () => {
    try {
        console.log(`Refreshing ${guildCommands.length} guild commands...`);

        await rest.put(
            Routes.applicationGuildCommands(
                process.env.CLIENT_ID!,
                process.env.GUILD_ID!
            ),
            { body: guildCommands },
        );

        console.log(`Successfully reloaded guild commands.`);

        console.log(`Refreshing ${globalCommands.length} global commands...`);

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID!),
            { body: globalCommands },
        );

        console.log(`Successfully reloaded global commands.`);
    } catch (error) {
        console.error('Failed to deploy commands:', error);
    }
})();