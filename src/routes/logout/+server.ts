import type { RequestHandler } from "@sveltejs/kit";

import SessionsTable from "$lib/server/database/session";
import db from "$lib/server/db";

export const GET: RequestHandler = async ({ cookies }) => {
    const session_token = cookies.get("session_token");
    if (session_token) {
        new SessionsTable(db).deleteSession(session_token);
        cookies.delete("session_token", { path: "/" });
    }

    return new Response(
        JSON.stringify({ message: "Logout successful" }), 
        { 
            status: 302,
            headers: { "Location": "/login" }
        }
    );
}