<script lang="ts">
  import CharacterInfo from "../components/CharacterInfo.svelte";
  import type {CharacterContext} from "../lib/types";
  import {getCharacterStore, getSidebar} from "../lib/engine";
  import {onDestroy, setContext} from "svelte";
  import CharacterSheet from "../components/CharacterSheet.svelte";
  import AIChat from "../components/chat/AIChat.svelte";
  import Background from "../components/Background.svelte";
  import {navigate} from "sly-svelte-location-router";

  const {unsubscribe, ...chStore} = getCharacterStore()
  const {unsubscribeSidebar, sidebarStore} = getSidebar()

  setContext<CharacterContext>('character', chStore);
  setContext('sidebar', sidebarStore)

  onDestroy(() => {
    unsubscribe()
    unsubscribeSidebar()
  })

  if (!localStorage.getItem("replicate_api_key")) {
    navigate("/")
  }

</script>

<header>
    <CharacterInfo/>
</header>

<main style:--size-sidebar-curr={$sidebarStore ? 'var(--size-sidebar-max)' : '0'}>
    <CharacterSheet/>
    <aside>
        <AIChat/>
    </aside>

    <Background/>
</main>

<style>
    header {
        position: relative;
        width: 100%;
        height: 100px;
        display: flex;
        border-bottom: 1px solid var(--color-primary-main);
        z-index: 10;
    }

    main {
        position: relative;
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr var(--size-sidebar-curr);
        grid-template-rows: 1fr;
        overflow: hidden;
        transition: grid-template-columns 250ms ease-in-out;
    }

    aside {
        position: relative;
        top: 0;
        bottom: 0;
        right: 0;
        z-index: 10;
    }

    aside > button {
        position: absolute;
        top: 32px;
        width: 100%;
        left: -100%;
        overflow: visible;
        z-index: 10;
    }
</style>
