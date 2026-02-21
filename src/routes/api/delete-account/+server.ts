import type { RequestHandler } from "@sveltejs/kit";

import db from "$lib/db";
import UserTable from "$lib/database/user";
import { checkSession } from "$lib/checkSession";

export const POST: RequestHandler = async ({ request, cookies }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const user = session.user!;
    new UserTable(db).delete(user.id);

    cookies.delete("session_token", { path: "/" });
    
    return new Response(JSON.stringify({ success: true }), { status: 200 });
};