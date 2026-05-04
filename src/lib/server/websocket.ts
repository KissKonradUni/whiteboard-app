import type { Server, Socket } from "socket.io";

import db from "./db";
import SessionsTable from "./database/session";
import UserTable from "./database/user";
import UserStatsTable from "./database/user_stats";
import { lobbyManager } from "./lobby";

export class WebSocketManager {
    private static instance: WebSocketManager;
    private io: Server | null = null;
    private handlersBound = false;

    private constructor() {
        this.connectIfAvailable();
    }

    public static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    public emit(event: string, data?: unknown): void {
        this.connectIfAvailable();
        this.io?.emit(event, data);
    }

    public emitToLobby(hash: string, event: string, data?: unknown): void {
        this.connectIfAvailable();
        this.io?.to(this.getLobbyRoom(hash)).emit(event, data);
    }

    private connectIfAvailable(): void {
        if (this.io) return;

        //@ts-ignore Global variable from custom server.js file
        const io = (globalThis.io as Server | undefined) ?? null;
        if (!io) return;

        this.io = io;
        this.bindHandlers(io);
    }

    private bindHandlers(io: Server): void {
        if (this.handlersBound) return;

        io.on('connection', (socket) => {
            console.log('A client connected via WebSocket');
            socket.emit('eventFromServer', 'WebSocket connection established!');

            socket.on('whiteboard:join', (data: unknown) => {
                const hash = this.extractHash(data);
                if (!hash) {
                    socket.emit('whiteboard:error', { message: 'Lobby hash is required.' });
                    return;
                }

                const user = this.resolveUserFromSocket(socket);
                if (!user) {
                    socket.emit('whiteboard:error', { message: 'Unauthorized.' });
                    return;
                }

                if (!lobbyManager.isUserInLobby(hash, user.id)) {
                    socket.emit('whiteboard:error', { message: 'You are not in this lobby.' });
                    return;
                }

                const previousLobbyHash = socket.data.lobbyHash as string | undefined;
                if (previousLobbyHash && previousLobbyHash !== hash) {
                    socket.leave(this.getLobbyRoom(previousLobbyHash));
                }

                socket.join(this.getLobbyRoom(hash));
                socket.data.userId = user.id;
                socket.data.userName = user.name;
                socket.data.lobbyHash = hash;
                socket.emit('whiteboard:joined', { hash });

                // Track session stats
                new UserStatsTable(db).incrementSessions(user.id);

                // Send current canvas state to the joining client
                const elements = lobbyManager.getElements(hash);
                socket.emit('whiteboard:state', { elements });
            });

            socket.on('whiteboard:sync', (data: unknown) => {
                const hash = this.extractHash(data);
                const payload = this.extractPayload(data);
                if (!hash) return;

                const userId = socket.data.userId as number | undefined;
                if (!userId || !lobbyManager.isUserInLobby(hash, userId)) {
                    socket.emit('whiteboard:error', { message: 'Sync denied.' });
                    return;
                }

                if (socket.data.lobbyHash !== hash) return;

                // Persist element additions in lobby state and track stats
                if (payload && typeof payload === 'object') {
                    const p = payload as { action?: string; element?: unknown };
                    if (p.action === 'add' && p.element && typeof p.element === 'object') {
                        const el = p.element as { id?: string };
                        if (el.id) {
                            lobbyManager.addElement(hash, { id: el.id, userId, data: el });
                            new UserStatsTable(db).incrementStrokes(userId);
                        }
                    }
                }

                socket.to(this.getLobbyRoom(hash)).emit('whiteboard:sync', { hash, userId, payload });
            });

            socket.on('whiteboard:undo', (data: unknown) => {
                const hash = this.extractHash(data);
                if (!hash) return;

                const userId = socket.data.userId as number | undefined;
                if (!userId || socket.data.lobbyHash !== hash) return;

                const elementId = (data as { elementId?: unknown }).elementId;
                if (typeof elementId !== 'string') return;

                lobbyManager.removeElement(hash, elementId);
                socket.to(this.getLobbyRoom(hash)).emit('whiteboard:undo', { elementId });
            });

            socket.on('whiteboard:cursor', (data: unknown) => {
                const hash = this.extractHash(data);
                if (!hash || socket.data.lobbyHash !== hash) return;

                const userId = socket.data.userId as number | undefined;
                const userName = socket.data.userName as string | undefined;
                if (!userId || !userName) return;

                const d = data as { x?: unknown; y?: unknown };
                if (typeof d.x !== 'number' || typeof d.y !== 'number') return;

                socket.to(this.getLobbyRoom(hash)).emit('whiteboard:cursor', {
                    userId,
                    userName,
                    x: d.x,
                    y: d.y,
                });
            });
        });

        // TODO: Server can't shut down gracefully for some godforsaken reason even with this
        process.on('sveltekit:shutdown', async () => {
            io.sockets.sockets.forEach((socket) => {
                socket.emit('eventFromServer', 'Server is shutting down, disconnecting...');
                socket.disconnect(true);
            });
            io.close();
        });

        this.handlersBound = true;
    }

    private getLobbyRoom(hash: string): string {
        return `lobby:${hash}`;
    }

    private extractHash(data: unknown): string | null {
        if (!data || typeof data !== 'object') return null;
        const maybeHash = (data as { hash?: unknown }).hash;
        if (typeof maybeHash !== 'string' || !maybeHash.trim()) return null;
        return maybeHash.trim();
    }

    private extractPayload(data: unknown): unknown {
        if (!data || typeof data !== 'object') return null;
        return (data as { payload?: unknown }).payload ?? null;
    }

    private resolveUserFromSocket(socket: Socket): { id: number; name: string } | null {
        const cookieHeader = socket.handshake.headers.cookie;
        const sessionToken = this.extractSessionToken(cookieHeader);
        if (!sessionToken) return null;

        const session = new SessionsTable(db).checkToken(sessionToken);
        if (!session) return null;

        const user = new UserTable(db).get(session.user_id);
        if (!user) return null;

        return { id: user.id, name: user.name };
    }

    private extractSessionToken(cookieHeader: string | string[] | undefined): string | null {
        const normalized = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
        if (!normalized) return null;

        for (const part of normalized.split(';')) {
            const [rawKey, ...rawValue] = part.split('=');
            if (!rawKey || rawValue.length === 0) continue;
            if (rawKey.trim() !== 'session_token') continue;
            return decodeURIComponent(rawValue.join('=').trim());
        }

        return null;
    }
}
