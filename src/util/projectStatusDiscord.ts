import { ColorResolvable } from "discord.js";
import { ProjectStatus } from "@wyzards/crossroadsclientts/dist/projects/types.js";

export const ProjectStatusDiscordMeta: Record<ProjectStatus, {
    roleColor: ColorResolvable;
    channelIcon: string;
}> = {
    [ProjectStatus.PLAYABLE]: { roleColor: "Green", channelIcon: "🟢" },
    [ProjectStatus.IN_DEVELOPMENT]: { roleColor: "Blue", channelIcon: "🔵" },
    [ProjectStatus.ARCHIVED]: { roleColor: "Red", channelIcon: "🔴" },
    [ProjectStatus.HIDDEN]: { roleColor: "NotQuiteBlack", channelIcon: "⚫" },
};
