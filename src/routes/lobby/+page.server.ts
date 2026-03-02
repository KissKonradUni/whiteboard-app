import type { PageServerLoad } from "../$types";
import { error } from "@sveltejs/kit";

import { checkSession } from "$lib/server/checkSession";
import { lobbyManager } from "$lib/server/lobby";
import UserTable from "$lib/server/database/user";
import db from "$lib/server/db";

export const load: PageServerLoad = async ({ cookies }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn || !session.user) {
        error(401, "Unauthorized");
    }

    const user = new UserTable(db).getByEmail(session.user.email!);
    if (!user) {
        error(500, "User not found");
    }

    const currentLobby = lobbyManager.getUserLobby(user.id) ?? null;
    const lobbies = lobbyManager.getLobbies();

    return {
        currentLobby,
        lobbies,
        user: { id: user.id, name: user.name }
    };
}