<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	let { data: userData, children }: { data: LayoutData, children: Snippet } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
    <h1>Whiteboard App</h1>

    <div class="space"></div>

    {#if userData.loggedIn}
        <span>Welcome, {userData.name}!</span>
    {/if}
</header>
<nav>
    <button>
        <a href="/" tabindex="-1">Home</a>
    </button>
    
    <div class="space"></div>

    {#if userData.loggedIn}
        <button>
            <a href="/logout" tabindex="-1">Logout</a>
        </button>
    {:else}
         <button>
            <a href="/login" tabindex="-1">Login</a>
        </button>
        <button>
            <a href="/register" tabindex="-1">Register</a>
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
        padding: 0.5rem 1rem 0 1rem;
    }

    div.space {
        flex-grow: 1;
    }

    button {
        background-color: var(--tertiary-color);
        border: none;
        border-radius: 0.5rem;

        transition: filter 0.1s ease-in-out;
    }

    button:hover {
        filter: brightness(1.1);
    }

    button:active {
        filter: brightness(0.9);
    }

    button a {
        display: block;
        
        color: var(--text-color);

        padding: 0.75rem 1rem;
    }

    header span {
        margin: 0 0.5rem;
        font-weight: bold;
    }

    nav {
        display: flex;
        gap: 0.5rem;
        padding: 0.5rem;

        background-color: var(--secondary-color);
    }

    main {
        padding: 1rem;
    }
</style>