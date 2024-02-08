import * as async from "async";
import { ChannelType } from 'discord.js';
import * as fs from 'fs';
import * as mysql from 'mysql';
import CrossingGuardBot from "../bot/CrossingGuardBot";
import Project from "./projects/Project";
import ProjectAttachment from './projects/ProjectAttachment';
import ProjectLink from "./projects/ProjectLink";
import ProjectStaff from "./projects/ProjectStaff";
import { ProjectStaffRank } from './projects/ProjectStaffRank';
import { ProjectStatus } from "./projects/ProjectStatus";

export default class Database {

    private static instance: Database;

    private _connection: mysql.Connection | null;
    public static CONFIG_PATH = "./config.json";

    constructor() {
        this._connection = null;
        let database = this;

        fs.readFile(Database.CONFIG_PATH, 'utf8', (err, data) => {
            const config = JSON.parse(data);
            database._connection = mysql.createConnection({
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

    public get connection(): mysql.Connection {
        if (!this._connection)
            throw new Error("Database connection was never set!");
        return this._connection;
    }

    private makeTables(): void {
        if (!this.connection)
            throw new Error("Database connection was null upon making tables");

        this.connection.query("CREATE TABLE IF NOT EXISTS Projects (project_id INT NOT NULL AUTO_INCREMENT, channel_id VARCHAR(50), guild_id VARCHAR(50), emoji VARCHAR(50), name VARCHAR(50), display_name VARCHAR(50), status INT UNSIGNED NOT NULL, description VARCHAR(2000), ip varchar(100), role_id VARCHAR(50), PRIMARY KEY(project_id, name)) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Links (link_id INT UNSIGNED NOT NULL AUTO_INCREMENT, link_name VARCHAR(30), link_url VARCHAR(100), project_id INT REFERENCES Projects(project_id), PRIMARY KEY(link_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Staff (user_id VARCHAR(50) NOT NULL, staff_rank INT NOT NULL, project_id INT REFERENCES Projects(project_id), PRIMARY KEY (user_id, project_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Attachments (project_id INT REFERENCES Projects(project_id), attachment_id INT NOT NULL AUTO_INCREMENT, url VARCHAR(1000) NOT NULL, PRIMARY KEY (attachment_id));");
    }


    public getProjectByGuild(guildId: string): Promise<Project | null> {
        return this.getProject("SELECT * FROM Projects WHERE guild_id = ?", guildId);
    }

    public getProjectByName(projectName: string): Promise<Project | null> {
        return this.getProject("SELECT * FROM Projects WHERE name = ?", projectName);
    }

    public setName(project: Project, newName: string) {
        project.name = newName;
        this.saveProject(project);
    }

    public setDisplayName(project: Project, displayName: string) {
        project.displayName = displayName;
        this.saveProject(project);
    }

    public async deleteProject(project: Project) {
        const guild = await CrossingGuardBot.getInstance().guilds.fetch(CrossingGuardBot.GUILD_ID);
        const members = await guild.members.fetch();

        this.connection.query("SELECT * FROM Project_Staff", (err, data) => {
            for (const staff of project.staff) {
                var rank = null;

                for (const row of data) {
                    // If is same project, ignore
                    // Else if is same userId and head, cache head and break
                    // If just staff, cache staff and keep going
                    if (row["project_id"] == staff.projectId)
                        continue;

                    if (row["user_id"] == staff.discordUserId)
                        if (+row["staff_rank"] == ProjectStaffRank.LEAD) {
                            rank = ProjectStaffRank.LEAD;
                            break;
                        } else
                            rank = +row["staff_rank"];
                }

                if (rank == null) {
                    // Take roles
                    members.get(staff.discordUserId)?.roles.remove(CrossingGuardBot.LEAD_ROLE_ID);
                    members.get(staff.discordUserId)?.roles.remove(CrossingGuardBot.STAFF_ROLE_ID);
                } else {
                    // If staff, give staff only
                    // If lead, give staff and lead
                    if (rank == ProjectStaffRank.LEAD)
                        members.get(staff.discordUserId)?.roles.add(CrossingGuardBot.LEAD_ROLE_ID);
                    members.get(staff.discordUserId)?.roles.add(CrossingGuardBot.STAFF_ROLE_ID);
                }
            }
        })

        guild.channels.fetch(project.channelId).then(channel => {
            channel?.delete();
        });

        guild.roles.fetch(project.roleId).then(role => {
            role?.delete();
        });

        this.connection.query("DELETE FROM Project_Staff WHERE project_id = ?", [project.id])
        this.connection.query("DELETE FROM Project_Links WHERE project_id = ?", [project.id])
        this.connection.query("DELETE FROM Project_Attachments WHERE project_id = ?", [project.id])
        this.connection.query("DELETE FROM Projects WHERE project_id = ?", [project.id]);
    }

    public async updateStaffRoles(discordUserId: string) {
        var database = this;
        var guild = await CrossingGuardBot.getInstance().guild;
        var member = await guild.members.fetch(discordUserId);
        var projectList = await database.projectList();

        var isStaff = false;

        for (let project of projectList) {
            for (let staff of project.staff) {
                if (staff.discordUserId === discordUserId) {
                    var doReturn = false;
                    if (staff.rank === ProjectStaffRank.LEAD) {
                        await member.roles.add(CrossingGuardBot.LEAD_ROLE_ID);
                        doReturn = true;
                    }

                    await member.roles.add(CrossingGuardBot.STAFF_ROLE_ID);
                    isStaff = true;

                    if (doReturn)
                        return;
                }
            }
        }

        if (!isStaff) {
            await member.roles.remove(CrossingGuardBot.LEAD_ROLE_ID);
            await member.roles.remove(CrossingGuardBot.STAFF_ROLE_ID);
        }
    }

    public projectList(): Promise<Project[]> {
        var database = this;

        return new Promise((resolve) => {
            database.connection.query("SELECT name FROM Projects", (err, results) => {
                if (err) {
                    throw err;
                }

                Promise.all(results.map((projectName: { name: string }) => {
                    return new Promise(resolve => {
                        database.getProjectByName(projectName["name"]).then(project => {
                            resolve(project);
                        });
                    });
                })).then(results => {
                    resolve(results as Project[]);
                });
            });
        });
    }

    private getProject(query: string, identifier: string): Promise<Project | null> {
        var database = this;

        return new Promise((resolve) => {
            database.connection.query(query, [identifier], (err, projectData) => {
                if (err) {
                    throw err;
                }

                if (projectData == null || projectData.length == 0) {
                    resolve(null);
                    return;
                }


                projectData = projectData[0];
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

                async.parallel([links, staff, attachments], function (err) {
                    if (err) {
                        throw err;
                    }

                    resolve(new Project(project.id, project.channelId, project.name, project.displayName, project.status, project.description, project.guildId, project.emoji, project.ipString, project.roleId, project.links, project.staff, project.attachments));
                });

                function links(callback: Function) {
                    database.connection.query("SELECT * FROM Project_Links WHERE project_id = ?", [project.id], (err, results) => {
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
                    database.connection.query("SELECT * FROM Project_Staff WHERE project_id = ?", [project.id], (err, results) => {
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
                    database.connection.query("SELECT * FROM Project_Attachments WHERE project_id = ?", [project.id], (err, results) => {
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

    public saveProject(project: Project): void {
        var projectQuery = `UPDATE Projects SET channel_id = ?, guild_id = ?, emoji = ?, name = ?, display_name = ?, status = ?, description = ?, ip = ?, role_id = ? WHERE project_id = ?`;
        this.connection.query(projectQuery, [project.channelId, project.guildId, project.emojiString, project.name, project.displayName, project.status, project.description, project.ip, project.roleId, project.id]);

        // Deletes any removed links
        if (project.links.length > 0)
            this.connection.query("DELETE FROM Project_Links WHERE project_id = ? AND link_id NOT IN (" + project.links.map(link => link.linkId).join(", ") + ")", [project.id]);
        else
            this.connection.query("DELETE FROM Project_Links WHERE project_id = ?", [project.id]);

        project.links.forEach(link => {
            this.connection.query("INSERT INTO Project_Links VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE link_name = ?, link_url = ?, project_id = ?", [link.linkId, link.linkName, link.linkUrl, link.projectId, link.linkName, link.linkUrl, link.projectId]);
        });

        // Deletes any removed staff
        if (project.staff.length > 0)
            this.connection.query("DELETE FROM Project_Staff WHERE project_id = ? AND user_id NOT IN (" + project.staff.map(staff => staff.discordUserId).join(", ") + ")", [project.id]);
        else
            this.connection.query("DELETE FROM Project_Staff WHERE project_id = ?", [project.id]);

        project.staff.forEach(staff => {
            this.connection.query("INSERT INTO Project_Staff VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE staff_rank = ?", [staff.discordUserId, staff.rank, staff.projectId, staff.rank]);
        });

        // Deletes any removed attachments
        if (project.attachments.length > 0)
            this.connection.query("DELETE FROM Project_Attachments WHERE project_id = ? AND attachment_id NOT IN (" + project.attachments.map(attachment => attachment.id).join(", ") + ")", [project.id]);
        else
            this.connection.query("DELETE FROM Project_Attachments WHERE project_id = ?", [project.id]);

        project.attachments.forEach(attachment => {
            this.connection.query("INSERT INTO Project_Attachments VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE url = ?", [attachment.projectId, attachment.id, attachment.url, attachment.url]);
        });

        project.updateView();
    }


    public addProject(name: string, displayName: string, channelId: string, roleId: string): void {
        this.connection.query("INSERT INTO Projects (name, display_name, channel_id, status, role_id) VALUES (?, ?, ?, ?, ?)", [name, displayName, channelId, ProjectStatus.HIDDEN, roleId]);
        this.getProjectByName(name).then(project => { if (project) project.updateView() });
    }

    public createNewProject(name: string, displayName: string): void {
        var database = this;
        CrossingGuardBot.getInstance().guild.then(guild => {
            guild.roles.create({
                hoist: true,
                name: displayName
            }).then(role => {
                guild.channels.fetch(CrossingGuardBot.PROJECT_CATEGORY_ID).then(categoryChannel => {
                    if (!categoryChannel)
                        throw new Error(`Category channel with ID=${CrossingGuardBot.PROJECT_CATEGORY_ID} does not exist`);

                    guild.channels.create({
                        name: name,
                        type: ChannelType.GuildForum,
                        parent: categoryChannel.id,
                        availableTags: [
                            { name: "About", moderated: true },
                            { name: "General" },
                            { name: "Announcement", moderated: true },
                            { name: "Review" }
                        ]
                    }).then(channel => database.addProject(name, displayName, channel.id, role.id))
                });
            });
        });
    }
}