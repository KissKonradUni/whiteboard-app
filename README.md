# Whiteboard App

A whiteboard web application built as a university team project.

## Tech stack

- [SvelteKit](https://kit.svelte.dev/) with TypeScript
- [SQLite](https://www.sqlite.org/) via `better-sqlite3`
- [Express](https://expressjs.com/) as the HTTP server
- [Socket.io](https://socket.io/) for real-time WebSocket communication
- [bcrypt](https://www.npmjs.com/package/bcrypt) for password hashing

## Features

- User registration, login, logout and account deletion
- Session-based authentication
- Lobby system: create, join, leave
- Real-time communication between clients via WebSocket

## Requirements

- Node.js 18 or later
- npm

## Development

Install dependencies:

```sh
npm install
```

Start the development server:

```sh
npm run dev
```

The app will be available at `http://localhost:5173` by default.

## Production build

Build the app:

```sh
npm run build
```

Start the production server:

```sh
node server.js
```

## Type checking

```sh
npm run check
```
