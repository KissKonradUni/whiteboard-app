import type { LayoutServerLoad } from "./$types";

import { checkSession } from "$lib/server/checkSession";
import { WebSocketManager } from "$lib/server/websocket";

export const load: LayoutServerLoad = async ({ cookies }) => { 
    WebSocketManager.getInstance();
    return checkSession(cookies); 
}