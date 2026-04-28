<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { wsClient } from "$lib/stores/websocket-client";

    type WSStatus = "connected" | "disconnected" | "error";

    let canvasEl: HTMLCanvasElement | null = $state(null);
    let ctx: CanvasRenderingContext2D | null = $state(null);

    // Placeholder websocket variables for future whiteboard sync logic.
    let wsStatus: WSStatus = $state("disconnected");
    let roomId: string = $state("default-room");
    let lastSyncPayload: unknown = $state(null);

    let unsubscribeStatus: (() => void) | null = null;

    const handleWhiteboardSync = (payload: unknown) => {
        lastSyncPayload = payload;
    };

    function emitWhiteboardSync(payload: unknown) {
        wsClient?.emit("whiteboard:sync", {
            roomId,
            payload
        });
    }

    function setupCanvas() {
        if (!canvasEl) {
            return;
        }

        ctx = canvasEl.getContext("2d");
        if (!ctx) {
            return;
        }

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);
    }

    onMount(() => {
        setupCanvas();

        if (wsClient) {
            unsubscribeStatus = wsClient.status.subscribe((status) => {
                wsStatus = status;
            });

            wsClient.on("whiteboard:sync", handleWhiteboardSync);
        }
    });

    onDestroy(() => {
        unsubscribeStatus?.();
        wsClient?.off("whiteboard:sync", handleWhiteboardSync);
    });
</script>

<section class="whiteboard-page">
    <div class="meta">
        <h2>Whiteboard</h2>
        <p>Socket: {wsStatus}</p>
        <label>
            Room:
            <input type="text" bind:value={roomId} />
        </label>
        <button onclick={() => emitWhiteboardSync({ type: "ping", at: Date.now() })}>
            Send test sync event
        </button>
        {#if lastSyncPayload}
            <p class="muted">Sync payload received.</p>
        {/if}
    </div>

    <canvas bind:this={canvasEl} width="1280" height="720" aria-label="Whiteboard canvas"></canvas>
</section>

<style>
    .whiteboard-page {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .meta {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .meta input {
        margin-left: 0.5rem;
        padding: 0.4rem 0.6rem;
    }

    canvas {
        width: 100%;
        max-width: 100%;
        aspect-ratio: 16 / 9;
        border: 1px solid #666;
        border-radius: 0.5rem;
        background-color: #fff;
    }

    .muted {
        opacity: 0.7;
    }
</style>
