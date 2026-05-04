<script lang="ts">
    import type { PageData } from './$types';

    let { data }: { data: PageData } = $props();

    function deleteAccount() {
        if (confirm('Biztosan törlöd a fiókod?\nEz a művelet visszavonhatatlan.')) {
            fetch('/api/delete-account', { method: 'POST' })
                .then(res => {
                    if (res.ok) window.location.href = '/';
                    else alert('Nem sikerült törölni a fiókot.');
                })
                .catch(() => alert('Hiba történt.'));
        }
    }

    function formatDate(iso: string | null | undefined): string {
        if (!iso) return '–';
        return new Date(iso).toLocaleDateString('hu-HU', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }
</script>

<div class="wrapper">
    <div class="content">
        <h1>Profil</h1>

        {#if data.loggedIn}
            <section class="info">
                <div class="info-row"><span>Név</span><strong>{data.user?.name}</strong></div>
                <div class="info-row"><span>Email</span><strong>{data.user?.email}</strong></div>
            </section>

            <section>
                <h2>Statisztikák</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <span class="stat-value">{data.stats?.total_strokes ?? 0}</span>
                        <span class="stat-label">Rajzolt elem</span>
                    </div>
                    <div class="stat-card">
                        <span class="stat-value">{data.stats?.total_sessions ?? 0}</span>
                        <span class="stat-label">Session</span>
                    </div>
                    <div class="stat-card wide">
                        <span class="stat-value">{formatDate(data.stats?.last_active)}</span>
                        <span class="stat-label">Utolsó aktivitás</span>
                    </div>
                </div>
            </section>

            <button class="delete" onclick={deleteAccount}>Fiók törlése</button>
        {:else}
            <p>Nem vagy bejelentkezve.</p>
        {/if}
    </div>
</div>

<style>
    .wrapper { display: flex; justify-content: center; }

    .content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 420px;
        width: 100%;
        margin: 2rem auto;
        padding: 2rem;
        background-color: var(--secondary-color);
        border-radius: 1rem;
    }

    h1 { text-align: center; }

    h2 {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.6;
        margin-bottom: 0.5rem;
    }

    .info { display: flex; flex-direction: column; gap: 0.4rem; }

    .info-row {
        display: flex;
        justify-content: space-between;
        font-size: 0.95rem;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
    }

    .stat-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0.8rem;
        background: var(--primary-color);
        border-radius: 0.5rem;
        gap: 0.2rem;
    }

    .stat-card.wide { grid-column: span 2; }

    .stat-value {
        font-size: 1.4rem;
        font-weight: bold;
        color: var(--accent-color);
    }

    .stat-label {
        font-size: 0.7rem;
        opacity: 0.7;
        text-transform: uppercase;
    }

    .delete {
        background-color: #7a2020;
        color: #ffd0d0;
        border: none;
        border-radius: 0.5rem;
        margin-top: 0.5rem;
        padding: 0.75em 1.5em;
        cursor: pointer;
        transition: filter 0.1s;
    }

    .delete:hover  { filter: brightness(1.2); }
    .delete:active { filter: brightness(0.9); }
</style>
