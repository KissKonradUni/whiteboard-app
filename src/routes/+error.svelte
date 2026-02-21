<script lang="ts">
    import { page } from '$app/state';
</script>

<h1>
    {page.status} - {page.error?.message || 'An unexpected error occurred'}
</h1>

<div class="wrapper">
    <div class="content">
        <p><b>Page-chan:</b> Are you... lost?</p>
        <p><b>User-kun: </b> Yeah, I think I took a wrong turn somewhere.</p>
        <p><b>Page-chan:</b> Don't worry, it happens to the best of us. Just head back to the <a href="/">home page</a> and try again!</p>
    </div>
</div>

<style>
    h1 {
        font-size: 2em;
        margin: 1em 0em;
        text-align: center;
    }

    div.wrapper {
        display: flex;
        justify-content: center;
        align-items: center;

        padding: 1em;
    }

    div.content {
        background-color: var(--tertiary-color);

        padding: 2em;
        max-width: 80ch;

        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    p {
        font-size: 1.2em;
        margin-bottom: 1em;
    }
</style>