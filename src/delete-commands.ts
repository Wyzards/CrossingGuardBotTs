import { REST, Routes } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

// Construct and prepare an instance of the REST module
var configData = fs.readFile("config.json", 'utf8', (err, data) => {
    const config = JSON.parse(data);
    const rest = new REST().setToken(config["TOKEN"]);

    // and deploy your commands!
    (async () => {
        try {
            console.log(`Started removing application (/) commands.`);

            rest.put(Routes.applicationCommands(config["CLIENT_ID"]), { body: [] })
                .then(() => console.log('Successfully deleted all application commands.'))
                .catch(console.error);

            console.log(`Successfully reloaded application (/) commands.`);
        } catch (error) {
            console.error(error);
        }
    })();
});