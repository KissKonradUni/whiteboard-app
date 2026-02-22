import { type DatabaseType, type SQLSchema, Table } from './table';
import bcrypt from 'bcrypt';

export interface Session {
    id: number;
    user_id: number;
    token: string;
    created_at?: string;
    alive_until: string;
}

export const sql: SQLSchema = [
    { name: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
    { name: 'user_id', value: 'INTEGER NOT NULL' },
    { name: 'token', value: 'TEXT NOT NULL UNIQUE' },
    { name: 'created_at', value: 'TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP' },
    { name: 'alive_until', value: 'TEXT NOT NULL' }
];

class SessionsTable extends Table<Session> {
    constructor(db: DatabaseType) {
        super(db, 'sessions', sql);
    }

    checkToken(token: string): Session | undefined {
        const tk = this.db.prepare(`SELECT * FROM ${this.name} WHERE token = ?`).get(token) as Session | undefined;
        if (tk && new Date(tk.alive_until) > new Date()) {
            return tk;
        } else {
            this.deleteSession(token);
            return undefined;
        }
    }

    createSession(user_id: number): string {
        const token = bcrypt.hashSync(`${user_id}-${Date.now()}`, 10);
        
        const now = new Date();
        now.setDate(now.getDate() + 1); // Default to 1 day
        const alive_until = now;
        this.insert({ user_id, token, alive_until: alive_until.toISOString() });

        return token;
    }

    deleteSession(token: string): void {
        this.db.prepare(`DELETE FROM ${this.name} WHERE token = ?`).run(token);
    }

    deleteExpiredSessions(): void {
        const now = new Date().toISOString();
        this.db.prepare(`DELETE FROM ${this.name} WHERE alive_until <= ?`).run(now);
    }
}

export default SessionsTable;