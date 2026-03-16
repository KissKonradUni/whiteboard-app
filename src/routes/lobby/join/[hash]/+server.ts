import type { RequestHandler } from "@sveltejs/kit";
import { error, json } from "@sveltejs/kit";

import { checkSession } from "$lib/server/checkSession";
import { lobbyManager } from "$lib/server/lobby";
import { WebSocketManager } from "$lib/server/websocket";
import UserTable from "$lib/server/database/user";
import db from "$lib/server/db";

export const POST: RequestHandler = async ({ params, cookies }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn || !session.user) {
        error(401, "Unauthorized");
    }

    const hash = params.hash;
    if (!hash) {
        return json({ error: "Lobby code is required" }, { status: 400 });
    }

    const user = new UserTable(db).getByEmail(session.user.email!);
    if (!user) {
        return json({ error: "User not found" }, { status: 404 });
    }

    // Leave any existing lobby first
    const existing = lobbyManager.getUserLobby(user.id);
    if (existing && existing.hash !== hash) {
        lobbyManager.leaveLobby(existing.hash, user.id);
    }

    const lobby = lobbyManager.joinLobby(hash, user.id);
    if (!lobby) {
        return json({ error: "Lobby not found" }, { status: 404 });
    }

    WebSocketManager.getInstance().emit("lobby:update", lobbyManager.getLobbies());

    return json(lobby, { status: 200 });
};
