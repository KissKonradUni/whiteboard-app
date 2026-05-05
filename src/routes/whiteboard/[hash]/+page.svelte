<script lang="ts">
    import { onDestroy, onMount } from "svelte";
    import { wsClient } from "$lib/stores/websocket-client";
    import Whiteboard, { type Tool, type WhiteboardElement } from "$lib/whiteboard";
    import { templates } from "$lib/templates";

    let { data }: { data: { hash: string; lobbyName: string; user: { id: number; name: string } } } = $props();

    let wrapperEl: HTMLDivElement | null = $state(null);
    let canvasEl: HTMLCanvasElement | null = $state(null);
    let whiteboard: Whiteboard | null = $state(null);

    let wsStatus: "connected" | "disconnected" | "error" = $state("disconnected");
    let selectedTool: Tool = $state("pen");
    let selectedColor: string = $state("#000000");
    let selectedWidth: number = $state(3);
    let showGrid: boolean = $state(true);

    // Stack of element IDs created by this user (for undo)
    let myElementIds: string[] = [];

    let unsubscribeStatus: (() => void) | null = null;

    // Sync tool/color/width/grid to whiteboard instance whenever they change
    $effect(() => { whiteboard?.setTool(selectedTool); });
    $effect(() => { whiteboard?.setColor(selectedColor); });
    $effect(() => { whiteboard?.setWidth(selectedWidth); });
    $effect(() => { whiteboard?.setGrid(showGrid); });

    // --- WebSocket event handlers ---

    const handleSync = (event: unknown) => {
        if (!event || typeof event !== "object") return;
        const { payload } = event as { payload?: { action?: string; element?: unknown } };
        if (payload?.action === "add" && payload.element) {
            whiteboard?.addElement(payload.element as WhiteboardElement);
        }
    };

    const handleState = (event: unknown) => {
        if (!event || typeof event !== "object") return;
        const { elements, templateId } = event as { elements?: { data: unknown }[]; templateId?: string | null };
        if (Array.isArray(elements)) {
            for (const stored of elements) {
                if (stored?.data) whiteboard?.addElement(stored.data as WhiteboardElement);
            }
        }
        if (templateId) {
            whiteboard?.setTemplate(templates.find(t => t.id === templateId) ?? null);
        }
    };

    const handleUndo = (event: unknown) => {
        if (!event || typeof event !== "object") return;
        const { elementId } = event as { elementId?: string };
        if (elementId) whiteboard?.removeById(elementId);
    };

    const handleCursor = (event: unknown) => {
        if (!event || typeof event !== "object") return;
        const { userId, userName, x, y } = event as {
            userId?: number; userName?: string; x?: number; y?: number;
        };
        if (userId != null && userName && typeof x === "number" && typeof y === "number") {
            whiteboard?.setPeerCursor(userId, userName, x, y);
        }
    };

    const handleCursorLeave = (event: unknown) => {
        if (!event || typeof event !== "object") return;
        const { userId } = event as { userId?: number };
        if (userId != null) whiteboard?.removePeerCursor(userId);
    };

    // --- Undo ---

    function undo() {
        const id = myElementIds.pop();
        if (!id || !whiteboard) return;
        whiteboard.removeById(id);
        wsClient?.emit("whiteboard:undo", { hash: data.hash, elementId: id });
    }

    function handleKeydown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key === "z") {
            e.preventDefault();
            undo();
        }
    }

    function handleMouseLeave() {
        wsClient?.emit("whiteboard:cursor:leave", { hash: data.hash });
    }

    // --- Canvas setup ---

    function setupCanvas() {
        if (!wrapperEl || !canvasEl) return;
        whiteboard = new Whiteboard(wrapperEl, canvasEl);

        whiteboard.onElementAdded = (el) => {
            if (el.id) myElementIds.push(el.id);
            wsClient?.emit("whiteboard:sync", {
                hash: data.hash,
                payload: { action: "add", element: el },
            });
        };

        whiteboard.onCursorMove = (x, y) => {
            wsClient?.emit("whiteboard:cursor", { hash: data.hash, x, y });
        };
    }

    onMount(() => {
        setupCanvas();
        window.addEventListener("keydown", handleKeydown);
        window.addEventListener("mouseleave", handleMouseLeave);

        if (wsClient) {
            unsubscribeStatus = wsClient.status.subscribe((s) => { wsStatus = s; });
            wsClient.on("whiteboard:sync",         handleSync);
            wsClient.on("whiteboard:state",        handleState);
            wsClient.on("whiteboard:undo",         handleUndo);
            wsClient.on("whiteboard:cursor",       handleCursor);
            wsClient.on("whiteboard:cursor:leave", handleCursorLeave);
            wsClient.emit("whiteboard:join", { hash: data.hash });
        }
    });

    onDestroy(() => {
        unsubscribeStatus?.();
        window.removeEventListener("keydown", handleKeydown);
        window.removeEventListener("mouseleave", handleMouseLeave);
        wsClient?.off("whiteboard:sync",         handleSync);
        wsClient?.off("whiteboard:state",        handleState);
        wsClient?.off("whiteboard:undo",         handleUndo);
        wsClient?.off("whiteboard:cursor",       handleCursor);
        wsClient?.off("whiteboard:cursor:leave", handleCursorLeave);
    });

    const tools: { id: Tool; label: string; icon: string }[] = [
        { id: "pen",     label: "Toll",      icon: "✏" },
        { id: "line",    label: "Vonal",     icon: "╱" },
        { id: "rect",    label: "Téglalap",  icon: "□" },
        { id: "ellipse", label: "Ellipszis", icon: "○" },
        { id: "text",    label: "Szöveg",    icon: "T" },
        { id: "eraser",  label: "Radír",     icon: "⌫" },
        { id: "pan",     label: "Mozgatás",  icon: "✋" },
    ];

    const cursorMap: Record<Tool, string> = {
        pen:     "none",
        line:    "none",
        rect:    "none",
        ellipse: "none",
        text:    "none",
        eraser:  "none",
        pan:     "grab",
    };
