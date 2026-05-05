<script lang="ts">
    import { templates, type Template } from '$lib/templates';

    let {
        selected = $bindable<Template | null>(null),
        random   = $bindable<boolean>(false),
    }: {
        selected?: Template | null;
        random?:   boolean;
    } = $props();

    function pickNone()   { selected = null; random = false; }
    function pickRandom() { selected = null; random = true;  }
    function pickTpl(tpl: Template) { selected = tpl; random = false; }
</script>

<div class="selector">
    <!-- None -->
    <button
        class="card none-card"
        class:active={!random && selected === null}
        onclick={pickNone}
        title="Sablon nélkül"
    >
        <span class="no-icon">✕</span>
        <span class="label">Nincs</span>
    </button>

    <!-- Random -->
    <button
        class="card random-card"
        class:active={random}
        onclick={pickRandom}
        title="Véletlenszerű sablon"
    >
        <span class="random-icon">🎲</span>
        <span class="label">Véletlen</span>
    </button>

    {#each templates as tpl}
        <button
            class="card"
            class:active={!random && selected?.id === tpl.id}
            onclick={() => pickTpl(tpl)}
            title={tpl.name}
        >
            <svg viewBox="0 0 200 200" class="preview" aria-hidden="true">
                <path
                    d={tpl.svgPath}
                    fill="rgba(80,130,220,0.12)"
                    stroke="currentColor"
                    stroke-width="5"
                    stroke-linejoin="round"
                    stroke-linecap="round"
                />
            </svg>
            <span class="label">{tpl.name}</span>
        </button>
    {/each}
</div>

<style>
    .selector {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        padding: 0.5rem 0;
    }

    .card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 3px;
        width: 56px;
        padding: 4px;
        border: 1px solid transparent;
        border-radius: 0.4rem;
        background: var(--primary-color);
        cursor: pointer;
        color: var(--text-color);
        transition: border-color 0.1s, background 0.1s;
    }

    .card:hover { background: var(--tertiary-color); opacity: 0.8; }

    .card.active {
        border-color: var(--accent-color);
        background: var(--tertiary-color);
    }

    .preview {
        width: 44px;
        height: 44px;
        display: block;
    }

    .label {
        font-size: 0.58rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 52px;
    }

    .no-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        opacity: 0.4;
        border: 1px dashed currentColor;
        border-radius: 0.25rem;
        box-sizing: border-box;
    }

    .random-icon {
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        box-sizing: border-box;
    }
</style>
