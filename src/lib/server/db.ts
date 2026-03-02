// Typescript hack for CommonJS modules
import * as BetterSqlite3 from 'better-sqlite3';
const Database = BetterSqlite3.default;

import MigrationsTable from './database/migration';
import UserTable from './database/user';
import SessionsTable from './database/session';
import { browser } from '$app/environment';

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

        // If the migrations table is empty, apply the initial migration
        try {
            this.db.prepare('SELECT COUNT(*) AS count FROM migrations').get();
        } catch (e) {
            console.log('Applying initial migration...');

            // PUT NEW TABLES HERE
            new MigrationsTable(this.db).migrate();
            new UserTable(this.db).migrate();
            new SessionsTable(this.db).migrate();

            // Log the migration
            this.db.prepare('INSERT INTO migrations (name) VALUES (?)').run('initial_migration');
        }
    }
}

export default DBManager.getDB();