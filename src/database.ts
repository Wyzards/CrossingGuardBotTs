import * as mysql from 'mysql';
import * as fs from 'fs';
import Project from "./Project.js";
import ProjectStaff from "./ProjectStaff.js";
import { ProjectStatus } from "./ProjectStatus.js";

export default class Database {

    private static instance: Database = null;
    public static CONFIG_PATH = "./test_config.json";
    private connection = null;

    public constructor() {
        var database = this;

        fs.readFile(Database.CONFIG_PATH, 'utf8', (err, data) => {
            const config = JSON.parse(data);

            this.connection = mysql.createConnection({
                host: config["host"],
                user: config["user"],
                password: config["password"],
                database: config["database"]
            });

            database.makeTables();
        });
    }

    private makeTables(): void {
        this.connection.query("CREATE TABLE IF NOT EXISTS Projects (project_id INT NOT NULL AUTO_INCREMENT, channel_id VARCHAR(50), guild_id VARCHAR(50), name VARCHAR(50), display_name VARCHAR(50), status INT UNSIGNED NOT NULL, description VARCHAR(2000), ip varchar(30), role_id VARCHAR(50), PRIMARY KEY(project_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Links (link_id INT UNSIGNED NOT NULL AUTO_INCREMENT, link_name VARCHAR(30), link_url VARCHAR(100), project_id INT REFERENCES projects(project_id), PRIMARY KEY(link_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS project_staff (user_id INT NOT NULL AUTO_INCREMENT, staff_rank INT NOT NULL, project_id INT REFERENCES projects(project_id), PRIMARY KEY (user_id))");
    }


    public getProjectByGuild(guildId: string): Project {
        return null;
    }

    public getProjectById(projectId: number): Project {
        return null;
    }

    public getProjectByName(projectName): Promise<Project> {
        return this.connection.query("SELECT * FROM Projects WHERE name = ?", [projectName], (error, results, fields) => {
            results = results[0];

            var links = [];
            var staff = [];

            var project = new Project(results["project_id"], results["channel_id"], results["name"], results["display_name"], +results["status"], results["description"], results["guild_id"], results["ip"], results["role_id"], links, staff);

            console.log(JSON.stringify(project));
        });
    }

    public getProjectStaff(projectId: number): ProjectStaff[] {
        return null;
    }

    public getProjectLinks(projectId: number): ProjectLink[] {
        return null;
    }

    public getRoleByGuild(guildId: string): string {
        return null;
    }


    public createNewProject(name: string, displayName: string): void {
        this.connection.query("INSERT INTO Projects (name, display_name, status) VALUES (?, ?, ?)", [name, displayName, ProjectStatus.HIDDEN]);
    }

    public static getInstance(): Database {
        if (Database.instance == null)
            Database.instance = new Database();

        return Database.instance;
    }
}