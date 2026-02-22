import { sveltekit } from '@sveltejs/kit/vite';
import { Server } from 'socket.io';
import { defineConfig, type ViteDevServer } from 'vite';

const webSocketPlugin = {
    name: 'websocket-plugin',
    configureServer(server: ViteDevServer) {
        if (!server.httpServer) return;

        const io = new Server(server.httpServer);
        //@ts-ignore Global variable for socket.io
        globalThis.io = io;
    }
}

export default defineConfig({
	plugins: [webSocketPlugin, sveltekit()]
});
