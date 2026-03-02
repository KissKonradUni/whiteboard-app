import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";

import { checkSession } from "$lib/server/checkSession";
import { lobbyManager } from "$lib/server/lobby";
import UserTable from "$lib/server/database/user";
import db from "$lib/server/db";

export const POST: RequestHandler = async ({ params, cookies }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn || !session.user) {
        error(401, "Unauthorized");
    }

    const name = params.name?.trim();
    if (!name) {
        return json({ error: "Lobby name is required" }, { status: 400 });
    }

    const user = new UserTable(db).getByEmail(session.user.email!);
    if (!user) {
        return json({ error: "User not found" }, { status: 404 });
    }

    // Leave any existing lobby first
    const existing = lobbyManager.getUserLobby(user.id);
    if (existing) {
        lobbyManager.leaveLobby(existing.hash, user.id);
    }

    const lobby = lobbyManager.createLobby(name, user.id);
    return json(lobby, { status: 201 });
};
