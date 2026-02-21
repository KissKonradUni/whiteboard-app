import type { LayoutServerLoad } from "./$types";

import { checkSession } from "$lib/checkSession";

export const load: LayoutServerLoad = async ({ cookies }) => checkSession(cookies);