<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { wsClient } from "$lib/stores/websocket-client";
    import Whiteboard from "$lib/whiteboard";

    let { data }: { data: { hash: string; lobbyName: string; user: { id: number; name: string } } } = $props();

    let wrapperEl: HTMLDivElement | null = $state(null);
    let canvasEl: HTMLCanvasElement | null = $state(null);
    let whiteboard: Whiteboard | null = $state(null);

    let wsStatus: "connected" | "disconnected" | "error" = $state("disconnected");
    let lastSyncPayload: unknown = $state(null);

    let unsubscribeStatus: (() => void) | null = null;

    const handleWhiteboardSync = (event: unknown) => {
        if (!event || typeof event !== "object") {
            return;
        }

        const payload = (event as { payload?: unknown }).payload;
        lastSyncPayload = payload ?? null;
    };

    function emitWhiteboardSync(payload: unknown) {
        wsClient?.emit("whiteboard:sync", {
            hash: data.hash,
            payload
        });
    }

    function setupCanvas() {
        if (!wrapperEl || !canvasEl) {
            return;
        }

        whiteboard = new Whiteboard(wrapperEl, canvasEl);
    }

    onMount(() => {
        setupCanvas();

        if (wsClient) {
            unsubscribeStatus = wsClient.status.subscribe((status) => {
                wsStatus = status;
            });

            wsClient.on("whiteboard:sync", handleWhiteboardSync);
            wsClient.emit("whiteboard:join", { hash: data.hash });
        }
    });

    onDestroy(() => {
        unsubscribeStatus?.();
        wsClient?.off("whiteboard:sync", handleWhiteboardSync);
    });
</script>

<div class="meta">
    <h2>{data.lobbyName} Whiteboard</h2>
    <p>Socket: {wsStatus}</p>
    <button onclick={() => emitWhiteboardSync({ type: "ping", at: Date.now(), userId: data.user.id })}>
        Send test sync event
    </button>
    {#if lastSyncPayload}
        <p class="muted">Sync payload received.</p>
    {/if}
</div>

<div class="canvas-wrapper" bind:this={wrapperEl}>
    <canvas bind:this={canvasEl} width="1000" height="10" aria-label="Whiteboard canvas"></canvas>
</div>

<style>
    .meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .canvas-wrapper {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    canvas {
        width: 100%;
        max-width: 100%;

        border: 1px solid #666;
        border-radius: 0.5rem;
        background-color: #fff;
    }

    .muted {
        opacity: 0.7;
    }
</style>
