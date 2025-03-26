<script lang="ts">
  import { onMount } from 'svelte';
  import {navigate} from "sly-svelte-location-router";

  let apiKey = '';

  // Load API key from localStorage on component mount
  onMount(() => {
    const savedApiKey = localStorage.getItem('replicate_api_key');
    if (savedApiKey) {
      apiKey = savedApiKey;
    }
  });

  // Save API key to localStorage
  function saveApiKey() {
    localStorage.setItem('replicate_api_key', apiKey);
    navigate("/character")
  }
</script>

<div class="container">
    <div class="card">
        <h2>Replicate API Key</h2>
        <input
                type="password"
                bind:value={apiKey}
                placeholder="Enter your Replicate API key"
        />
        <button on:click={saveApiKey}>Save API Key</button>
        <p>
            As it says you need a replicate API key for this to work, go get one here
            <a href="https://replicate.com"> https://replicate.com</a>
        </p>
    </div>

</div>

<style>
    .container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
    }

    .card {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
        max-width: 400px;
        background-color: #7a7a7a;
        border-radius: 16px;
        padding: 16px;
        z-index: 2;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 1rem;
        border: 1px solid #ccc;
        border-radius: 8px;
    }

    button {
        padding: 0.75rem 1.5rem;
        background-color: #3730a3;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 600;
    }

    button:hover {
        background-color: #4f46e5;
    }

    h2 {
        margin-bottom: 1.5rem;
    }
</style>