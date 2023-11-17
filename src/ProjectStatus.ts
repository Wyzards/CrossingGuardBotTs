import { ColorResolvable, Emoji } from "discord.js";

enum ProjectStatus {
    PLAYABLE = 0,
    IN_DEVELOPMENT = 1,
    ARCHIVED = 2,
    HONORABLE_MENTION = 3,
    HIDDEN = 4,
}

namespace ProjectStatus {
    export function roleColor(status: ProjectStatus): ColorResolvable {
        switch (status) {
            case ProjectStatus.PLAYABLE:
                return "Green";
            case ProjectStatus.IN_DEVELOPMENT:
                return "Blue";
            case ProjectStatus.ARCHIVED:
                return "Red";
            default:
                return "NotQuiteBlack";
        }
    }

    export function channelIcon(status: ProjectStatus): string {
        switch (status) {
            case ProjectStatus.PLAYABLE:
                return "🟢";
            case ProjectStatus.IN_DEVELOPMENT:
                return "🔵";
            case ProjectStatus.ARCHIVED:
                return "🔴";
            default:
                return "⚫";
        }
    }
}

export { ProjectStatus };