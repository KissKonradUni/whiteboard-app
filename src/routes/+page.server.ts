import MigrationsTable from '$lib/database/migration';
import db from '$lib/db';

export async function load() {
    const migrations = new MigrationsTable(db).all();
    return { migrations };
}