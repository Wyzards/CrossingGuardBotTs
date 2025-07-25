import Result from "../Result.js";

enum ProjectType {

    MMO = "MMO",
    SMP = "SMP",
    MAP = "MAP",
    RPG = "RPG",
    OTHER = "Other"

}

namespace ProjectType {
    export function prettyName(type: ProjectType): Result<string> {
        switch (type) {
            case ProjectType.MMO:
                return new Result("MMO", true);
            case ProjectType.SMP:
                return new Result("SMP", true);
            case ProjectType.MAP:
                return new Result("Map", true);
            case ProjectType.RPG:
                return new Result("RPG", true);
            case ProjectType.OTHER:
                return new Result("Other", true);
            default:
                return new Result<string>(null, false);
        }
    }

    export function fromString(type: string): Result<ProjectType> {
        switch (type) {
            case "MMO":
                return new Result(ProjectType.MMO, true);
            case "SMP":
                return new Result(ProjectType.SMP, true);
            case "MAP":
                return new Result(ProjectType.MAP, true);
            case "RPG":
                return new Result(ProjectType.RPG, true);
            case "Other":
                return new Result(ProjectType.OTHER, true);
            default: return new Result<ProjectType>(null, false);
        }
    }
}

export { ProjectType };
