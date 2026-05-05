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

        // Always ensure the migrations table exists first
        new MigrationsTable(this.db).migrate();

        const applied = new Set(
            (this.db.prepare('SELECT name FROM migrations').all() as { name: string }[]).map(m => m.name)
        );

        const run = (name: string, fn: () => void) => {
            if (applied.has(name)) return;
            fn();
            this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
            applied.add(name);
        };

        run('initial_migration', () => {
            new UserTable(this.db).migrate();
            new SessionsTable(this.db).migrate();
        });

        run('user_settings', () => new UserSettingsTable(this.db).migrate());
        run('user_stats',    () => new UserStatsTable(this.db).migrate());
    }
}

export default DBManager.getDB();
