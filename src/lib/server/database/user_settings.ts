import { type DatabaseType, type SQLSchema, Table } from './table';

export interface UserSettings {
    id: number;
    user_id: number;
    theme: string;
    grid_visible: number;
    icon_size: string;
}

export const sql: SQLSchema = [
    { name: 'id',           value: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
    { name: 'user_id',      value: 'INTEGER NOT NULL UNIQUE' },
    { name: 'theme',        value: "TEXT NOT NULL DEFAULT 'dark'" },
    { name: 'grid_visible', value: 'INTEGER NOT NULL DEFAULT 1' },
    { name: 'icon_size',    value: "TEXT NOT NULL DEFAULT 'md'" },
];

class UserSettingsTable extends Table<UserSettings> {
    constructor(db: DatabaseType) {
        super(db, 'user_settings', sql);
    }

    getByUserId(userId: number): UserSettings | undefined {
        return this.db
            .prepare(`SELECT * FROM ${this.name} WHERE user_id = ?`)
            .get(userId) as UserSettings | undefined;
    }

    getOrCreate(userId: number): UserSettings {
        const existing = this.getByUserId(userId);
        if (existing) return existing;
        this.db.prepare(`INSERT INTO ${this.name} (user_id) VALUES (?)`).run(userId);
        return this.getByUserId(userId)!;
    }

    upsert(userId: number, theme: string, gridVisible: boolean, iconSize: string): void {
        this.db.prepare(`
            INSERT INTO ${this.name} (user_id, theme, grid_visible, icon_size)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                theme        = excluded.theme,
                grid_visible = excluded.grid_visible,
                icon_size    = excluded.icon_size
        `).run(userId, theme, gridVisible ? 1 : 0, iconSize);
    }
}

export default UserSettingsTable;
