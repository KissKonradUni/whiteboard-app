<script lang="ts">
    type Message = { role: 'user' | 'assistant'; content: string };

    let open = $state(false);
    let input = $state('');
    let messages: Message[] = $state([]);
    let loading = $state(false);
    let error = $state('');
    let chatEl: HTMLDivElement | null = $state(null);

    function toggle() { open = !open; }

    function scrollToBottom() {
        setTimeout(() => {
            if (chatEl) chatEl.scrollTop = chatEl.scrollHeight;
        }, 0);
    }

    async function send() {
        const text = input.trim();
        if (!text || loading) return;

        input = '';
        error = '';
        messages = [...messages, { role: 'user', content: text }];
        loading = true;
        scrollToBottom();

        try {
            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: messages.slice(0, -1),
                }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({ message: 'Ismeretlen hiba' }));
                throw new Error(err.message ?? 'Szerverhiba');
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error('Nincs stream');

            const decoder = new TextDecoder();
            let buffer = '';
            let assistantText = '';

            messages = [...messages, { role: 'assistant', content: '' }];

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                let boundary;
                while ((boundary = buffer.indexOf('\n')) !== -1) {
                    const line = buffer.slice(0, boundary).trim();
                    buffer = buffer.slice(boundary + 1);

                    if (!line.startsWith('data: ')) continue;

                    const raw = line.slice(6).trim();
                    if (!raw || raw === '[DONE]') continue;

                    try {
                        const event = JSON.parse(raw);

                        if (
                            event.type === 'content_block_delta' &&
                            event.delta?.type === 'text_delta'
                        ) {
                            assistantText += event.delta.text;

                            messages = [
                                ...messages.slice(0, -1),
                                { role: 'assistant', content: assistantText },
                            ];

                            scrollToBottom();
                        }
                    } catch {
                        // wait for full JSON chunk
                    }
                }
            }

        } catch (e: unknown) {
            error = e instanceof Error ? e.message : 'Hiba történt.';
            messages = messages.slice(0, -1);
        } finally {
            loading = false;
            scrollToBottom();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    }
</script>

<!-- Floating button -->
<button class="fab" class:open onclick={toggle} title="AI Segítő">
    {open ? '✕' : '?'}
</button>

<!-- Chat panel -->
{#if open}
    <div class="panel">
        <div class="panel-header">
            <span>AI Segítő</span>
            <span class="model-tag">Haiku</span>
        </div>

        <div class="messages" bind:this={chatEl}>
            {#if messages.length === 0}
                <p class="hint">Kérdezz bármit az alkalmazás használatáról!</p>
            {/if}

            {#each messages as msg}
                <div class="bubble {msg.role}">
                    {#if msg.role === 'assistant' && msg.content === '' && loading}
                        <span class="typing">●●●</span>
                    {:else}
                        {msg.content}
                    {/if}
                </div>
            {/each}

            {#if error}
                <div class="error-msg">{error}</div>
            {/if}
        </div>

        <div class="input-row">
            <textarea
                bind:value={input}
                onkeydown={handleKeydown}
                placeholder="Írj üzenetet… (Enter = küld)"
                rows="2"
                disabled={loading}
            ></textarea>
            <button class="send-btn" onclick={send} disabled={loading || !input.trim()}>
                {loading ? '…' : '➤'}
            </button>
        </div>
    </div>
{/if}

<style>
    .fab {
        position: fixed;
        bottom: 1.5rem;
        right: 1.5rem;
        z-index: 200;

        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        border: none;
        background: var(--accent-color);
        color: var(--primary-color);
        font-size: 1.3rem;
        font-weight: bold;
        cursor: pointer;
        box-shadow: 0 4px 12px #0006;
        transition: transform 0.15s, background 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .fab:hover { transform: scale(1.08); }
    .fab.open  { background: var(--tertiary-color); }

    .panel {
        position: fixed;
        bottom: 5rem;
        right: 1.5rem;
        z-index: 199;

        width: 320px;
        max-height: 480px;
        display: flex;
        flex-direction: column;

        background: var(--secondary-color);
        border: 1px solid #ffffff22;
        border-radius: 1rem;
        box-shadow: 0 8px 32px #0008;
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        font-weight: bold;
        font-size: 0.9rem;
        border-bottom: 1px solid #ffffff18;
        background: var(--tertiary-color);
    }

    .model-tag {
        font-size: 0.65rem;
        opacity: 0.7;
        font-weight: normal;
        background: #ffffff22;
        padding: 0.1em 0.5em;
        border-radius: 999px;
    }

    .messages {
        flex: 1;
        overflow-y: auto;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .hint {
        font-size: 0.8rem;
        opacity: 0.5;
        text-align: center;
        margin: auto;
        padding: 1rem;
    }

    .bubble {
        max-width: 85%;
        padding: 0.5rem 0.75rem;
        border-radius: 0.75rem;
        font-size: 0.85rem;
        line-height: 1.45;
        white-space: pre-wrap;
        word-break: break-word;
    }

    .bubble.user {
        align-self: flex-end;
        background: var(--tertiary-color);
        border-bottom-right-radius: 0.2rem;
    }

    .bubble.assistant {
        align-self: flex-start;
        background: var(--primary-color);
        border-bottom-left-radius: 0.2rem;
    }

    .typing {
        opacity: 0.5;
        animation: pulse 1s infinite;
        letter-spacing: 0.2em;
    }

    @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50%       { opacity: 0.9; }
    }

    .error-msg {
        font-size: 0.8rem;
        color: #ff8888;
        padding: 0.4rem 0.5rem;
    }

    .input-row {
        display: flex;
        gap: 0.4rem;
        padding: 0.6rem;
        border-top: 1px solid #ffffff18;
    }

    textarea {
        flex: 1;
        resize: none;
        background: var(--primary-color);
        color: var(--text-color);
        border: 1px solid #ffffff22;
        border-radius: 0.5rem;
        padding: 0.4rem 0.6rem;
        font-size: 0.82rem;
        font-family: inherit;
        line-height: 1.4;
    }

    textarea:focus { outline: 1px solid var(--accent-color); }
    textarea:disabled { opacity: 0.5; }

    .send-btn {
        width: 2.2rem;
        flex-shrink: 0;
        background: var(--accent-color);
        color: var(--primary-color);
        border: none;
        border-radius: 0.5rem;
        font-size: 1rem;
        cursor: pointer;
        transition: filter 0.1s;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .send-btn:hover:not(:disabled) { filter: brightness(1.1); }
    .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
</style>