import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { checkSession } from '$lib/server/checkSession';
import UserSettingsTable from '$lib/server/database/user_settings';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ cookies }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn || !session.user) {
        throw redirect(302, '/login');
    }

    const settings = new UserSettingsTable(db).getOrCreate(session.user.id);
    return { settings };
};
