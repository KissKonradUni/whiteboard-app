import type { LayoutServerLoad } from "./$types";
import { checkSession } from "$lib/server/checkSession";
import { WebSocketManager } from "$lib/server/websocket";
import UserSettingsTable from "$lib/server/database/user_settings";
import db from "$lib/server/db";

export const load: LayoutServerLoad = async ({ cookies }) => {
    WebSocketManager.getInstance();
    const session = checkSession(cookies);

    let theme: 'dark' | 'light' = 'dark';
    let iconSize = 'md';
    let aiChatEnabled = true;
    if (session.loggedIn && session.user) {
        const settings = new UserSettingsTable(db).getOrCreate(session.user.id);
        theme = settings.theme === 'light' ? 'light' : 'dark';
        iconSize = settings.icon_size ?? 'md';
        aiChatEnabled = settings.ai_chat_visible !== 0;
    }

    return { ...session, theme, iconSize, aiChatEnabled };
};
