import { type Socket, io } from "socket.io-client";

export class WebsocketClient {
    private static instance: WebsocketClient
    private socket: Socket | null;

    private constructor() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
        });

        this.socket.on('eventFromServer', (data) => {
            console.log('Received event from server:', data);
        });
    }

    public static getInstance(): WebsocketClient {
        if (!WebsocketClient.instance) {
            WebsocketClient.instance = new WebsocketClient();
        }
        return WebsocketClient.instance;
    }
}