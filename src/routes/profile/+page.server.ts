import type { PageServerLoad } from '../$types';
import { error } from '@sveltejs/kit';
import { checkSession } from '$lib/server/checkSession';
import UserStatsTable from '$lib/server/database/user_stats';
import db from '$lib/server/db';

export const load: PageServerLoad = async ({ cookies }) => {
    const session = checkSession(cookies);
    if (!session.loggedIn || !session.user) {
        error(401, 'Unauthorized');
    }

    const stats = new UserStatsTable(db).getByUserId(session.user.id) ?? {
        total_strokes: 0,
        total_sessions: 0,
        last_active: null,
    };

    return { ...session, stats };
};