</script>

<div class="meta">
    <h2>{data.lobbyName}</h2>
    <span class="status" class:connected={wsStatus === "connected"}>{wsStatus}</span>
    <div class="spacer"></div>
    <button class="meta-btn" title="Letöltés PNG-ként" onclick={() => whiteboard?.exportPng()}>
        ⬇ Letöltés
    </button>
</div>

<div class="board-area">
    <aside class="toolbar">
        <div class="tool-group">
            {#each tools as tool}
                <button
                    class="tool-btn"
                    class:active={selectedTool === tool.id}
                    title={tool.label}
                    onclick={() => (selectedTool = tool.id)}
                >
                    <span class="icon">{tool.icon}</span>
                    <span class="label">{tool.label}</span>
                </button>
            {/each}
        </div>

        <hr />

        <div class="tool-group color-group">
            <label class="color-label" title="Szín">
                <input type="color" bind:value={selectedColor} />
            </label>
            <label class="width-label" title="Vastagság">
                <input type="range" min="1" max="30" bind:value={selectedWidth} />
                <span class="width-value">{selectedWidth}px</span>
            </label>
        </div>

        <hr />

        <div class="tool-group">
            <button
                class="tool-btn"
                class:active={showGrid}
                title="Rács be/ki"
                onclick={() => (showGrid = !showGrid)}
            >
                <span class="icon">#</span>
                <span class="label">Rács</span>
            </button>
            <button
                class="tool-btn"
                title="Visszavonás (Ctrl+Z)"
                onclick={undo}
            >
                <span class="icon">↩</span>
                <span class="label">Vissza</span>
            </button>
        </div>
    </aside>

    <div
        class="canvas-wrapper"
        bind:this={wrapperEl}
        style="cursor: {cursorMap[selectedTool]}"
    >
        <canvas bind:this={canvasEl} width="1000" height="10" aria-label="Whiteboard canvas"></canvas>
    </div>
</div>

<style>
    .meta {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
    }

    .meta h2 { margin: 0; }

    .spacer { flex: 1; }

    .meta-btn {
        padding: 0.35em 0.9em;
        font-size: 0.8rem;
        border: 1px solid #aaa;
        border-radius: 0.375rem;
        background: transparent;
        cursor: pointer;
        color: inherit;
        transition: background 0.1s;
    }

    .meta-btn:hover { background: #ffffff22; }

    .status {
        font-size: 0.75rem;
        padding: 0.2em 0.6em;
        border-radius: 999px;
        background: #44444488;
        color: #aaa;
    }

    .status.connected {
        background: #1a4a2a;
        color: #6fcf97;
    }

    .board-area {
        flex: 1;
        display: flex;
        min-height: 0;
        gap: 0.5rem;
    }

    .toolbar {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        width: 80px;
        flex-shrink: 0;
        background: var(--secondary-color);
        border: 1px solid #ffffff22;
        border-radius: 0.5rem;
        padding: 0.5rem;
    }

    .tool-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .tool-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: 0.4rem 0.25rem;
        border: 1px solid transparent;
        border-radius: 0.375rem;
        background: transparent;
        cursor: pointer;
        color: var(--text-color);
        transition: background 0.1s;
    }

    .tool-btn .icon {
        font-size: var(--toolbar-icon-font, 1.1rem);
        line-height: 1;
    }

    .tool-btn .label {
        font-size: var(--toolbar-label-font, 0.6rem);
        white-space: nowrap;
    }

    .tool-btn:hover { background: #ffffff18; }

    .tool-btn.active {
        background: var(--tertiary-color);
        border-color: var(--accent-color);
    }

    hr {
        border: none;
        border-top: 1px solid #ffffff22;
        margin: 0.25rem 0;
    }

    .color-group { gap: 0.5rem; }

    .color-label input[type="color"] {
        width: 100%;
        height: 32px;
        border: 1px solid #ffffff33;
        border-radius: 0.25rem;
        padding: 2px;
        cursor: pointer;
        background: none;
    }

    .width-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        font-size: 0.65rem;
        color: var(--text-color);
        opacity: 0.8;
    }

    .width-label input[type="range"] {
        width: 100%;
        cursor: pointer;
    }

    .canvas-wrapper {
        flex: 1;
        min-width: 0;
        min-height: 0;
        border: 1px solid #ffffff22;
        border-radius: 0.5rem;
        overflow: hidden;
        background: #fff;
    }

    canvas {
        width: 100%;
        height: 100%;
        display: block;
    }
</style>
