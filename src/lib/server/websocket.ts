import type { Server } from "socket.io";

export class WebSocketManager {
    private static instance: WebSocketManager;
    private io: Server | null = null;

    private constructor() {
        //@ts-ignore Global variable from custom server.js file
        const io = globalThis.io as Server;
        this.io = io;

        io.on('connection', (socket) => {
            console.log('A client connected via WebSocket');
            socket.emit('eventFromServer', 'WebSocket connection established!');
        });

        // TODO: Server can't shut down gracefully for some godforsaken reason even with this
        process.on('sveltekit:shutdown', async (reason) => {
            io.sockets.sockets.forEach((socket) => {
                socket.emit('eventFromServer', 'Server is shutting down, disconnecting...');
                socket.disconnect(true);
            });
            io.close();
        });
    }

    public static getInstance(): WebSocketManager {
        if (!WebSocketManager.instance) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }
}