<script lang="ts">
  import type { Snippet } from 'svelte'
  import { navigate } from 'sly-svelte-location-router'
  import { user, userProfile, userDetails } from '$lib/stores/auth.store'
  import { uiStore } from '$lib/stores/ui.store'
  import Aura from './Aura.svelte'
  import Button from './Button.svelte'
  import Ornament from './Ornament.svelte'
  import Sigil from './Sigil.svelte'
  import Glyph from './Glyph.svelte'
  import StoredImage from './StoredImage.svelte'

  const {
    title,
    back,
    width = 'wide',
    backdrop,
    nav,
    tools,
    menu,
    chat,
    children
  }: {
    /** The name written on the bar beside the crest. */
    title: string
    /** Runs when the back arrow is pressed. The arrow is drawn only when it is given. */
    back?: () => void
    /** Sets how far the content is allowed to run before it is held in the middle. */
    width?: 'narrow' | 'wide' | 'full'
    /** Painted across the content ground, under the veil and the page. */
    backdrop?: Snippet
    /** Controls placed on the bar after the name. */
    nav?: Snippet
    /** Screen actions placed on the bar before the profile chip. */
    tools?: Snippet
    /** The drawer that slides in from the start edge. */
    menu?: Snippet
    /** The drawer that slides in from the end edge. */
    chat?: Snippet
    /** The scrolling body of the page. */
    children?: Snippet
  } = $props()

  let menuOpen = $state(false)
  let chatOpen = $state(false)

  const name = $derived($userDetails?.display_name || $userProfile?.display_name || 'Adventurer')
  const initial = $derived(name.charAt(0).toUpperCase())
  const searchKey = navigator.userAgent.includes('Mac') ? 'Cmd K' : 'Ctrl K'

  function openProfile() {
    navigate('/user')
  }

</script>

<main
  class="dnd-shell"
  class:dnd-shell-menu-open={menuOpen}
  class:dnd-shell-chat-open={chatOpen}
