<script lang="ts">
    import { onDestroy } from "svelte";
    import { untrack } from "svelte";
    import { goto } from "$app/navigation";
    import type { Lobby } from "$lib/server/lobby";
    import type { Template } from "$lib/templates";
    import { templates } from "$lib/templates";
    import { wsClient } from "$lib/stores/websocket-client";
    import TemplateSelector from "$lib/components/TemplateSelector.svelte";

    let { data }: { data: { currentLobby: Lobby | null, lobbies: Lobby[], user: { id: number, name: string } } } = $props();

    let lobbyName: string = $state("");
    let joinHash: string = $state("");
    let currentLobby: Lobby | null = $state(untrack(() => data.currentLobby));
    let lobbies: Lobby[] = $state(untrack(() => data.lobbies));
    let errorMsg: string = $state("");

    // Template selection for create
    let selectedTemplate: Template | null = $state(null);
    let randomTemplate: boolean = $state(false);
    let showTemplateSelector: boolean = $state(false);

    // Matchmaking state
    let isSearching: boolean = $state(false);

    // --- Lobby update from WS ---

    function applyLobbySnapshot(snapshot: Lobby[]) {
        lobbies = snapshot;
        currentLobby = snapshot.find((lobby) =>
            lobby.users?.some((user) => user.id === data.user.id)
        ) ?? null;
    }

    const handleLobbyUpdate = (payload: unknown) => {
        if (Array.isArray(payload)) applyLobbySnapshot(payload as Lobby[]);
    };

    // --- Matchmaking ---

    const handleMatchmakingWaiting = () => { isSearching = true; };

    const handleMatchmakingMatched = (payload: unknown) => {
        isSearching = false;
        const { hash } = payload as { hash: string };
        goto(`/whiteboard/${hash}`);
    };

    const handleMatchmakingCancelled = () => { isSearching = false; };

    const handleMatchmakingError = (payload: unknown) => {
        isSearching = false;
        const { message } = payload as { message: string };
        errorMsg = message;
    };

    if (wsClient) {
        wsClient.on("lobby:update",          handleLobbyUpdate);
        wsClient.on("matchmaking:waiting",   handleMatchmakingWaiting);
        wsClient.on("matchmaking:matched",   handleMatchmakingMatched);
        wsClient.on("matchmaking:cancelled", handleMatchmakingCancelled);
        wsClient.on("matchmaking:error",     handleMatchmakingError);
    }

    onDestroy(() => {
        wsClient?.off("lobby:update",          handleLobbyUpdate);
        wsClient?.off("matchmaking:waiting",   handleMatchmakingWaiting);
        wsClient?.off("matchmaking:matched",   handleMatchmakingMatched);
        wsClient?.off("matchmaking:cancelled", handleMatchmakingCancelled);
        wsClient?.off("matchmaking:error",     handleMatchmakingError);
        if (isSearching) wsClient?.emit("matchmaking:leave");
    });

    function startMatchmaking() {
        if (currentLobby) {
            errorMsg = "Először hagyd el az aktuális lobbyt.";
            return;
        }
        errorMsg = "";
        wsClient?.emit("matchmaking:join");
    }

    function cancelMatchmaking() {
        wsClient?.emit("matchmaking:leave");
        isSearching = false;
    }

    // --- Lobby actions ---

    async function createLobby() {
        errorMsg = "";
        if (!lobbyName.trim()) {
            errorMsg = "Kérlek adj meg egy lobby nevet.";
            return;
        }
        // If "random" was chosen, pick a random template client-side
        const finalTemplateId = randomTemplate
            ? templates[Math.floor(Math.random() * templates.length)].id
            : (selectedTemplate?.id ?? null);

        const res = await fetch(`/lobby/create/${encodeURIComponent(lobbyName.trim())}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ templateId: finalTemplateId }),
        });
        const body = await res.json();
        if (res.ok) {
            currentLobby = body;
            lobbies = [body, ...lobbies.filter(l => l.hash !== body.hash)];
            lobbyName = "";
            selectedTemplate = null;
            randomTemplate = false;
            showTemplateSelector = false;
        } else {
            errorMsg = body.error ?? "Nem sikerült létrehozni a lobbyt.";
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
            errorMsg = body.error ?? "Nem sikerült csatlakozni a lobbyhoz.";
        }
    }

    async function joinByHash() {
        errorMsg = "";
        if (!joinHash.trim()) {
            errorMsg = "Kérlek add meg a lobby kódot.";
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
            lobbies = lobbies.filter(l => {
                if (l.hash !== prevHash) return true;
                return (l.users?.filter(u => u.id !== data.user.id).length ?? 0) > 0;
            });
        } else {
            errorMsg = body.error ?? "Nem sikerült kilépni a lobbyból.";
        }
    }
</script>

<div class="wrapper">
    <h2>Lobby</h2>

    {#if errorMsg}
        <p class="error">{errorMsg}</p>
    {/if}

    {#if currentLobby}
        <!-- ───── In a lobby ───── -->
        <div class="current-lobby">
            <h3>
                {currentLobby.name}
                {#if currentLobby.templateId}
                    <span class="template-badge">🎨 Sablon</span>
                {/if}
            </h3>
            <p class="hash">Kód: <code>{currentLobby.hash}</code></p>
            <h4>Játékosok ({currentLobby.users?.length ?? 0})</h4>
            <ul>
                {#each currentLobby.users ?? [] as user}
                    <li>{user.name}</li>
                {/each}
            </ul>
            <div class="lobby-actions">
                <button onclick={() => goto(`/whiteboard/${currentLobby?.hash}`)}>Whiteboard megnyitása</button>
                <button class="danger" onclick={leaveLobby}>Kilépés</button>
            </div>
        </div>

    {:else}
        <!-- ───── No lobby ───── -->
        <div class="actions">

            <!-- Create card -->
            <div class="card">
                <h3>Lobby létrehozása</h3>
                <input
                    type="text"
                    placeholder="Lobby neve"
                    bind:value={lobbyName}
                    onkeydown={e => e.key === "Enter" && createLobby()}
                />

                <!-- Template toggle -->
                <button
                    class="template-toggle"
                    class:active={showTemplateSelector}
                    onclick={() => (showTemplateSelector = !showTemplateSelector)}
                >
                    {#if randomTemplate}
                        🎲 Sablon: Véletlen
                    {:else if selectedTemplate}
                        🎨 Sablon: {selectedTemplate.name}
                    {:else}
                        🎨 Sablon választása (opcionális)
                    {/if}
                </button>

                {#if showTemplateSelector}
                    <TemplateSelector bind:selected={selectedTemplate} bind:random={randomTemplate} />
                {/if}

                <button onclick={createLobby}>Létrehozás</button>
            </div>

            <!-- Join by code card -->
            <div class="card">
                <h3>Csatlakozás kóddal</h3>
                <input
                    type="text"
                    placeholder="Lobby kód"
                    bind:value={joinHash}
                    onkeydown={e => e.key === "Enter" && joinByHash()}
                />
                <button onclick={joinByHash}>Csatlakozás</button>
            </div>

            <!-- Random matchmaking card -->
            <div class="card matchmaking-card">
                <h3>Véletlen párosítás</h3>
                <p class="muted">Keress egy véletlenszerű partnert a rajzoláshoz.</p>
                {#if isSearching}
                    <div class="searching">
                        <span class="spinner">⟳</span>
                        <span>Keresés folyamatban…</span>
                    </div>
                    <button class="danger" onclick={cancelMatchmaking}>Mégsem</button>
                {:else}
                    <button class="match-btn" onclick={startMatchmaking}>🎲 Párosítás indítása</button>
                {/if}
            </div>
        </div>

        <!-- Available lobbies list -->
        <div class="lobby-list">
            <h3>Elérhető lobbyк ({lobbies.length})</h3>
            {#if lobbies.length === 0}
                <p class="muted">Még nincs lobby. Hozz létre egyet!</p>
            {:else}
                <ul>
                    {#each lobbies as lobby}
                        <li class="lobby-item">
                            <div>
                                <span class="lobby-name">
                                    {lobby.name}
                                    {#if lobby.templateId}
                                        <span class="template-badge">🎨</span>
                                    {/if}
                                </span>
                                <span class="lobby-meta">
                                    {lobby.users?.length ?? 0} játékos &bull; <code>{lobby.hash}</code>
                                </span>
                            </div>
                            <button onclick={() => joinLobby(lobby.hash)}>Csatlakozás</button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    {/if}
</div>

<style>
    .wrapper {
        width: min(700px, 95%);
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
        align-items: flex-start;
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

    .matchmaking-card {
        flex: 0 1 220px;
    }

    .current-lobby {
        background-color: var(--secondary-color);
        border-radius: 1rem;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .hash { font-size: 0.9rem; opacity: 0.75; margin: 0; }

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

    .lobby-actions {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.25rem;
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
    .muted { opacity: 0.6; font-size: 0.9rem; margin: 0; }

    .template-badge {
        font-size: 0.72rem;
        background: var(--accent-color);
        color: var(--primary-color);
        padding: 0.1em 0.45em;
        border-radius: 999px;
        font-weight: normal;
        vertical-align: middle;
        margin-left: 0.35rem;
    }

    .template-toggle {
        background: var(--primary-color);
        color: var(--text-color);
        border: 1px dashed var(--accent-color);
        border-radius: 0.375rem;
        padding: 0.35em 0.75em;
        font-size: 0.82rem;
        cursor: pointer;
        text-align: left;
        transition: background 0.1s;
    }

    .template-toggle:hover,
    .template-toggle.active {
        background: var(--tertiary-color);
    }

    .searching {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        opacity: 0.85;
    }

    .spinner {
        display: inline-block;
        animation: spin 1.2s linear infinite;
        font-size: 1.1rem;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .match-btn {
        background: var(--accent-color);
        color: var(--primary-color);
        border: none;
        border-radius: 0.4rem;
        padding: 0.6rem 1rem;
        font-weight: bold;
        cursor: pointer;
        font-size: 0.9rem;
        transition: filter 0.1s;
    }

    .match-btn:hover { filter: brightness(1.1); }

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
        background-color: #c0392b;
        color: #fff;
    }
</style>
