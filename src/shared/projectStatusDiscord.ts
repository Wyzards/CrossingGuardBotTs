import { ColorResolvable } from "discord.js";
import { ProjectStage } from "@wyzards/crossroadsclientts/dist/projects/types.js";

export const ProjectStageDiscordMeta: Record<ProjectStage, {
    roleColor: ColorResolvable;
    channelIcon: string;
}> = {
    [ProjectStage.RELEASED]: { roleColor: "Green", channelIcon: "🟢" },
    [ProjectStage.ALPHA]: { roleColor: "Green", channelIcon: "🟢" },
    [ProjectStage.BETA]: { roleColor: "Green", channelIcon: "🟢" },
    [ProjectStage.IN_DEVELOPMENT]: { roleColor: "Blue", channelIcon: "🔵" },
    [ProjectStage.CLOSED]: { roleColor: "Red", channelIcon: "🔴" },
};
