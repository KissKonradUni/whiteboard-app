import type { Cookies } from "@sveltejs/kit";

import SessionsTable from "./database/session";
import UserTable, { type User } from "./database/user";
import db from "./db";

export function checkSession(cookies: Cookies): { loggedIn: boolean; user: Partial<User> | null } {
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

    // Using partial we omit the password_hash field, so it won't be accidentally leaked anywhere
    return { loggedIn: true, user: { name: user.name, email: user.email } };
}