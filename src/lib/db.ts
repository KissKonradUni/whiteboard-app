// Typescript hack for CommonJS modules
import * as BetterSqlite3 from 'better-sqlite3';
const Database = BetterSqlite3.default;

import MigrationsTable from './database/migration';
import UserTable from './database/user';
import SessionsTable from './database/session';

const db = new Database('whiteboard.db');
db.pragma('journal_mode = WAL');

// If the migrations table is empty, apply the initial migration
try {
    db.prepare('SELECT COUNT(*) AS count FROM migrations').get();
} catch (e) {
    console.log('Applying initial migration...');

    // PUT NEW TABLES HERE
    new MigrationsTable(db).migrate();
    new UserTable(db).migrate();
    new SessionsTable(db).migrate();

    // Log the migration
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run('initial_migration');
}

export default db;