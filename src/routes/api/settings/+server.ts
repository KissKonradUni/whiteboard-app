import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkSession } from '$lib/server/checkSession';
import UserSettingsTable from '$lib/server/database/user_settings';
import db from '$lib/server/db';

export const PATCH: RequestHandler = async ({ request, cookies }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn || !session.user) {
        throw error(401, 'Unauthorized');
    }

    const body = await request.json();
    const table = new UserSettingsTable(db);
    const existing = table.getOrCreate(session.user.id);

    const theme         = body.theme === 'light' ? 'light' : body.theme === 'dark' ? 'dark' : existing.theme as 'dark' | 'light';
    const gridVisible   = 'grid_visible'    in body ? body.grid_visible    !== false : existing.grid_visible !== 0;
    const iconSize      = ['sm', 'md', 'lg'].includes(body.icon_size) ? body.icon_size : existing.icon_size;
    const aiChatVisible = 'ai_chat_visible' in body ? body.ai_chat_visible !== false : existing.ai_chat_visible !== 0;

    table.upsert(session.user.id, theme, gridVisible, iconSize, aiChatVisible);
    return json({ ok: true });
};
