import * as mysql from 'mysql';
import * as async from "async";
import * as fs from 'fs';
import Project from "./Project";
import ProjectStaff from "./ProjectStaff";
import { ProjectStatus } from "./ProjectStatus";
import ProjectLink from "./ProjectLink";
import CrossingGuardBot from './CrossingGuardBot';
import { ChannelType, ForumChannel, PermissionsBitField, ThreadChannel, Emoji, MessageCreateOptions, ChannelFlags, GuildForumThreadCreateOptions, GuildForumThreadMessageCreateOptions, MessageEditOptions } from 'discord.js';

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
        this.connection.query("CREATE TABLE IF NOT EXISTS Projects (project_id INT NOT NULL AUTO_INCREMENT, channel_id VARCHAR(50), guild_id VARCHAR(50), name VARCHAR(50), display_name VARCHAR(50), status INT UNSIGNED NOT NULL, description VARCHAR(2000), ip varchar(30), role_id VARCHAR(50), PRIMARY KEY(project_id, name))");
        this.connection.query("CREATE TABLE IF NOT EXISTS Project_Links (link_id INT UNSIGNED NOT NULL AUTO_INCREMENT, link_name VARCHAR(30), link_url VARCHAR(100), project_id INT REFERENCES projects(project_id), PRIMARY KEY(link_id))");
        this.connection.query("CREATE TABLE IF NOT EXISTS project_staff (user_id VARCHAR(50) NOT NULL, staff_rank INT NOT NULL, project_id INT REFERENCES projects(project_id), PRIMARY KEY (user_id))");
    }


    public getProjectByGuild(guildId: string): Project {
        return null;
    }

    public getProjectByName(projectName): Promise<Project> {
        var database = this;

        return new Promise((resolve) => {
            var project: any = {};

            this.connection.query("SELECT * FROM Projects WHERE name = ?", [projectName], (err, projectData) => {
                if (err) {
                    throw err;
                }

                projectData = projectData[0];
                project.id = projectData["project_id"];
                project.channelId = projectData["channel_id"];
                project.name = projectData["name"];
                project.displayName = projectData["display_name"];
                project.status = +projectData["status"];
                project.description = projectData["description"];
                project.ipString = projectData["ip"];
                project.guildId = projectData["guild_id"];
                project.roleId = projectData["role_id"];
                project.links = [];
                project.staff = [];

                async.parallel([links, staff], function (err, data) {
                    if (err) {
                        throw err;
                    }

                    resolve(new Project(project.id, project.channelId, project.name, project.displayName, project.status, project.description, project.guildId, project.ipString, project.roleId, project.links, project.staff));
                })
            });

            function links(callback) {
                database.connection.query("SELECT * FROM Project_Links WHERE project_id = ?", [project.id], (err, results) => {
                    if (err) {
                        throw err;
                    }

                    results.forEach(link => {
                        project.links.push(new ProjectLink(link["project_id"], link["link_id"], link["link_name"], link["link_url"]));
                    });

                    callback(null);
                });
            }

            function staff(callback) {
                database.connection.query("SELECT * FROM Project_Staff WHERE project_id = ?", [project.id], (err, results) => {
                    if (err) {
                        throw err;
                    }

                    results.forEach(staff => {
                        project.staff.push(new ProjectStaff(staff["project_id"], staff["user_id"], staff["staff_rank"]));
                    });

                    callback(null);
                });
            }
        });
    }

    public getRoleByGuild(guildId: string): string {
        return null;
    }

    public saveProject(project: Project): void {
        this.connection.query("UPDATE projects SET channel_id = ?, guild_id = ?, name = ?, display_name = ?, status = ?, description = ?, ip = ?, role_id = ? WHERE project_id = ?", [project.channelId, project.guildId, project.name, project.displayName, project.status, project.description, project.ip, project.roleId, project.id]);

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
    }


    public addProject(name: string, displayName: string, channelId: string, roleId: string): void {
        this.connection.query("INSERT INTO Projects (name, display_name, channel_id, status, role_id) VALUES (?, ?, ?, ?, ?)", [name, displayName, channelId, ProjectStatus.HIDDEN, roleId]);
    }

    public createNewProject(name: string, displayName: string): void {
        var database = this;
        // Create role and get ID
        CrossingGuardBot.getInstance().guilds.fetch(process.env.GUILD_ID).then(guild => {
            guild.roles.create({
                hoist: true,
                name: displayName
            }).then(role => {
                guild.channels.fetch(process.env.PROJECT_CATEGORY).then(categoryChannel => {
                    guild.channels.create({
                        name: name,
                        type: ChannelType.GuildForum,
                        parent: categoryChannel.id
                    }).then(channel => {
                        database.addProject(name, displayName, channel.id, role.id);

                        database.getProjectByName(name).then(project => {
                            database.updateRole(project);
                            Database.updateChannel(project);
                        });

                    });
                });
            });
        });
    }

    public static updateChannel(project: Project): void {
        var database = this;

        CrossingGuardBot.getInstance().guilds.fetch(process.env.GUILD_ID).then(guild => {
            guild.channels.edit(project.channelId, {
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel]
                    }
                ],
                defaultReactionEmoji: { id: null, name: "😎" }, // CONFIGURE THIS
                name: ProjectStatus.channelIcon(project.status) + project.name,
                availableTags: [
                    { name: "About", moderated: true },
                    { name: "General" },
                    { name: "Announcement", moderated: true },
                    { name: "Review" }
                ],
                topic: `Post anything related to ${project.displayName} here!`
            }).then(function () {
                guild.channels.fetch(project.channelId).then(channel => {
                    (channel as ForumChannel).threads.fetchActive().then(threads => {
                        for (const thread of threads.threads) {
                            if (thread[1].flags.has(ChannelFlags.Pinned)) {
                                thread[1].fetchStarterMessage().then(message => {
                                    message.edit(project.channelMessage as MessageEditOptions);
                                });

                                return;
                            }
                        }

                        (channel as ForumChannel).threads.create({
                            appliedTags: [(channel as ForumChannel).availableTags.filter(tag => tag.name === "About")[0].id],
                            message: project.channelMessage as GuildForumThreadMessageCreateOptions,
                            name: project.displayName,
                        }).then(threadChannel => {
                            threadChannel.pin();
                            threadChannel.setLocked(true);
                        });
                    });
                })
            });
        });
    }

    public updateRole(project: Project): void {
        CrossingGuardBot.getInstance().guilds.fetch(process.env.GUILD_ID).then(guild => {
            guild.roles.edit(project.roleId, { position: 2, name: project.displayName, color: ProjectStatus.roleColor(project.status) });
        });
    }

    public static getInstance(): Database {
        if (Database.instance == null)
            Database.instance = new Database();

        return Database.instance;
    }
}