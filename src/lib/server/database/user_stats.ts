import { type DatabaseType, type SQLSchema, Table } from './table';

export interface UserStats {
    id: number;
    user_id: number;
    total_strokes: number;
    total_sessions: number;
    last_active: string | null;
}

export const sql: SQLSchema = [
    { name: 'id',             value: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
    { name: 'user_id',        value: 'INTEGER NOT NULL UNIQUE' },
    { name: 'total_strokes',  value: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'total_sessions', value: 'INTEGER NOT NULL DEFAULT 0' },
    { name: 'last_active',    value: 'TEXT' },
];

class UserStatsTable extends Table<UserStats> {
    constructor(db: DatabaseType) {
        super(db, 'user_stats', sql);
    }

    getByUserId(userId: number): UserStats | undefined {
        return this.db
            .prepare(`SELECT * FROM ${this.name} WHERE user_id = ?`)
            .get(userId) as UserStats | undefined;
    }

    incrementStrokes(userId: number): void {
        this.db.prepare(`
            INSERT INTO ${this.name} (user_id, total_strokes, last_active)
            VALUES (?, 1, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                total_strokes = total_strokes + 1,
                last_active   = excluded.last_active
        `).run(userId, new Date().toISOString());
    }

    incrementSessions(userId: number): void {
        this.db.prepare(`
            INSERT INTO ${this.name} (user_id, total_sessions, last_active)
            VALUES (?, 1, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                total_sessions = total_sessions + 1,
                last_active    = excluded.last_active
        `).run(userId, new Date().toISOString());
    }
}

export default UserStatsTable;
