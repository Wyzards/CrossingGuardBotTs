import { CategoryChannel } from 'discord.js';
import * as fs from 'fs';
import Project from "./projects/Project.js";
import { ProjectStaffRank } from "./projects/ProjectStaffRank.js";
import Bot from "../bot/Bot.js";
import { ProjectType } from "./projects/ProjectType.js";
import ProjectLink from "./projects/ProjectLink.js";
import ProjectStaff from "./projects/ProjectStaff.js";
import ProjectAttachment from "./projects/ProjectAttachment.js";
import { ProjectStatus } from "./projects/ProjectStatus.js";
import { Connection, createConnection } from 'mysql';
import async from 'async';
import Result from './Result.js';

export default class Database {

    private static instance: Database;

    private _connection: Connection | null;
    public static CONFIG_PATH = "./config.json";

    constructor() {
        this._connection = null;
        let database = this;

        fs.readFile(Database.CONFIG_PATH, 'utf8', (err, data) => {
            const config = JSON.parse(data);
            database._connection = createConnection({
                host: config["host"],
                user: config["user"],
                password: config["password"],
                database: config["database"],
                charset: "utf8mb4"
            });

            database.makeTables();
        });
    }

    public static getInstance() {
        if (!Database.instance)
            Database.instance = new Database();

        return Database.instance;
    }

    public get connection(): Connection {
        if (!this._connection)
            throw new Error("Database connection was never set!");
        return this._connection;
    }

    private makeTables(): void {
        if (!this.connection)
            throw new Error("Database connection was null upon making tables");

        this.connection.query("CREATE TABLE IF NOT EXISTS Projects (project_id INT NOT NULL AUTO_INCREMENT, channel_id VARCHAR(50), guild_id VARCHAR(50), emoji VARCHAR(50), name VARCHAR(50), display_name VARCHAR(50), status INT UNSIGNED NOT NULL, description VARCHAR(2000), ip varchar(100), role_id VARCHAR(50), type VARCHAR(10), deleted BOOLEAN DEFAULT false, PRIMARY KEY(project_id, name)) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Links (link_id INT UNSIGNED NOT NULL AUTO_INCREMENT, link_name VARCHAR(30), link_url VARCHAR(100), project_id INT REFERENCES Projects(project_id), PRIMARY KEY(link_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Staff (user_id VARCHAR(50) NOT NULL, staff_rank INT NOT NULL, project_id INT REFERENCES Projects(project_id), PRIMARY KEY (user_id, project_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Attachments (project_id INT REFERENCES Projects(project_id), attachment_id INT NOT NULL AUTO_INCREMENT, url VARCHAR(1000) NOT NULL, PRIMARY KEY (attachment_id));");
    }

    public static guildBelongsToProject(guildId: string): Promise<boolean> {
        return new Promise(resolve => {
            Database.getInstance().connection.query("SELECT count(*) as count FROM Projects WHERE guild_id = ?", [guildId], (err: any, results: { [x: string]: number; }[]) => {
                if (err)
                    throw err;

                resolve(results[0]["count"] > 0);
            });
        });
    }

    public static getProjectByGuild(guildId: string): Promise<Result<Project>> {
        return Database.getProject("SELECT * FROM Projects WHERE guild_id = ?", [guildId]);
    }

    public static getProjectByName(projectName: string): Promise<Result<Project>> {
        const query = `
        SELECT * FROM Projects 
        WHERE name = ? 
        OR display_name = ? 
        ORDER BY CASE WHEN name = ? THEN 0 ELSE 1 END 
        LIMIT 1
    `;

        return Database.getProject(query, [projectName, projectName, projectName]);
    }

    public static async updateStaffRoles(discordUserId: string) {
        const guild = await Bot.getInstance().guild;
        const member = await guild.members.fetch(discordUserId);
        const projectList = await Database.projectList();

        var isStaff = false;

        for (let project of projectList) {
            for (let staff of project.staff) {
                if (staff.discordUserId === discordUserId) {
                    var doReturn = false;
                    if (staff.rank === ProjectStaffRank.LEAD) {
                        await member.roles.add(Bot.LEAD_ROLE_ID);
                        doReturn = true;
                    }

                    await member.roles.add(Bot.STAFF_ROLE_ID);
                    isStaff = true;

                    if (doReturn)
                        return;
                }
            }
        }

        if (!isStaff) {
            await member.roles.remove(Bot.LEAD_ROLE_ID);
            await member.roles.remove(Bot.STAFF_ROLE_ID);
        }
    }

