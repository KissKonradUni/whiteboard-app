import { type DatabaseType, type SQLSchema, Table } from './table';

export interface Migration {
    id: number;
    name: string;
    applied_at: string;
}

export const sql: SQLSchema = [
    { name: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
    { name: 'name', value: 'TEXT NOT NULL' },
    { name: 'applied_at', value: 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP' }
];

class MigrationsTable extends Table<Migration> {
    constructor(db: DatabaseType) {
        super(db, 'migrations', sql);
    }
}

export default MigrationsTable;