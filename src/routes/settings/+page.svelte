<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    let theme: string = $state('dark');
    let gridVisible: boolean = $state(true);
    let iconSize: string = $state('md');
    let aiChatEnabled: boolean = $state(true);

    // Initialize once from server data
    $effect.pre(() => {
        theme = data.settings.theme;
        gridVisible = data.settings.grid_visible === 1;
        iconSize = data.settings.icon_size;
        aiChatEnabled = data.settings.ai_chat_visible !== 0;
    });

    let saving = $state(false);
    let saved = $state(false);

    async function save() {
        saving = true;
        saved = false;
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ theme, grid_visible: gridVisible, icon_size: iconSize, ai_chat_visible: aiChatEnabled }),
            });
            if (res.ok) {
                saved = true;
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.setAttribute('data-icon-size', iconSize);
                localStorage.setItem('theme', theme);
                await invalidateAll();
            }
        } finally {
            saving = false;
        }
    }
</script>

<div class="wrapper">
    <div class="content">
        <h1>Beállítások</h1>

        <section>
            <h2>Megjelenés</h2>

            <label class="setting-row">
                <span>Téma</span>
                <div class="toggle-group">
                    <button
                        class:active={theme === 'dark'}
                        onclick={() => (theme = 'dark')}
                    >🌙 Sötét</button>
                    <button
                        class:active={theme === 'light'}
                        onclick={() => (theme = 'light')}
                    >☀️ Világos</button>
                </div>
            </label>

            <label class="setting-row">
                <span>Ikon méret</span>
                <div class="toggle-group">
                    <button class:active={iconSize === 'sm'} onclick={() => (iconSize = 'sm')}>Kis</button>
                    <button class:active={iconSize === 'md'} onclick={() => (iconSize = 'md')}>Közepes</button>
                    <button class:active={iconSize === 'lg'} onclick={() => (iconSize = 'lg')}>Nagy</button>
                </div>
            </label>
        </section>

        <section>
            <h2>AI Segítő</h2>

            <label class="setting-row">
                <span>AI chat gomb megjelenítése</span>
                <div class="toggle-group">
                    <button
                        class:active={aiChatEnabled}
                        onclick={() => (aiChatEnabled = true)}
                    >Bekapcsolva</button>
                    <button
                        class:active={!aiChatEnabled}
                        onclick={() => (aiChatEnabled = false)}
                    >Kikapcsolva</button>
                </div>
            </label>
        </section>

        <div class="actions">
            {#if saved}
                <span class="saved-msg">✓ Mentve</span>
            {/if}
            <button class="save-btn" onclick={save} disabled={saving}>
                {saving ? 'Mentés...' : 'Mentés'}
            </button>
        </div>
    </div>
</div>

<style>
    .wrapper {
        display: flex;
        justify-content: center;
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        width: 100%;
        max-width: 480px;
        margin: 2rem auto;
        padding: 2rem;
        background-color: var(--secondary-color);
        border-radius: 1rem;
    }

    h1 { text-align: center; }

    section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    h2 {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.6;
        margin-bottom: 0.25rem;
    }

    .setting-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        font-size: 0.95rem;
    }

    .checkbox-row input[type="checkbox"] {
        width: 1.2rem;
        height: 1.2rem;
        cursor: pointer;
        accent-color: var(--accent-color);
    }

    .toggle-group {
        display: flex;
        gap: 0.25rem;
    }

    .toggle-group button {
        padding: 0.35em 0.9em;
        font-size: 0.85rem;
        border: 1px solid transparent;
        border-radius: 0.375rem;
        background: var(--primary-color);
        color: var(--text-color);
        cursor: pointer;
        transition: background 0.1s, border-color 0.1s;
    }

    .toggle-group button.active {
        background: var(--tertiary-color);
        border-color: var(--accent-color);
    }

    .toggle-group button:hover:not(.active) {
        background: var(--tertiary-color);
        opacity: 0.7;
    }

    .actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 0.5rem;
    }

    .saved-msg {
        font-size: 0.85rem;
        color: #6fcf97;
    }

    .save-btn {
        padding: 0.6em 1.8em;
        background: var(--accent-color);
        color: var(--primary-color);
        border: none;
        border-radius: 0.5rem;
        font-weight: bold;
        cursor: pointer;
        transition: filter 0.1s;
    }

    .save-btn:hover  { filter: brightness(1.1); }
    .save-btn:active { filter: brightness(0.9); }
    .save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
