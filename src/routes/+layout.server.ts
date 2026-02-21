import type { LayoutServerLoad } from "./$types";

import SessionsTable from "$lib/database/session";
import UserTable from "$lib/database/user";
import db from "$lib/db";

export const load: LayoutServerLoad = async ({ cookies }) => {
    const session_token = cookies.get("session_token");
    if (!session_token) {
        return { loggedIn: false, name: null };
    }

    const session = new SessionsTable(db).checkToken(session_token);
    if (!session) {
        return { loggedIn: false, name: null };
    }

    const user = new UserTable(db).get(session.user_id);
    if (!user) {
        return { loggedIn: false, name: null };
    }

    return { loggedIn: true, name: user.name };
}