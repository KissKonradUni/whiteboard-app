import { Server } from 'socket.io';
import { server } from './build/index.js';

async function start() {
    const io = new Server(server.server);
    globalThis.io = io;
}
start();