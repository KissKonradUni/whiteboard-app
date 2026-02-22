import type { LayoutServerLoad } from "./$types";

import { checkSession } from "$lib/server/checkSession";
import { WebSocketManager } from "$lib/server/websocket";

export const load: LayoutServerLoad = async ({ cookies }) => { 
    // As this is the first code that runs when the user visits we use this to init the ws
    WebSocketManager.getInstance();
    
    return checkSession(cookies); 
}