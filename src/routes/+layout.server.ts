import type { LayoutServerLoad } from "./$types";

import { checkSession } from "$lib/server/checkSession";

export const load: LayoutServerLoad = async ({ cookies }) => { 
    return checkSession(cookies); 
}