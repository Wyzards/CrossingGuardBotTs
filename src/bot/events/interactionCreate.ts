import { CacheType, Events, Interaction } from "discord.js";
import Bot from "../Bot";

const name = Events.InteractionCreate;
const execute = async function (interaction: Interaction<CacheType>) {
    if (interaction.isChatInputCommand()) {
        const command = (<Bot>interaction.client).commandManager.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
            }
        }
    } else if (interaction.isAutocomplete()) {
        const commands = (<Bot>interaction.client).commandManager.commands;
        const command = commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            if (command.autocomplete)
                await command.autocomplete(interaction);
        } catch (error) {
            console.error(error);
        }
    }
}

export {
    name, execute
}