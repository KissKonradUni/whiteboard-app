import type { Cookies } from "@sveltejs/kit";

import SessionsTable from "./database/session";
import UserTable, { type User } from "./database/user";
import db from "./db";

export type SessionUser = Omit<User, 'password_hash'>;

export function checkSession(cookies: Cookies): { loggedIn: boolean; user: SessionUser | null } {
    const session_token = cookies.get("session_token");
    if (!session_token) {
        return { loggedIn: false, user: null };
    }

    const session = new SessionsTable(db).checkToken(session_token);
    if (!session) {
        return { loggedIn: false, user: null };
    }

    const user = new UserTable(db).get(session.user_id);
    if (!user) {
        return { loggedIn: false, user: null };
    }

    // Omit password_hash so it won't be accidentally leaked
    return { loggedIn: true, user: { id: user.id, name: user.name, email: user.email } };
}