import { AccessibilityHelper, ArchitectApprovalHelper, CommunityVettedHelper, ProjectStageHelper, ProjectTypeHelper } from "@wyzards/crossroadsclientts/dist/projects/types.js";
import { SlashCommandStringOption } from "discord.js";

// ===== COMMON DESCRIPTIONS =====
export const DESC = {
    list: "The list to operate on",
    tag: "The tag to operate on",
    field: "Filter field to match against",
    operator: "Comparison operator",
    value: "Value to compare against",
    group: "Which group this filter applies to",
};

// ===== FIELD CHOICES =====
export const filterFieldChoices = [
    { name: "Type", value: "type" },
    { name: "Project Stage", value: "project_stage" },
    { name: "Community Vetted", value: "community_vetted" },
    { name: "Architect Approval", value: "architect_approval" },
    { name: "Accessibility", value: "accessibility" },
] as const;

// ===== OPERATOR CHOICES =====
export const filterOperatorChoices = [
    { name: "Equals", value: "=" },
    { name: "Not Equals", value: "!=" },
] as const;

// ===== VALUE CHOICES =====
export const filterValueChoices = {
    type: ProjectTypeHelper.values().map(v => ({
        name: ProjectTypeHelper.pretty(v as any),
        value: v,
    })),

    project_stage: ProjectStageHelper.values().map(v => ({
        name: ProjectStageHelper.pretty(v as any),
        value: v,
    })),

    community_vetted: CommunityVettedHelper.values().map(v => ({
        name: CommunityVettedHelper.pretty(v as any),
        value: v,
    })),

    architect_approval: ArchitectApprovalHelper.values().map(v => ({
        name: ArchitectApprovalHelper.pretty(v as any),
        value: v,
    })),

    accessibility: AccessibilityHelper.values().map(v => ({
        name: AccessibilityHelper.pretty(v as any),
        value: v,
    })),
} as const;

// ===== OPTION BUILDERS =====
export function listOption(required = true) {
    return (o: SlashCommandStringOption) =>
        o.setName("list")
            .setDescription(DESC.list)
            .setAutocomplete(true)
            .setRequired(required);
}

export function tagOption(required = true) {
    return (o: SlashCommandStringOption) =>
        o.setName("tag")
            .setDescription(DESC.tag)
            .setAutocomplete(true)
            .setRequired(required);
}

export function fieldOption() {
    return (o: SlashCommandStringOption) =>
        o.setName("field")
            .setDescription(DESC.field)
            .setRequired(true)
            .addChoices(...filterFieldChoices);
}

export function operatorOption() {
    return (o: SlashCommandStringOption) =>
        o.setName("operator")
            .setDescription(DESC.operator)
            .setRequired(true)
            .addChoices(...filterOperatorChoices);
}

export function valueOption() {
    return (o: SlashCommandStringOption) =>
        o.setName("value")
            .setDescription(DESC.value)
            .setRequired(true)
            .addChoices(
                ...filterValueChoices.type,
                ...filterValueChoices.project_stage,
                ...filterValueChoices.community_vetted,
                ...filterValueChoices.architect_approval,
                ...filterValueChoices.accessibility,
            );
}

export function groupOption() {
    return (o: SlashCommandStringOption) =>
        o.setName("group")
            .setDescription(DESC.group)
            .setRequired(true)
            .addChoices(
                { name: "ALL", value: "all" },
                { name: "ANY", value: "any" }
            );
}