import { CacheType, Events, Interaction } from "discord.js";
import CrossingGuardBot from "../CrossingGuardBot";

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction: Interaction<CacheType>) {
        if (interaction.isChatInputCommand()) {
            const command = (<CrossingGuardBot>interaction.client).commandManager.commands.get(interaction.commandName);

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
            const command = (<CrossingGuardBot>interaction.client).commandManager.commands.get(interaction.commandName);

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
}