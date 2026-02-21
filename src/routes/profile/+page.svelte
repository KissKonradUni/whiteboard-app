<script lang="ts">
	import type { User } from "$lib/database/user";
	import type { LayoutData } from "../$types";

    let { data }: { data: LayoutData } = $props();

    function deleteAccount() {
        if (confirm("Are you sure you want to delete your account?\nThis action cannot be undone.")) {
            fetch('/api/delete-account', { method: 'POST' })
                .then(response => {
                    if (response.ok) {
                        window.location.href = '/';
                    } else {
                        alert("Failed to delete account.");
                    }
                })
                .catch(() => {
                    alert("An error occurred while trying to delete the account.");
                });
        }
    }
</script>


<div class="wrapper">
    <div class="content">
        <h1>Profile</h1>

        {#if data.loggedIn}
            <p>Name: {data.user?.name}</p>
            <p>Email: {data.user?.email}</p>
        
            <button class="delete" onclick={deleteAccount}>
                Delete Account
            </button>
        {:else}
            <p>You are not logged in.</p>
        {/if}
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
        
        gap: 0.5rem;
        max-width: 400px;
        
        margin: 2rem auto;
        padding: 2rem;

        background-color: var(--secondary-color);
        border-radius: 1rem;
    }

    h1 {
        text-align: center;
        margin-bottom: 0.5em;
    }

    p {
        margin: 0.5rem 0;
    }

    .delete {
        background-color: #ffa0a0;
        color: var(--primary-color);
        
        border: none;
        border-radius: 0.5rem;

        margin-top: 1rem;
        padding: 0.75em 1.5em;

        cursor: pointer;

        transition: filter 0.1s ease-in-out;
    }

    .delete:hover {
        filter: brightness(110%);
    }

    .delete:active {
        filter: brightness(90%);
    }
</style>