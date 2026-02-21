import { type DatabaseType, type SQLSchema, Table } from './table';
import bcrypt from 'bcrypt';

export interface User {
    id: number;
    name: string;
    email: string;
    password_hash: string;
}

export const sql: SQLSchema = [
    { name: 'id', value: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
    { name: 'name', value: 'TEXT NOT NULL' },
    { name: 'email', value: 'TEXT NOT NULL UNIQUE' },
    { name: 'password_hash', value: 'TEXT NOT NULL' }
];

class UserTable extends Table<User> {
    constructor(db: DatabaseType) {
        super(db, 'users', sql);
    }

    register(name: string, email: string, password: string): number {
        const password_hash = bcrypt.hashSync(password, 10);
        return this.insert({ name, email, password_hash });
    }

    getByEmail(email: string): User | undefined {
        return this.db.prepare(`SELECT * FROM ${this.name} WHERE email = ?`).get(email) as User | undefined;
    }

    verifyPassword(email: string, password: string): boolean {
        const user = this.getByEmail(email);
        if (!user) return false;
        return bcrypt.compareSync(password, user.password_hash);
    }
}

export default UserTable;