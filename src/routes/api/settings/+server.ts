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
    const theme      = body.theme === 'light' ? 'light' : 'dark';
    const gridVisible = body.grid_visible !== false;
    const iconSize   = ['sm', 'md', 'lg'].includes(body.icon_size) ? body.icon_size : 'md';

    new UserSettingsTable(db).upsert(session.user.id, theme, gridVisible, iconSize);
    return json({ ok: true });
};
