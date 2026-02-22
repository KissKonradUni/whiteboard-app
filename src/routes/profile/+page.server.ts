import type { PageServerLoad } from "../$types";
import { error } from "@sveltejs/kit";

import { checkSession } from "$lib/server/checkSession";

export const load: PageServerLoad = async ({ cookies }) => {
    const session = checkSession(cookies);
    if (session.loggedIn) {
        return session;
    }
    
    error(401, "Unauthorized");
}