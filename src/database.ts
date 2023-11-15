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
        var database = this;

        return new Promise((resolve) => {
            this.connection.query("SELECT * FROM Projects WHERE name = ?", [projectName], (err, results, fields) => {
                results = results[0];

                var links = database.getProjectLinks(results["project_id"]);
                var staff = database.getProjectStaff(results["project_id"]);

                resolve(new Project(results["project_id"], results["channel_id"], results["name"], results["display_name"], +results["status"], results["description"], results["guild_id"], results["ip"], results["role_id"], links, staff));
            });
        });
    }

    public getProjectStaff(projectId: number): ProjectStaff[] {
        return [];
    }

    public getProjectLinks(projectId: number): ProjectLink[] {
        return [];
    }

    public getRoleByGuild(guildId: string): string {
        return null;
    }

    public saveProject(project: Project): void {
        this.connection.query("UPDATE projects SET channel_id = ?, name = ?, display_name = ?, status = ?, description = ?, ip = ?, role_id = ? WHERE project_id = ?", [project.channelId, project.name, project.displayName, project.status, project.description, project.ip, project.roleId, project.id]);

        // Deletes any removed links
        if (project.links.length > 0)
            this.connection.query("DELETE FROM project_links WHERE project_id = ? AND link_id NOT IN (" + project.links.map(link => link.linkId).join(", ") + ")", [project.id]);
        else
            this.connection.query("DELETE FROM project_links WHERE project_id = ?", [project.id]);

        project.links.forEach(link => {
            this.connection.query("INSERT INTO project_links VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE link_name = ?, link_url = ?, project_id = ?", [link.linkId, link.linkName, link.linkUrl, link.projectId, link.linkName, link.linkUrl, link.projectId]);
        });

        // Deletes any removed staff
        if (project.staff.length > 0)
            this.connection.query("DELETE FROM project_staff WHERE project_id = ? AND user_id NOT IN (" + project.staff.map(staff => staff.discordUserId).join(", ") + ")", [project.id]);
        else
            this.connection.query("DELETE FROM project_staff WHERE project_id = ?", [project.id]);

        project.staff.forEach(staff => {
            this.connection.query("INSERT INTO project_staff VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE staff_rank = ?", [staff.discordUserId, staff.rank, staff.projectId, staff.rank, staff]);
        });
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