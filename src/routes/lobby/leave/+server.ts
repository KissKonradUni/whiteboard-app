import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";

import { checkSession } from "$lib/server/checkSession";
import { lobbyManager } from "$lib/server/lobby";
import UserTable from "$lib/server/database/user";
import db from "$lib/server/db";

export const POST: RequestHandler = async ({ cookies }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn || !session.user) {
        error(401, "Unauthorized");
    }

    const user = new UserTable(db).getByEmail(session.user.email!);
    if (!user) {
        return json({ error: "User not found" }, { status: 404 });
    }

    const lobby = lobbyManager.getUserLobby(user.id);
    if (!lobby) {
        return json({ error: "Not in a lobby" }, { status: 404 });
    }

    lobbyManager.leaveLobby(lobby.hash, user.id);
    return json({ success: true }, { status: 200 });
};
