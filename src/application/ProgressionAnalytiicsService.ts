import {
    ChannelType,
    Client,
    Guild,
    TextChannel,
} from "discord.js";
import { AppConfig } from "../core/config.js";

type ProfileViewEvent = {
    viewerDiscordId: string;
    targetDiscordId: string;
    selfView: boolean;
    createdAt: number;
};

export class ProgressionAnalyticsService {
    private profileViews: ProfileViewEvent[] = [];

    constructor(
        private client: Client,
        private config: AppConfig,
    ) {
        // Daily report
        setInterval(
            () => this.sendAggregateReport(24 * 60 * 60 * 1000, "Daily"),
            24 * 60 * 60 * 1000
        );

        // Weekly report
        setInterval(
            () => this.sendAggregateReport(7 * 24 * 60 * 60 * 1000, "Weekly"),
            7 * 24 * 60 * 60 * 1000
        );
    }

    public async trackProfileView(data: {
        viewerDiscordId: string;
        targetDiscordId: string;
        selfView: boolean;
    }): Promise<void> {
        const guild = await this.client.guilds.fetch(this.config.discord.guildId);
        const viewer = await guild.members.fetch(data.viewerDiscordId);
        const target = await guild.members.fetch(data.targetDiscordId);

        // Store event
        this.profileViews.push({
            ...data,
            createdAt: Date.now(),
        });

        // Cleanup old events (> 7 days)
        this.cleanup();

        // Log channel message
        const logsChannel = await this.findLogsChannel(guild);

        if (!logsChannel)
            return;

        let msg = `[Profile] ${viewer.user}`;

        if (data.selfView) {
            msg += ` viewed their own profile`;
        }
        else {
            msg += ` viewed ${target.user}`;
        }

        await logsChannel.send(msg);
    }

    private cleanup() {
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);

        this.profileViews = this.profileViews.filter(
            x => x.createdAt >= cutoff
        );
    }

    private async sendAggregateReport(
        windowMs: number,
        label: string
    ): Promise<void> {
        const guild = await this.client.guilds.fetch(this.config.discord.guildId);
        const logsChannel = await this.findLogsChannel(guild);

        if (!logsChannel)
            return;

        const cutoff = Date.now() - windowMs;

        const views = this.profileViews.filter(
            x => x.createdAt >= cutoff
        );

        const uniqueUsers = new Set(
            views.map(v => v.viewerDiscordId)
        );

        const totalViews = views.length;

        const averageViews =
            uniqueUsers.size === 0
                ? 0
                : totalViews / uniqueUsers.size;

        // Most viewed profiles
        const viewedCounts = new Map<string, number>();

        for (const view of views) {
            viewedCounts.set(
                view.targetDiscordId,
                (viewedCounts.get(view.targetDiscordId) ?? 0) + 1
            );
        }

        const topViewed = [...viewedCounts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        let msg =
            `## ${label} Progression Analytics\n` +
            `- Total profile opens: ${totalViews}\n` +
            `- Unique users: ${uniqueUsers.size}\n` +
            `- Average opens per user: ${averageViews.toFixed(2)}\n`;

        if (topViewed.length > 0) {
            msg += `\n### Most Viewed Profiles\n`;

            for (const [discordId, count] of topViewed) {

                try {
                    const member = await guild.members.fetch(discordId);

                    msg += `- ${member.user.username}: ${count}\n`;
                }
                catch {
                    msg += `- Unknown User (${discordId}): ${count}\n`;
                }
            }
        }

        await logsChannel.send(msg);
    }

    private async findLogsChannel(
        guild: Guild
    ): Promise<TextChannel | null> {

        const channels = await guild.channels.fetch();

        const channel = channels.find(c =>
            c &&
            c.type === ChannelType.GuildText &&
            c.name === "logs"
        );

        if (!channel)
            return null;

        return channel as TextChannel;
    }
}