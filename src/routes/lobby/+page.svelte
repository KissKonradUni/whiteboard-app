<script lang="ts">
    import { onDestroy } from "svelte";
    import { untrack } from "svelte";
    import type { Lobby } from "$lib/server/lobby";
    import { wsClient } from "$lib/stores/websocket-client";

    let { data }: { data: { currentLobby: Lobby | null, lobbies: Lobby[], user: { id: number, name: string } } } = $props();

    let lobbyName: string = $state("");
    let joinHash: string = $state("");
    let currentLobby: Lobby | null = $state(untrack(() => data.currentLobby));
    let lobbies: Lobby[] = $state(untrack(() => data.lobbies));
    let errorMsg: string = $state("");

    function applyLobbySnapshot(snapshot: Lobby[]) {
        lobbies = snapshot;
        currentLobby = snapshot.find((lobby) =>
            lobby.users?.some((user) => user.id === data.user.id)
        ) ?? null;
    }

    const handleLobbyUpdate = (payload: unknown) => {
        if (!Array.isArray(payload)) {
            return;
        }

        applyLobbySnapshot(payload as Lobby[]);
    };

    if (wsClient) {
        wsClient.on("lobby:update", handleLobbyUpdate);
    }

    onDestroy(() => {
        wsClient?.off("lobby:update", handleLobbyUpdate);
    });

    async function createLobby() {
        errorMsg = "";
        if (!lobbyName.trim()) {
            errorMsg = "Please enter a lobby name.";
            return;
        }
        const res = await fetch(`/lobby/create/${encodeURIComponent(lobbyName.trim())}`, { method: "POST" });
        const body = await res.json();
        if (res.ok) {
            currentLobby = body;
            lobbies = [body, ...lobbies.filter(l => l.hash !== body.hash)];
            lobbyName = "";
        } else {
            errorMsg = body.error ?? "Failed to create lobby.";
        }
    }

    async function joinLobby(hash: string) {
        errorMsg = "";
        const res = await fetch(`/lobby/join/${hash}`, { method: "POST" });
        const body = await res.json();
        if (res.ok) {
            currentLobby = body;
            lobbies = lobbies.map(l => l.hash === body.hash ? body : l);
        } else {
            errorMsg = body.error ?? "Failed to join lobby.";
        }
    }

    async function joinByHash() {
        errorMsg = "";
        if (!joinHash.trim()) {
            errorMsg = "Please enter a lobby code.";
            return;
        }
        await joinLobby(joinHash.trim());
        joinHash = "";
    }

    async function leaveLobby() {
        errorMsg = "";
        const res = await fetch("/lobby/leave", { method: "POST" });
        const body = await res.json();
        if (res.ok) {
            const prevHash = currentLobby?.hash;
            currentLobby = null;
            // Remove lobby from list if it was deleted (no remaining users)
            lobbies = lobbies.filter(l => {
                if (l.hash !== prevHash) return true;
                return (l.users?.filter(u => u.id !== data.user.id).length ?? 0) > 0;
            });
        } else {
            errorMsg = body.error ?? "Failed to leave lobby.";
        }
    }
</script>

<div class="wrapper">
    <h2>Lobby</h2>

    {#if errorMsg}
        <p class="error">{errorMsg}</p>
    {/if}

    {#if currentLobby}
        <div class="current-lobby">
            <h3>{currentLobby.name}</h3>
            <p class="hash">Code: <code>{currentLobby.hash}</code></p>
            <h4>Players ({currentLobby.users?.length ?? 0})</h4>
            <ul>
                {#each currentLobby.users ?? [] as user}
                    <li>{user.name}</li>
                {/each}
            </ul>
            <button class="danger" onclick={leaveLobby}>Leave Lobby</button>
        </div>
    {:else}
        <div class="actions">
            <div class="card">
                <h3>Create Lobby</h3>
                <input type="text" placeholder="Lobby name" bind:value={lobbyName} onkeydown={e => e.key === "Enter" && createLobby()} />
                <button onclick={createLobby}>Create</button>
            </div>
            <div class="card">
                <h3>Join by Code</h3>
                <input type="text" placeholder="Lobby code" bind:value={joinHash} onkeydown={e => e.key === "Enter" && joinByHash()} />
                <button onclick={joinByHash}>Join</button>
            </div>
        </div>

        <div class="lobby-list">
            <h3>Available Lobbies ({lobbies.length})</h3>
            {#if lobbies.length === 0}
                <p class="muted">No lobbies yet. Create one!</p>
            {:else}
                <ul>
                    {#each lobbies as lobby}
                        <li class="lobby-item">
                            <div>
                                <span class="lobby-name">{lobby.name}</span>
                                <span class="lobby-meta">
                                    {lobby.users?.length ?? 0} player(s) &bull; <code>{lobby.hash}</code>
                                </span>
                            </div>
                            <button onclick={() => joinLobby(lobby.hash)}>Join</button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>

<style>
    .wrapper {
        max-width: 700px;
        margin: 2rem auto;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    h2 { font-size: 1.75rem; }

    .error {
        color: #ffa0a0;
        background-color: #3a0000;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
    }

    .actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .card {
        flex: 1;
        min-width: 200px;
        background-color: var(--secondary-color);
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .current-lobby {
        background-color: var(--secondary-color);
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .hash { font-size: 0.9rem; opacity: 0.75; }

    .current-lobby ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .current-lobby li {
        padding: 0.4rem 0.75rem;
        background-color: var(--tertiary-color);
        border-radius: 0.4rem;
    }

    .lobby-list {
        background-color: var(--secondary-color);
        border-radius: 1rem;
        padding: 1.5rem;
    }

    .lobby-list ul {
        list-style: none;
        padding: 0;
        margin: 0.75rem 0 0 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .lobby-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem 1rem;
        background-color: var(--tertiary-color);
        border-radius: 0.5rem;
    }

    .lobby-name { font-weight: bold; display: block; }
    .lobby-meta { font-size: 0.85rem; opacity: 0.75; }
    .muted { opacity: 0.6; }

    input {
        padding: 0.5rem;
        border: 1px solid #aaa;
        border-radius: 0.25rem;
        background-color: var(--primary-color);
        color: var(--text-color);
    }

    button {
        padding: 0.6rem 1.2rem;
        background-color: var(--accent-color);
        color: var(--primary-color);
        border: none;
        border-radius: 0.4rem;
        cursor: pointer;
        font-weight: bold;
        transition: filter 0.1s ease-in-out;
    }

    button:hover { filter: brightness(1.1); }
    button:active { filter: brightness(0.9); }

    button.danger {
        background-color: #ffa0a0;
        margin-top: 0.5rem;
        align-self: flex-start;
    }
</style>
