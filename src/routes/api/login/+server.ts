import type { RequestHandler } from "@sveltejs/kit";

import UserTable from "$lib/database/user";
import SessionsTable from "$lib/database/session";
import db from "$lib/db";

export const POST: RequestHandler = async ({ request }) => { 
    const { email, password } = await request.json();
    const user = new UserTable(db).getByEmail(email);

    if (!user) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 });
    }

    const valid = new UserTable(db).verifyPassword(email, password);
    if (!valid) {
        return new Response(JSON.stringify({ error: "Invalid email or password" }), { status: 401 });
    }

    const token = new SessionsTable(db).createSession(user.id);

    return new Response(
        JSON.stringify({ message: "Login successful" }), 
        { 
            status: 200,
            headers: {
                "Set-Cookie": `session_token=${token}; HttpOnly; Path=/; Max-Age=86400` // 1 day
            }
        }
    );
};