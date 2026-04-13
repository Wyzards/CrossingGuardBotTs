export interface AppConfig {
    discord: {
        token: string;
        guildId: string;
        clientId: string;

        channels: {
            announcement: string;
            discovery: string;
            mapsForum: string;
            admin: string;
            projectCategory: string;
        };

        roles: {
            defaultPing: string;
            staff: string;
            lead: string;
            intake: string;
        };
    };

    api: {
        url: string;
        token: string;
    };
}