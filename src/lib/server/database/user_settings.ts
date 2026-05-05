import { type DatabaseType, type SQLSchema, Table } from './table';

export interface UserSettings {
    id: number;
    user_id: number;
    theme: string;
    grid_visible: number;
    icon_size: string;
    ai_chat_visible: number;
}

export const sql: SQLSchema = [
    { name: 'id',              value: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
    { name: 'user_id',         value: 'INTEGER NOT NULL UNIQUE' },
    { name: 'theme',           value: "TEXT NOT NULL DEFAULT 'dark'" },
    { name: 'grid_visible',    value: 'INTEGER NOT NULL DEFAULT 1' },
    { name: 'icon_size',       value: "TEXT NOT NULL DEFAULT 'md'" },
    { name: 'ai_chat_visible', value: 'INTEGER NOT NULL DEFAULT 1' },
];

class UserSettingsTable extends Table<UserSettings> {
    constructor(db: DatabaseType) {
        super(db, 'user_settings', sql);
    }

    migrate(): void {
        super.migrate();
        // Add new columns to existing tables (SQLite has no ALTER TABLE ADD COLUMN IF NOT EXISTS)
        const cols = (this.db.prepare(`PRAGMA table_info(${this.name})`).all() as { name: string }[]).map(c => c.name);
        if (!cols.includes('ai_chat_visible')) {
            this.db.prepare(`ALTER TABLE ${this.name} ADD COLUMN ai_chat_visible INTEGER NOT NULL DEFAULT 1`).run();
        }
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

    upsert(userId: number, theme: string, gridVisible: boolean, iconSize: string, aiChatVisible: boolean): void {
        this.db.prepare(`
            INSERT INTO ${this.name} (user_id, theme, grid_visible, icon_size, ai_chat_visible)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
                theme           = excluded.theme,
                grid_visible    = excluded.grid_visible,
                icon_size       = excluded.icon_size,
                ai_chat_visible = excluded.ai_chat_visible
        `).run(userId, theme, gridVisible ? 1 : 0, iconSize, aiChatVisible ? 1 : 0);
    }
}

export default UserSettingsTable;