>
  <header class="dnd-shell-bar">
    {#if menu}
      <span class="dnd-shell-handle">
        <Sigil title="Toggle the menu" size="sm" frame="cusped" active={menuOpen} onclick={() => (menuOpen = !menuOpen)}>
          <Glyph name="menu" size="sm" />
        </Sigil>
      </span>
    {:else}
      <span class="dnd-shell-crest"><Ornament name="rosette" size="sm" tone="metal" /></span>
    {/if}

    {#if back}
      <Button variant="ghost" size="sm" onclick={back}>Back</Button>
    {/if}

    <span class="dnd-shell-mark">{title}</span>

    {#if nav}
      <nav class="dnd-shell-nav" aria-label="Page">{@render nav()}</nav>
    {/if}

    <span class="dnd-shell-run" aria-hidden="true"></span>

    {#if tools}
      <span class="dnd-shell-tools">{@render tools()}</span>
    {/if}

    <span class="dnd-shell-handle">
      <Sigil title="Search {searchKey}" size="sm" frame="ring" onclick={uiStore.toggleSearchDialog}>
        <Glyph name="search" size="sm" />
      </Sigil>
    </span>

    <span class="dnd-shell-split" aria-hidden="true"></span>

    <button type="button" class="dnd-shell-chip" onclick={openProfile} title="Your profile">
      <span class="dnd-shell-chip-face">
        {#if $userProfile?.photo_url}
          <StoredImage src={$userProfile.photo_url} alt="" />
        {:else}
          <span class="dnd-shell-chip-initial">{initial}</span>
        {/if}
      </span>
      <span class="dnd-shell-chip-lines">
        <span class="dnd-shell-chip-name">{name}</span>
        <span class="dnd-shell-chip-mail">{$user?.email ?? ''}</span>
      </span>
    </button>


    {#if chat}
      <span class="dnd-shell-handle">
        <Sigil title="Toggle the chat" tone="verdigris" size="sm" frame="lobed" active={chatOpen} onclick={() => (chatOpen = !chatOpen)}>
          <Glyph name="chat" size="sm" />
        </Sigil>
      </span>
    {/if}
  </header>

  {#if menu}
    <aside class="dnd-shell-aside dnd-shell-aside-menu">{@render menu()}</aside>
  {/if}

  <div class="dnd-shell-content">
    {#if backdrop}
      <span class="dnd-shell-ground" aria-hidden="true">{@render backdrop()}</span>
    {/if}

    <span class="dnd-shell-veil" aria-hidden="true">
      <Aura variant="veil" tone="verdigris" />
      <Aura variant="motes" tone="ember" density="sparse" />
    </span>

    <div class="dnd-scroll dnd-shell-scroll">
      <div class="dnd-shell-hold dnd-shell-hold-{width}">
        {@render children?.()}
      </div>
    </div>
  </div>

  {#if chat}
    <aside class="dnd-shell-aside dnd-shell-aside-chat">{@render chat()}</aside>
  {/if}
</main>

<style>
  .dnd-shell {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: var(--shell-menu) 1fr var(--shell-chat);
    grid-template-rows: 68px 1fr;
    grid-template-areas:
      'topbar topbar topbar'
      'menu content chat';
    overflow: hidden;
    transition: grid-template-columns 250ms ease-in-out;
    background: var(--backdrop);
    --shell-menu: 0px;
    --shell-chat: 0px;
    --size-menu-max: 400px;
    --size-chat-max: 400px;
  }

  .dnd-shell-menu-open {
    --shell-menu: var(--size-menu-max);
  }

  .dnd-shell-chat-open {
    --shell-chat: var(--size-chat-max);
  }

  .dnd-shell-bar {
    grid-area: topbar;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: 68px;
    padding: 0 var(--space-5);
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-lift) 0%, var(--ground) 70%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border-bottom: var(--border-hair) solid var(--metal-dim);
    box-shadow: 0 4px 18px var(--shade), inset 0 1px 0 var(--metal-edge);
    z-index: 20;
  }

  .dnd-shell-tools {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-2);
  }

  .dnd-shell-split {
    flex: none;
    width: 1px;
    height: 28px;
    background: var(--metal-dim);
  }

  .dnd-shell-crest,
  .dnd-shell-handle {
    display: flex;
    flex: none;
  }

  .dnd-shell-mark {
    flex: none;
    max-width: 40vw;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--metal-bright);
    text-shadow: var(--glow-metal);
  }

  .dnd-shell-nav {
    display: flex;
    flex: 0 1 auto;
    min-width: 0;
    gap: var(--space-2);
    overflow-x: auto;
    scrollbar-width: none;
    padding-inline-start: var(--space-4);
    border-inline-start: var(--border-hair) solid var(--metal-dim);
  }

  .dnd-shell-nav::-webkit-scrollbar {
    display: none;
  }

  .dnd-shell-run {
    flex: 1;
    min-width: var(--space-4);
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--metal-dim) 50%, transparent);
  }


  .dnd-shell-chip {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-3);
    max-width: 260px;
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
    background: linear-gradient(180deg, var(--ground-lift) 0%, var(--ground-deep) 100%);
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-pill);
    cursor: pointer;
    text-align: start;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .dnd-shell-chip:hover {
    border-color: var(--metal);
    box-shadow: var(--glow-metal);
  }

  .dnd-shell-chip:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  .dnd-shell-chip-face {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    overflow: hidden;
    border-radius: var(--radius-pill);
    background: radial-gradient(circle at 38% 26%, var(--ground-lift) 0%, var(--ground-deep) 84%);
    box-shadow: inset 0 0 0 var(--border-hair) var(--metal-dim);
  }

  .dnd-shell-chip-face :global(img) {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .dnd-shell-chip-initial {
    font-family: var(--font-display);
    font-size: var(--text-md);
    font-weight: 700;
    color: var(--metal);
  }

  .dnd-shell-chip-lines {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .dnd-shell-chip-name {
    font-family: var(--font-display);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--metal-bright);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dnd-shell-chip-mail {
    font-family: var(--font-mono);
    font-size: var(--text-xs);
    color: var(--ink-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dnd-shell-content {
    grid-area: content;
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background:
      var(--texture-motes),
      radial-gradient(ellipse at 50% -10%, var(--verdigris-dim) 0%, transparent 60%),
      linear-gradient(180deg, var(--ground) 0%, var(--ground-deep) 100%);
  }

  .dnd-shell-ground {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .dnd-shell-veil {
    position: absolute;
    inset: 0;
    z-index: 1;
    overflow: hidden;
    pointer-events: none;
  }

  .dnd-shell-scroll {
    position: relative;
    z-index: 2;
    height: 100%;
    overflow-x: hidden;
    overscroll-behavior-x: none;
    padding: var(--space-6) var(--space-6) var(--space-8);
  }

  .dnd-shell-hold {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    min-width: 0;
    max-width: 100%;
    margin: 0 auto;
  }

  .dnd-shell-hold-narrow {
    max-width: 860px;
  }

  .dnd-shell-hold-wide {
    max-width: 1200px;
  }

  .dnd-shell-aside {
    position: relative;
    overflow: hidden;
    z-index: 10;
    background:
      var(--texture-weave),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    box-shadow: 0 0 24px var(--shade-hard);
    transform: translateX(var(--translate-x, 0));
    transition: transform 250ms ease-in-out;
  }

  .dnd-shell-aside-menu {
    grid-area: menu;
    border-right: var(--border-width) solid var(--metal-dim);
    --translate-x: calc(-100% - 2px);
  }

  .dnd-shell-aside-chat {
    grid-area: chat;
    border-left: var(--border-width) solid var(--metal-dim);
    --translate-x: calc(100% + 2px);
  }

  .dnd-shell-menu-open .dnd-shell-aside-menu,
  .dnd-shell-chat-open .dnd-shell-aside-chat {
    --translate-x: 0;
  }

  @media (max-width: 1100px) {
    .dnd-shell-chip-lines {
      display: none;
    }

    .dnd-shell-chip {
      padding: var(--space-1);
    }
  }

  @media (max-width: 860px) {
    .dnd-shell-mark {
      display: none;
    }

    .dnd-shell-nav {
      padding-inline-start: 0;
      border-inline-start: none;
    }

    .dnd-shell-scroll {
      padding: var(--space-4) var(--space-4) var(--space-7);
    }
  }
</style>
