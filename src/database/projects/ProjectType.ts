import Result from "../Result";

enum ProjectType {

    MMO = "MMO",
    SMP = "SMP",
    MAP = "MAP"

}

namespace ProjectType {
    export function discoveryTag(type: ProjectType): Result<string> {
        switch (type) {
            case ProjectType.MMO:
                return new Result("MMO", true);
            case ProjectType.SMP:
                return new Result("SMP", true);
            case ProjectType.MAP:
                return new Result("Map", true);
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
            default: return new Result<ProjectType>(null, false);
        }
    }
}

export { ProjectType };
