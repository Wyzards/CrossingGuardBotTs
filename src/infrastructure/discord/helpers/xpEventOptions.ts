import {
    SlashCommandIntegerOption,
    SlashCommandStringOption,
} from "discord.js";

// ===== DESCRIPTIONS =====
export const DESC = {
    event: "The XP event to operate on",

    name: "The XP event name",

    xp: "The amount of XP granted",
    cooldown: "Cooldown in seconds before this event can be triggered again",
};

// ===== OPTION BUILDERS =====

export function xpEventOption(required = true) {
    return (o: SlashCommandStringOption) =>
        o.setName("event")
            .setDescription(DESC.event)
            .setAutocomplete(true)
            .setRequired(required);
}

export function xpEventNameOption(required = true) {
    return (o: SlashCommandStringOption) =>
        o.setName("name")
            .setDescription(DESC.name)
            .setRequired(required);
}

export function xpAmountOption(required = true) {
    return (o: SlashCommandIntegerOption) =>
        o.setName("xp")
            .setDescription(DESC.xp)
            .setRequired(required);
}

export function cooldownOption(required = true) {
    return (o: SlashCommandIntegerOption) =>
        o.setName("cooldown")
            .setDescription(DESC.cooldown)
            .setRequired(required);
}