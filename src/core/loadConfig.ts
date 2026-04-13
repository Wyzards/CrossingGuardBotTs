import { AppConfig } from "./config.js";

export function loadConfig(): AppConfig {
    const env = process.env;

    function required(key: string): string {
        const value = env[key];
        if (!value) throw new Error(`Missing env: ${key}`);
        return value;
    }

    return {
        discord: {
            token: required("TOKEN"),
            guildId: required("GUILD_ID"),
            clientId: required("CLIENT_ID"),

            channels: {
                announcement: required("ANNOUNCEMENT_CHANNEL_ID"),
                discovery: required("DISCOVERY_CHANNEL_ID"),
                mapsForum: required("MAPS_FORUM_CHANNEL_ID"),
                admin: required("ADMIN_CHANNEL_ID"),
                projectCategory: required("PROJECT_CATEGORY"),
            },

            roles: {
                defaultPing: required("DEFAULT_PING_ROLE_ID"),
                staff: required("STAFF_ROLE_ID"),
                lead: required("LEAD_ROLE_ID"),
                intake: required("INTAKE_ROLE_ID"),
            }
        },

        api: {
            url: required("CROSSROADS_API_URL"),
            token: required("CROSSROADS_API_TOKEN")
        }
    };
}