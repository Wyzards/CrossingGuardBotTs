import Project from "../../domain/project/Project.js";


export class ProjectDiscordService {
    private static _instance: ProjectService;
    constructor(
        public readonly repo: ProjectRepository,
    ) { }

    async updateStaffRoles(discordUserId: string) {
        const guild = await Bot.getInstance().guild;
        const member = await guild.members.fetch(discordUserId);
        const projectList = await this.repo.list();

        var isStaff = false;

        for (let project of projectList) {
            for (let staff of project.staff) {
                if (staff.user.discordId === discordUserId) {
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

    async createProjectRole(displayName: string, stage: ProjectStage) {
        const guild = await Bot.getInstance().guild;
        const role = await guild.roles.create(this.getRoleSettings(displayName, stage));

        return role;
    }

    getRoleSettings(displayName: string, stage: ProjectStage) {
        return {
            position: 2,
            hoist: true,
            name: displayName,
            color: ProjectStageDiscordMeta[stage].roleColor
        }
    }

    async sync(project: Project, updateChannel: boolean, reporter?: IOperationReporter) {
        const guild = await Bot.getInstance().guild;
        const role = this.roleId ? await guild.roles.fetch(this.roleId).catch(() => null) : null;

        if (!role) {
            const rolePromise = ProjectService.getInstance().createProjectRole(this.displayName, this.stage);
            await reporter?.track('Project role not found, creating a new one', rolePromise);
            const newRole = await rolePromise;

            this.roleId = newRole.id;
            await ProjectService.getInstance().save(this, false, reporter);
        } else {
            await role.edit(ProjectService.getInstance().getRoleSettings(this.displayName, this.stage));
        }

        if (updateChannel)
            await this.updateOrCreateChannel(reporter);
        await this.updateDiscovery();
        await this.updateMapsThread(); // If not a map, will delete a matching maps thread then do nothing
    }

    async ensureChannel(reporter?: IOperationReporter) {
        const guild = await Bot.getInstance().guild;
        const channelResult = await this.getChannel();
        var projectChannel: ForumChannel;

        if (channelResult.exists) {
            projectChannel = channelResult.result;

            if (this.type == ProjectType.MAP) {
                await track(reporter, 'Deleting project channel', projectChannel.delete());
                this.channelId = null;
                await track(reporter, 'Saving project', ProjectService.getInstance().save(this, false));
                return;
            }
        } else {
            if (this.type == ProjectType.MAP)
                return;

            const category = await guild.channels.fetch(Bot.PROJECT_CATEGORY_ID) as CategoryChannel;
            projectChannel = await track(reporter, 'Creating project channel', guild.channels.create({
                name: this.name,
                type: ChannelType.GuildForum,
                parent: category.id,
                availableTags: []
            }));
            this.channelId = projectChannel.id;
            await track(reporter, 'Saving project', ProjectService.getInstance().save(this, false));
        }

        const availableTags = await this.getAvailableChannelTags();
        const defaultReactionEmoji = this.emoji == null ? { id: null, name: "⚔️" } : this.emoji;
        const name = ProjectStageDiscordMeta[this.stage].channelIcon + "｜" + this.name;
        const topic = `Post anything related to ${this.displayName} here!`
        const permissionOverwrites =
            this.isInMainList() ?
                [{
                    id: guild.roles.everyone.id,
                    deny: [PermissionsBitField.Flags.ViewChannel]
                },
                {
                    id: Bot.INTAKE_ROLE_ID,
                    allow: [PermissionsBitField.Flags.ViewChannel]
                }]
                :
                [];

        await track(reporter, 'Updating project display... May take up to 15 minutes. You can dismiss this message and it will still complete.', projectChannel.edit({
            availableTags,
            permissionOverwrites: permissionOverwrites,
            defaultReactionEmoji: defaultReactionEmoji,
            name: name,
            topic: topic
        }));

        // turn on watch for autodist and make all async commands defereply

        const pinnedThreadResult = await Project.getPinnedInForum(projectChannel);

        if (pinnedThreadResult.exists) {
            const thread = pinnedThreadResult.result;
            const threadName = this.threadName;

            if (thread.name == threadName) {
                const starterMessage = await thread.fetchStarterMessage();
                const messages = await thread.messages.fetch();

                if (starterMessage) {
                    const starterMessageContent = await this.getStarterMessage();
                    await track(reporter, 'Editing project channel thread', starterMessage.edit(starterMessageContent));
                    // Doesnt delete the actual message, just removes it from the collection
                    messages.delete(starterMessage.id);
                }

                for (const message of messages.values())
                    if (!message.system)
                        await thread.messages.delete(message);

                await track(reporter, 'Sending project channel thread message', this.sendChannelMessage(thread));
                await track(reporter, 'Setting project channel thread tags', thread.setAppliedTags(await this.getTagsForPinnedChannelThread()));

                return;
            }

            thread.delete();
        }

        // Creating pinned thread if it doesn't already exist
        const starterMessage = (await this.getStarterMessage()) as GuildForumThreadMessageCreateOptions;
        const tags = await this.getTagsForPinnedChannelThread();
        const thread = await projectChannel.threads.create({
            appliedTags: tags,
            message: starterMessage,
            name: this.threadName,
        });

        const pin = track(reporter, 'Pinning project channel thread', thread.pin());
        const lock = track(reporter, 'Locking project channel thread', thread.setLocked(true));
        const send = track(reporter, 'Sending project channel thread message', this.sendChannelMessage(thread));

        await Promise.all([pin, lock, send]);
    }

    async syncDiscovery() {
        if (!this.isInMainList()) {
            if (this.discoveryThreadId) {
                const thread = await this.getDiscoveryThread();
                await thread.result.delete();

                this.discoveryThreadId = null;
                await ProjectService.getInstance().save(this, false);
            }

            return;
        }

        var discoveryThread;
        const discoveryThreadResult = await this.getDiscoveryThread();

        if (discoveryThreadResult.exists) {
            discoveryThread = discoveryThreadResult.result;

            if (discoveryThread.name === this.discoveryChannelName)
                await discoveryThread.edit({ appliedTags: await this.getDiscoveryThreadAppliedTags() });
            else {
                await discoveryThread.delete();
                discoveryThread = await this.createDiscoveryThread();
            }
        } else {
            discoveryThread = await this.createDiscoveryThread();
        }

        const starterMessage = await discoveryThread.fetchStarterMessage();
        const messages = await discoveryThread.messages.fetch();

        if (starterMessage) {
            const starterMessageContent = await this.getStarterMessage();
            starterMessage.edit(starterMessageContent);
            messages.delete(starterMessage.id);
        }

        for (const message of messages.values())
            if (!message.system)
                await discoveryThread.messages.delete(message);

        this.sendChannelMessage(discoveryThread);
    }

    async syncMaps() {
        if (!this.isInMainList())
            return;

        const mapsThreadResult = await this.getMapsThread();
        var mapsThread;

        if (mapsThreadResult.exists) {
            mapsThread = mapsThreadResult.result;
            await mapsThread.edit({ appliedTags: await this.getMapsThreadAppliedTags() });

            if (this.type != ProjectType.MAP) {
                await mapsThread.delete();
                return;
            }
        } else {
            if (this.type != ProjectType.MAP)
                return;

            mapsThread = await this.createMapsThread();
        }

        const starterMessage = await mapsThread.fetchStarterMessage();
        const messages = await mapsThread.messages.fetch();

        if (starterMessage) {
            const starterMessageContent = await this.getStarterMessage();
            starterMessage.edit(starterMessageContent);
            messages.delete(starterMessage.id);
        }

        for (const message of messages.values())
            if (!message.system)
                await mapsThread.messages.delete(message);

        this.sendChannelMessage(mapsThread);
    }

    async createNewProject(name: string, displayName: string, type: ProjectType): Promise<Project> {
        const guild = await Bot.getInstance().guild;
        const role = await this.createProjectRole(displayName, ProjectStage.IN_DEVELOPMENT);
        const category = await guild.channels.fetch(Bot.PROJECT_CATEGORY_ID) as CategoryChannel;

        if (!category)
            throw new Error(`Category channel ${Bot.PROJECT_CATEGORY_ID} not found`);

        const project = await this.repo.create({ name, display_name: displayName, role_id: role.id, type });

        await project.sync(true);

        return project;
    }

    async createDiscoveryThread(): Promise<ForumThreadChannel> {
        const discoveryChannel = await Project.getDiscoveryChannel();
        const starterMessage = await this.getStarterMessage();
        const discoveryThread = await discoveryChannel.threads.create({
            appliedTags: await this.getDiscoveryThreadAppliedTags(),
            message: starterMessage as GuildForumThreadMessageCreateOptions,
            name: this.discoveryChannelName,
        }) as ForumThreadChannel;

        this.discoveryThreadId = discoveryThread.id;
        await ProjectService.getInstance().save(this, false);

        return discoveryThread;
    }

    async createMapsThread() {
        const mapsChannel = await Project.getMapsChannel();
        const starterMessage = await this.getStarterMessage();
        const mapsThread = await mapsChannel.threads.create({
            appliedTags: await this.getMapsThreadAppliedTags(),
            message: starterMessage as GuildForumThreadMessageCreateOptions,
            name: this.discoveryChannelName, // Correct, uses same format as discovery channel
        }) as ForumThreadChannel;

        return mapsThread;
    }

    async getStarterMessage(): Promise<BaseMessageOptions> {
        const attachments = await ProjectService.getInstance().repo.downloadAttachments(this);
        const content = this.description == null ? "# " + this.displayName : this.description;

        if (attachments.length == 0)
            return { content: content, files: [] };
        else
            return { content: "", files: attachments };
    }

    async sendChannelMessage(channel: ForumThreadChannel) {
        var content = this.channelMessageContent();

        while (content.length > 0) {
            var maxSnippet = content.substring(0, 2000);
            var lastSpace = maxSnippet.lastIndexOf(' ');
            var lastNewline = maxSnippet.lastIndexOf('\n');
            var sending = maxSnippet.substring(0, (content.length > 2000 ? (lastNewline > 0 ? lastNewline : (lastSpace > 0 ? lastSpace : maxSnippet.length)) : maxSnippet.length));

            var messageToSend: MessageCreateOptions = {
                content: sending.trim(),
                allowedMentions: { parse: [] },
                flags: MessageFlags.SuppressEmbeds
            };

            content = content.substring(sending.length, content.length);

            await channel.send(messageToSend);
        }
    }

    async deleteResources() {
        const guild = await Bot.getInstance().guilds.fetch(Bot.GUILD_ID);

        for (const staff of this.staff) {
            if (staff.user.discordId)
                await ProjectService.getInstance().updateStaffRoles(staff.user.discordId);
        }

        if (this.type != ProjectType.MAP) {
            const channel = await this.getChannel();

            if (channel.exists)
                channel.result.delete();
        }

        const discoveryThreadResult = await this.getDiscoveryThread();

        if (discoveryThreadResult.exists)
            await discoveryThreadResult.result.delete();


        if (this.roleId) {
            const role = await guild.roles.fetch(this.roleId);
            await role?.delete();
        }

    }
}