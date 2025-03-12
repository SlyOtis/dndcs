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
    <h2>Replicate API Key</h2>
    <input
            type="password"
            bind:value={apiKey}
            placeholder="Enter your Replicate API key"
    />
    <button on:click={saveApiKey}>Save API Key</button>
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        max-width: 400px;
        margin: 0 auto;
        padding: 2rem;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        margin-bottom: 1rem;
        border: 1px solid #ccc;
        border-radius: 4px;
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
        color: #333;
    }
</style>