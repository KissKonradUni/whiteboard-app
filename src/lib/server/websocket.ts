import type { Server } from "socket.io";

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

    private connectIfAvailable(): void {
        if (this.io) {
            return;
        }

        //@ts-ignore Global variable from custom server.js file
        const io = (globalThis.io as Server | undefined) ?? null;
        if (!io) {
            return;
        }

        this.io = io;
        this.bindHandlers(io);
    }

    private bindHandlers(io: Server): void {
        if (this.handlersBound) {
            return;
        }

        io.on('connection', (socket) => {
            console.log('A client connected via WebSocket');
            socket.emit('eventFromServer', 'WebSocket connection established!');
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
}