<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
    import { goto } from '$app/navigation';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	import { wsClient } from '$lib/stores/websocket-client';

	let { data: data, children }: { data: LayoutData, children: Snippet } = $props();

    function navTo(path: string) {
        return () => goto(path);
    }
    
    wsClient;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
    <h1>Whiteboard App</h1>

    <div class="space"></div>

    {#if data.loggedIn}
        <button onclick={navTo('/profile')}>
            Welcome, {data.user?.name}!
        </button>
    {/if}
</header>
<nav>
    <button onclick={navTo('/')}>
        Home
    </button>
    {#if data.loggedIn}
        <button onclick={navTo('/lobby')}>
            Lobby
        </button>
    {/if}
    
    <div class="space"></div>

    {#if data.loggedIn}
        <button onclick={navTo('/logout')}>
            Logout
        </button>
    {:else}
         <button onclick={navTo('/login')}>
            Login
        </button>
        <button onclick={navTo('/register')}>
            Register
        </button>
    {/if}
</nav>

<main>
    {@render children()}
</main>

<footer>

</footer>

<style>
    header {
        display: flex;
        align-items: center;
        
        gap: 0.5rem;
        padding-right: 0.5rem;

        background-color: var(--secondary-color);
    }

    header h1 {
        padding: 0.5rem 1rem 0.25rem 1rem;
    }

    div.space {
        flex-grow: 1;
    }

    button {
        background-color: var(--tertiary-color);
        border: none;
        border-radius: 0.5rem;

        padding: 0.75em 1.5em;
        height: 100%;

        transition: filter 0.1s ease-in-out;
    }

    button:hover {
        filter: brightness(1.1);
    }

    button:active {
        filter: brightness(0.9);
    }

    nav {
        display: flex;
        gap: 0.5rem;
        
        padding: 0.5rem;
        padding-top: 0;

        background-color: var(--secondary-color);
    }

    main {
        padding: 1rem;
    }
</style>