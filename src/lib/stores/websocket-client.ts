import { browser } from '$app/environment';
import { writable } from 'svelte/store';
import { type Socket, io } from 'socket.io-client';

type WSStatus = 'connected' | 'disconnected' | 'error';

export class WebsocketClient {
    private static instance: WebsocketClient;
    private socket: Socket | null = null;

    public readonly status = writable<WSStatus>('disconnected');

    private constructor() {
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            this.status.set('connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from WebSocket server');
            this.status.set('disconnected');
        });

        this.socket.on('connect_error', (err) => {
            console.error('Connection error:', err);
            this.status.set('error');
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

    public emit(event: string, data?: unknown): void {
        this.socket?.emit(event, data);
    }

    public on(event: string, callback: (...args: unknown[]) => void): void {
        this.socket?.on(event, callback);
    }

    public off(event: string, callback?: (...args: unknown[]) => void): void {
        this.socket?.off(event, callback);
    }

    public disconnect(): void {
        this.socket?.disconnect();
        this.socket = null;
    }
}

// Instantiated once in the browser, null on the server
export const wsClient = browser ? WebsocketClient.getInstance() : null;