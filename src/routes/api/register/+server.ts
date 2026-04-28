import type { RequestHandler } from "@sveltejs/kit";

import UserTable from "$lib/server/database/user";
import db from "$lib/server/db";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/; // Minimum 6 characters, at least one letter and one number

export const POST: RequestHandler = async ({ request }) => { 
    const { name, email, password } = await request.json();
    const user = new UserTable(db).getByEmail(email);

    if (user) {
        return new Response(JSON.stringify({ error: "Email already registered" }), { status: 400 });
    }

    if (!name || name.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
    }
    
    if (!emailRegex.test(email)) {
        return new Response(JSON.stringify({ error: "Email is required" }), { status: 400 });
    }

    if (!passwordRegex.test(password)) {
        return new Response(JSON.stringify({ error: "Password must be at least 6 characters, and include at least one letter and one number" }), { status: 400 });
    }

    new UserTable(db).register(name, email, password);
    
    // Redirect to login page after successful registration
    return new Response(
        JSON.stringify({ message: "Registration successful" }), 
        { 
            status: 302,
            headers: {
                "Location": "/login"
            }
        }
    );
}