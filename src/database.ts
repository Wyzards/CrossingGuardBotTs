class Database {

    private static instance: Database = null;

    public constructor() {

    }

    private makeTables(): void {
        // CREATE TABLE IF NOT EXISTS Projects (project_id INT NOT NULL, channel_id VARCHAR(50), name VARCHAR(50), display_name VARCHAR(50), status INT UNSIGNED NOT NULL, description VARCHAR(2000), ip varchar(30), role_id VARCHAR(50), PRIMARY KEY(project_id));
    }

    public getProject(projectId): Project {
        return null;
    }

    public static getInstance(): Database {
        if (Database.instance == null)
            Database.instance = new Database();

        return Database.instance;
    }
}