    public static projectList(): Promise<Project[]> {
        return new Promise(async (resolve) => {
            Database.getInstance().connection.query("SELECT name FROM Projects WHERE NOT deleted", async (err: any, results: { name: string; }[]) => {
                if (err) {
                    throw err;
                }

                const allResults = await Promise.all(results.map(async (projectName: { name: string }) => {
                    return (await Database.getProjectByName(projectName["name"])).result;
                }));

                resolve(allResults as Project[]);
            });
        });
    }

    private static getProject(query: string, identifiers: string[]): Promise<Result<Project>> {
        const database = Database.getInstance();

        return new Promise((resolve) => {
            database.connection.query(query, identifiers, (err: any, projectResult: string | any[] | null) => {
                if (err)
                    throw err;

                if (projectResult == null || projectResult.length == 0) {
                    resolve(new Result<Project>(null, false));
                    return;
                }

                const projectData = projectResult[0];

                var emojiString: string = projectData["emoji"];
                var project: any = {};
                project.id = projectData["project_id"];
                project.channelId = projectData["channel_id"];
                project.name = projectData["name"];
                project.displayName = projectData["display_name"];
                project.status = +projectData["status"];
                project.description = projectData["description"];
                project.ipString = projectData["ip"];
                project.guildId = projectData["guild_id"];
                project.emoji = Project.parseEmojiString(emojiString);
                project.roleId = projectData["role_id"];
                project.links = [];
                project.staff = [];
                project.attachments = [];
                project.type = ProjectType[projectData["type"] as keyof typeof ProjectType];

                async.parallel([links, staff, attachments], function (err: any) {
                    if (err)
                        throw err;

                    resolve(new Result(new Project(project.id, project.channelId, project.name, project.displayName, project.status, project.description, project.guildId, project.emoji, project.ipString, project.roleId, project.links, project.staff, project.attachments, project.type), true));
                });

                function links(callback: Function) {
                    database.connection.query("SELECT * FROM Project_Links WHERE project_id = ?", [project.id], (err: any, results: { project_id: number; link_id: number; link_name: string; link_url: string; }[]) => {
                        if (err) {
                            throw err;
                        }

                        results.forEach((link: { project_id: number, link_id: number, link_name: string, link_url: string }) => {
                            project.links.push(new ProjectLink(link["project_id"], link["link_id"], link["link_name"], link["link_url"]));
                        });

                        callback(null);
                    });
                }

                function staff(callback: Function) {
                    database.connection.query("SELECT * FROM Project_Staff WHERE project_id = ?", [project.id], (err: any, results: { project_id: number; user_id: string; staff_rank: ProjectStaffRank; }[]) => {
                        if (err) {
                            throw err;
                        }

                        results.forEach((staff: { project_id: number, user_id: string, staff_rank: ProjectStaffRank }) => {
                            project.staff.push(new ProjectStaff(staff["project_id"], staff["user_id"], staff["staff_rank"]));
                        });

                        callback(null);
                    });
                }

                function attachments(callback: Function) {
                    database.connection.query("SELECT * FROM Project_Attachments WHERE project_id = ?", [project.id], (err: any, results: { project_id: number; attachment_id: number; url: string; }[]) => {
                        if (err) {
                            throw err;
                        }

                        results.forEach((attachment: { project_id: number, attachment_id: number, url: string }) => {
                            project.attachments.push(new ProjectAttachment(attachment["project_id"], attachment["attachment_id"], attachment["url"]));
                        });

                        callback(null);
                    });
                }
            });
        });
    }

    public static async addProject(name: string, displayName: string, channelId: string | null, roleId: string, type: ProjectType): Promise<Project> {
        Database.getInstance().connection.query(`INSERT INTO Projects (name, display_name, channel_id, status, role_id, type) VALUES (?, ?, ?, ?, ?, ?)`, [name, displayName, channelId, ProjectStatus.HIDDEN, roleId, type]);

        const project = (await Database.getProjectByName(name)).result;

        if (project == null)
            throw new Error("Unexpectedly unable to create a new project");

        await project.updateView()

        return project;
    }


    public static async createNewProject(name: string, displayName: string, type: ProjectType): Promise<Project> {
        const guild = await Bot.getInstance().guild;
        const role = await guild.roles.create({
            hoist: true,
            name: displayName
        });
        const category = await guild.channels.fetch(Bot.PROJECT_CATEGORY_ID) as CategoryChannel;

        if (!category)
            throw new Error(`Category channel does not exist`);


        if (type == ProjectType.MAP) {
            var project = await Database.addProject(name, displayName, null, role.id, type);
        } else {
            const channel = await Project.makeBlankChannel(name, category);
            var project = await Database.addProject(name, displayName, channel.id, role.id, type);
        }

        return project;
    }

    public static async projectExists(name: string): Promise<boolean> {
        return (await Database.getProjectByName(name)).exists;
    }
}