import { ColorResolvable } from "discord.js";
import Result from "../Result.js";

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

    export function discoveryTag(status: ProjectStatus): Result<string> {
        switch (status) {
            case ProjectStatus.PLAYABLE:
                return new Result("Playable", true);
            case ProjectStatus.IN_DEVELOPMENT:
                return new Result("In Development", true);
            default:
                return new Result<string>(null, false);
        }
    }
}

export { ProjectStatus };
