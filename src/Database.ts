import * as async from "async";
import { ChannelType } from 'discord.js';
import * as fs from 'fs';
import * as mysql from 'mysql';
import CrossingGuardBot from './CrossingGuardBot';
import Project from "./Project";
import ProjectAttachment from './ProjectAttachment';
import ProjectLink from "./ProjectLink";
import ProjectStaff from "./ProjectStaff";
import { ProjectStaffRank } from './ProjectStaffRank';
import { ProjectStatus } from "./ProjectStatus";

export default class Database {

    public static CONFIG_PATH = "./test_config.json";
    private _connection: mysql.Connection | null;

    public constructor() {
        this._connection = null;
        let database = this;

        fs.readFile(Database.CONFIG_PATH, 'utf8', (err, data) => {
            const config = JSON.parse(data);
            database._connection = mysql.createConnection({
                host: config["host"],
                user: config["user"],
                password: config["password"],
                database: config["database"]
            });

            database.makeTables();
        });
    }

    public get connection(): mysql.Connection {
        if (!this._connection)
            throw new Error("Database connection was never set!");
        return this._connection;
    }

    private makeTables(): void {
        if (!this.connection)
            throw new Error("Database connection was null upon making tables");

        this.connection.query("CREATE TABLE IF NOT EXISTS Projects (project_id INT NOT NULL AUTO_INCREMENT, channel_id VARCHAR(50), guild_id VARCHAR(50), emoji VARCHAR(50), name VARCHAR(50), display_name VARCHAR(50), status INT UNSIGNED NOT NULL, description VARCHAR(2000), ip varchar(30), role_id VARCHAR(50), PRIMARY KEY(project_id, name))");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Links (link_id INT UNSIGNED NOT NULL AUTO_INCREMENT, link_name VARCHAR(30), link_url VARCHAR(100), project_id INT REFERENCES projects(project_id), PRIMARY KEY(link_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS project_staff (user_id VARCHAR(50) NOT NULL, staff_rank INT NOT NULL, project_id INT REFERENCES projects(project_id), PRIMARY KEY (user_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS project_attachments (project_id INT REFERENCES projects(project_id), attachment_id INT NOT NULL AUTO_INCREMENT, url VARCHAR(1000) NOT NULL, PRIMARY KEY (attachment_id));");
    }


    public getProjectByGuild(guildId: string): Promise<Project> {
        return this.getProject("SELECT * FROM Projects WHERE guild_id = ?", guildId);
    }

    public getProjectByName(projectName: string): Promise<Project> {
        return this.getProject("SELECT * FROM Projects WHERE name = ?", projectName);
    }

    public updateStaffRoles(discordUserId: string) {
        var database = this;


        CrossingGuardBot.getInstance().guild.then(guild => {
            guild.members.fetch(discordUserId).then(member => {
                var isStaff = false;

                database.projectList().then(projectList => {
                    for (let project of projectList) {
                        for (let staff of project.staff) {
                            if (staff.discordUserId === discordUserId) {
                                var doReturn = false;
                                if (staff.rank === ProjectStaffRank.LEAD) {
                                    member.roles.add(CrossingGuardBot.LEAD_ROLE);
                                    doReturn = true;
                                }

                                member.roles.add(CrossingGuardBot.STAFF_ROLE);
                                isStaff = true;

                                if (doReturn)
                                    return;
                            }
                        }
                    }
                });

                if (!isStaff) {
                    member.roles.remove(CrossingGuardBot.LEAD_ROLE);
                    member.roles.remove(CrossingGuardBot.STAFF_ROLE);
                }
            });
        });
    }

    public projectList(): Promise<Project[]> {
        var database = this;

        return new Promise((resolve) => {
            database.connection.query("SELECT name FROM projects", (err, results) => {
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

    private getProject(query: string, identifier: string): Promise<Project> {
        var database = this;

        return new Promise((resolve) => {
            database.connection.query(query, [identifier], (err, projectData) => {
                if (err) {
                    throw err;
                }

                if (projectData == null || projectData.length == 0) {
                    throw new Error(`Could not find a project with the identifier "${identifier}"`);
                }


                projectData = projectData[0];
                var emojiString: string = (projectData["emoji"] != null && isNaN(+projectData["emoji"])) ? emojiString = Buffer.from(projectData["emoji"], "utf16le").toString("utf-8") : emojiString = projectData["emoji"];
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
        var projectQuery = `UPDATE projects SET channel_id = ?, guild_id = ?, emoji = ${(project.emoji != null && project.emoji.name) != null ? "_utf16le?" : "?"}, name = ?, display_name = ?, status = ?, description = ?, ip = ?, role_id = ? WHERE project_id = ?`;
        this.connection.query(projectQuery, [project.channelId, project.guildId, project.emojiString, project.name, project.displayName, project.status, project.description, project.ip, project.roleId, project.id]);

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
            this.connection.query("INSERT INTO project_staff VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE staff_rank = ?", [staff.discordUserId, staff.rank, staff.projectId, staff.rank]);
        });

        // Deletes any removed attachments
        if (project.attachments.length > 0)
            this.connection.query("DELETE FROM project_attachments WHERE project_id = ? AND attachment_id NOT IN (" + project.attachments.map(attachment => attachment.id).join(", ") + ")", [project.id]);
        else
            this.connection.query("DELETE FROM project_attachments WHERE project_id = ?", [project.id]);

        project.attachments.forEach(attachment => {
            this.connection.query("INSERT INTO project_attachments VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE url = ?", [attachment.projectId, attachment.id, attachment.url, attachment.url]);
        });

        project.updateView();
    }


    public addProject(name: string, displayName: string, channelId: string, roleId: string): void {
        this.connection.query("INSERT INTO Projects (name, display_name, channel_id, status, role_id) VALUES (?, ?, ?, ?, ?)", [name, displayName, channelId, ProjectStatus.HIDDEN, roleId]);

        this.getProjectByName(name).then(project => project.updateView());
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
                        parent: categoryChannel.id
                    }).then(channel => database.addProject(name, displayName, channel.id, role.id))
                });
            });
        });
    }
}