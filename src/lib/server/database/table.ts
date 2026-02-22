import * as BetterSqlite3 from 'better-sqlite3';
export type DatabaseType = BetterSqlite3.Database;

interface SQLRow {
    name: string;
    value: string;
}

export type SQLSchema = SQLRow[];

export class Table<Schema> {
    protected db: BetterSqlite3.Database
    protected name: string;
    protected schema: SQLSchema;

    constructor(db: BetterSqlite3.Database, name: string, schema: SQLSchema) {
        this.db = db;
        this.name = name;
        this.schema = schema;
    }

    all(): Schema[] {
        return this.db.prepare(`SELECT * FROM ${this.name}`).all() as Schema[];
    }

    get(id: number): Schema | undefined {
        return this.db.prepare(`SELECT * FROM ${this.name} WHERE id = ?`).get(id) as Schema | undefined;
    }

    insert(data: Omit<Schema, 'id'>): number {
        const keys = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const stmt = this.db.prepare(`INSERT INTO ${this.name} (${keys}) VALUES (${placeholders})`);
        const result = stmt.run(...Object.values(data));
        return result.lastInsertRowid as number;
    }

    update(id: number, data: Partial<Omit<Schema, 'id'>>): void {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const stmt = this.db.prepare(`UPDATE ${this.name} SET ${setClause} WHERE id = ?`);
        stmt.run(...Object.values(data), id);
    }

    delete(id: number): void {
        this.db.prepare(`DELETE FROM ${this.name} WHERE id = ?`).run(id);
    }

    migrate(): void {
        const columns = this.schema.map(col => `${col.name} ${col.value}`).join(', ');
        this.db.prepare(`CREATE TABLE IF NOT EXISTS ${this.name} (${columns})`).run();
    }
}