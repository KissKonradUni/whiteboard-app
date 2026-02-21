<script lang="ts">
	import type { Migration } from "$lib/database/migration";

    export let data: { migrations: Migration[] };
</script>

<h2>Migrations</h2>
<ul>
    {#each data.migrations as migration}
        <li>{migration.name} (applied at {migration.applied_at})</li>
    {/each}
</ul>