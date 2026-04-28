import UserTable from "./database/user";
import db from "./db";

export interface Lobby {
    hash: string;
    name: string;
    users?: { id: number, name: string }[];
}

class LobbyManager {
    private static instance: LobbyManager;
    private cache: Map<string, Lobby> = new Map();

    public static getInstance(): LobbyManager {
        if (!LobbyManager.instance) {
            LobbyManager.instance = new LobbyManager();
        }
        return LobbyManager.instance;
    }

    private constructor() {}

    public getLobbies(): Lobby[] {
        return Array.from(this.cache.values());
    }

    public getLobby(hash: string): Lobby | undefined {
        return this.cache.get(hash);
    }

    public getUserLobby(userID: number): Lobby | undefined {
        return Array.from(this.cache.values()).find(lobby =>
            lobby.users?.some(u => u.id === userID)
        );
    }

    public isUserInLobby(hash: string, userID: number): boolean {
        const lobby = this.cache.get(hash);
        if (!lobby?.users) {
            return false;
        }

        return lobby.users.some((user) => user.id === userID);
    }

    public createLobby(name: string, userID: number): Lobby {
        const hash = Math.random().toString(36).substring(2, 8);
        const user = new UserTable(db).get(userID);
        const lobby: Lobby = { 
            hash,
            name,
            users: [
                { id: userID, name: user?.name ?? "Unknown User" }
            ]
        }
        this.cache.set(hash, lobby);
        return lobby;
    }

    public joinLobby(hash: string, userID: number): Lobby | undefined {
        const lobby = this.cache.get(hash);
        if (!lobby) return undefined;

        const user = new UserTable(db).get(userID);
        if (!user) return undefined;

        // Check if user is already in the lobby
        if (lobby.users?.some(u => u.id === userID)) {
            return lobby;
        }

        lobby.users = lobby.users || [];
        lobby.users.push({ id: userID, name: user.name });
        return lobby;
    }

    public leaveLobby(hash: string, userID: number): Lobby | undefined {
        const lobby = this.cache.get(hash);
        if (!lobby || !lobby.users) return undefined;

        lobby.users = lobby.users.filter(u => u.id !== userID);
        if (lobby.users.length === 0) {
            this.cache.delete(hash);
            return undefined;
        }
        return lobby;
    }
}

export const lobbyManager = LobbyManager.getInstance();