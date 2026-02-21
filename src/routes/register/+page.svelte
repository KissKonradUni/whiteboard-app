<script lang="ts">
    let form: HTMLFormElement;
    let nameInput: HTMLInputElement;
    let emailInput: HTMLInputElement;
    let passwordInput: HTMLInputElement;

    async function register() {
        const name = nameInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        if (response.ok) {
            window.location.href = '/login';
        } else {
            const errorData = await response.json();
            alert('Registration failed. Please check your details and try again. Error: ' + errorData.error);
        }
    }
</script>

<form action="/api/register" method="post" bind:this={form} onsubmit={(e) => { e.preventDefault(); register(); }}>
    <h1>Register</h1>

    <label for="name">Name: </label>
    <input type="text" id="name" name="name" required bind:this={nameInput} />
    <br />
    <label for="email">Email:</label>
    <input type="email" id="email" name="email" required bind:this={emailInput} />
    <br />
    <label for="password">Password:</label>
    <input type="password" id="password" name="password" required bind:this={passwordInput} />
    <br />
    <button type="submit">Register</button>
</form>

<style>
    form {
        display: flex;
        flex-direction: column;
        
        gap: 0.5rem;
        max-width: 400px;
        
        margin: 2rem auto;
        padding: 2rem;

        background-color: var(--secondary-color);
        border-radius: 1rem;
    }

    form h1 {
        text-align: center;
    }

    label {
        font-weight: bold;
    }

    input {
        padding: 0.5rem;
        border: 1px solid black;
        border-radius: 0.25rem;
    }

    button {
        padding: 0.75rem;
        
        background-color: var(--tertiary-color);
        color: var(--text-color);
        
        border: none;
        border-radius: 0.25rem;
        
        cursor: pointer;

        transition: filter 0.1s ease-in-out;
    }

    button:hover {
        filter: brightness(1.1);
    }

    button:active {
        filter: brightness(0.9);
    }
</style>