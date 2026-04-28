import type { PageServerLoad } from "./$types";
import { error } from "@sveltejs/kit";

import { checkSession } from "$lib/server/checkSession";
import { lobbyManager } from "$lib/server/lobby";
import UserTable from "$lib/server/database/user";
import db from "$lib/server/db";

export const load: PageServerLoad = async ({ cookies, params }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn || !session.user) {
        error(401, "Unauthorized");
    }

    const hash = params.hash?.trim();
    if (!hash) {
        error(400, "Lobby hash is required");
    }

    const user = new UserTable(db).getByEmail(session.user.email!);
    if (!user) {
        error(404, "User not found");
    }

    if (!lobbyManager.isUserInLobby(hash, user.id)) {
        error(403, "You are not in this lobby");
    }

    const lobby = lobbyManager.getLobby(hash);
    if (!lobby) {
        error(404, "Lobby not found");
    }

    return {
        hash,
        lobbyName: lobby.name,
        user: { id: user.id, name: user.name }
    };
};
