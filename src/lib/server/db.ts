// Typescript hack for CommonJS modules
import * as BetterSqlite3 from 'better-sqlite3';
const Database = BetterSqlite3.default;

import MigrationsTable from './database/migration';
import UserTable from './database/user';
import SessionsTable from './database/session';
import UserSettingsTable from './database/user_settings';
import UserStatsTable from './database/user_stats';

class DBManager {
    private static instance: DBManager;
    private db: BetterSqlite3.Database;

    public static getInstance(): DBManager {
        if (!DBManager.instance) {
            DBManager.instance = new DBManager();
        }
        return DBManager.instance;
    }

    public static getDB(): BetterSqlite3.Database {
        return DBManager.getInstance().db;
    }

    private constructor() {
        this.db = new Database('whiteboard.db');
        this.db.pragma('journal_mode = WAL');

        // Initial migration (runs only once, on first startup)
        try {
            this.db.prepare('SELECT COUNT(*) AS count FROM migrations').get();
        } catch (e) {
            console.log('Applying initial migration...');
            new MigrationsTable(this.db).migrate();
            new UserTable(this.db).migrate();
            new SessionsTable(this.db).migrate();
            this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run('initial_migration');
        }

        // These tables use CREATE TABLE IF NOT EXISTS — safe to run on every startup
        new UserSettingsTable(this.db).migrate();
        new UserStatsTable(this.db).migrate();
    }
}

export default DBManager.getDB();
