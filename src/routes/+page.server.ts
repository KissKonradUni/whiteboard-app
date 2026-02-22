import MigrationsTable from '$lib/server/database/migration';
import db from '$lib/server/db';

export async function load() {
    const migrations = new MigrationsTable(db).all();
    return { migrations };
}