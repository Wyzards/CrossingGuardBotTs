// src/infrastructure/discord/helpers/badgeOptions.ts

import {
    SlashCommandBooleanOption,
    SlashCommandIntegerOption,
    SlashCommandNumberOption,
    SlashCommandStringOption,
    SlashCommandUserOption
} from "discord.js";

// ===== DESCRIPTIONS =====
export const DESC = {
    badge: "The badge to operate on",
    user: "The target user",

    name: "The badge name",
    description: "The badge description",

    category: "The badge category",
    rarity: "The badge rarity",

    xpBased: "Whether this badge uses XP progression",
    active: "Whether this badge is active",

    curve: "The XP progression curve type",
    baseXp: "XP required for level 1",
    growthFactor: "How aggressively XP requirements scale",
};

// ===== CHOICES =====
export const badgeCategoryChoices = [
    { name: "Progression", value: "progression" },
    { name: "Community", value: "community" },
    { name: "Achievement", value: "achievement" },
    { name: "Artifact", value: "artifact" },
] as const;

export const badgeRarityChoices = [
    { name: "Common", value: "common" },
    { name: "Uncommon", value: "uncommon" },
    { name: "Rare", value: "rare" },
    { name: "Legendary", value: "legendary" },
] as const;

export const progressionCurveChoices = [
    { name: "Linear", value: "linear" },
    { name: "Exponential", value: "exponential" },
] as const;

// ===== OPTION BUILDERS =====

export function badgeOption(required = true) {
    return (o: SlashCommandStringOption) =>
        o.setName("badge")
            .setDescription(DESC.badge)
            .setAutocomplete(true)
            .setRequired(required);
}

export function userOption(required = true) {
    return (o: SlashCommandUserOption) =>
        o.setName("user")
            .setDescription(DESC.user)
            .setRequired(required);
}

export function badgeNameOption(required = true) {
    return (o: SlashCommandStringOption) =>
        o.setName("name")
            .setDescription(DESC.name)
            .setRequired(required);
}

export function badgeDescriptionOption(required = false) {
    return (o: SlashCommandStringOption) =>
        o.setName("description")
            .setDescription(DESC.description)
            .setRequired(required);
}

export function badgeCategoryOption(required = true) {
    return (o: SlashCommandStringOption) =>
        o.setName("category")
            .setDescription(DESC.category)
            .setRequired(required)
            .addChoices(...badgeCategoryChoices);
}

export function badgeRarityOption(required = false) {
    return (o: SlashCommandStringOption) =>
        o.setName("rarity")
            .setDescription(DESC.rarity)
            .setRequired(required)
            .addChoices(...badgeRarityChoices);
}

export function xpBasedOption(required = true) {
    return (o: SlashCommandBooleanOption) =>
        o.setName("xp_based")
            .setDescription(DESC.xpBased)
            .setRequired(required);
}

export function activeOption(required = false) {
    return (o: SlashCommandBooleanOption) =>
        o.setName("active")
            .setDescription(DESC.active)
            .setRequired(required);
}

export function curveOption(required = true) {
    return (o: SlashCommandStringOption) =>
        o.setName("curve")
            .setDescription(DESC.curve)
            .setRequired(required)
            .addChoices(...progressionCurveChoices);
}

export function baseXpOption(required = true) {
    return (o: SlashCommandIntegerOption) =>
        o.setName("base_xp")
            .setDescription(DESC.baseXp)
            .setRequired(required);
}

export function growthFactorOption(required = true) {
    return (o: SlashCommandNumberOption) =>
        o.setName("growth_factor")
            .setDescription(DESC.growthFactor)
            .setRequired(required);
}