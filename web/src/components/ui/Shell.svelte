<script lang="ts">
  import type { Snippet } from 'svelte'
  import { navigate } from 'sly-svelte-location-router'
  import { user, userProfile, userDetails } from '$lib/stores/auth.store'
  import { uiStore, menuOpen, menuView, chatOpen } from '$lib/stores/ui.store'
  import { getClock, playNext, playPrev, playing, progress, seekSong, toggleSong, track } from '$lib/music'
  import Aura from './Aura.svelte'
  import Button from './Button.svelte'
  import Flame from './Flame.svelte'
  import Glass from './Glass.svelte'
  import Ornament from './Ornament.svelte'
  import Sigil from './Sigil.svelte'
  import Sidebar from './Sidebar.svelte'
  import Glyph from './Glyph.svelte'
  import IconBtn from './IconBtn.svelte'
  import StoredImage from './StoredImage.svelte'

  const {
    title,
    back,
    width = 'wide',
    flush = false,
    backdrop,
    nav,
    crown,
    band,
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
    /** Drops the padding and the hold so the body fills the content edge to edge. */
    flush?: boolean
    /** Painted across the content ground, under the veil and the page. */
    backdrop?: Snippet
    /** Controls placed on the bar after the name. */
    nav?: Snippet
    /** A full width head that scrolls away, drawn above the band. */
    crown?: Snippet
    /** A full width band that sticks once the crown has scrolled past. */
    band?: Snippet
    /** Screen actions placed on the bar before the profile chip. */
    tools?: Snippet
    /** The drawer that slides in from the start edge. */
    menu?: Snippet
    /** The drawer that slides in from the end edge. */
    chat?: Snippet
    /** The scrolling body of the page. */
    children?: Snippet
  } = $props()

  const name = $derived($userDetails?.display_name || $userProfile?.display_name || 'Adventurer')
  const initial = $derived(name.charAt(0).toUpperCase())
  const searchKey = navigator.userAgent.includes('Mac') ? 'Cmd K' : 'Ctrl K'

  function openProfile() {
    navigate('/main/user')
  }

  function reach() {
    const mark = location.hash.slice(1)
    if (!mark) return
    requestAnimationFrame(() => {
      document.getElementById(mark)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  $effect(() => {
    reach()
  })

  function stepDrawers(event: KeyboardEvent) {
    if (!event.shiftKey || !(event.metaKey || event.ctrlKey)) return

    if (event.key.toLowerCase() === 'c' && chat) {
      event.preventDefault()
      uiStore.toggleChat()
      return
    }

    if (event.key.toLowerCase() !== 's' || !menu) return

    event.preventDefault()
    uiStore.toggleMenu()
  }
</script>

<svelte:window onkeydown={stepDrawers} onhashchange={reach} />

<main
  class="dnd-shell"
  class:dnd-shell-menu-open={$menuOpen}
  class:dnd-shell-chat-open={$chatOpen}
>
  <header class="dnd-shell-bar">
    {#if menu}
      <span class="dnd-shell-handle">
        <Sigil title="Toggle the menu" size="sm" active={$menuOpen} onclick={uiStore.toggleMenu}>
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
      <Sigil title="Search {searchKey}" size="sm" onclick={uiStore.toggleSearchDialog}>
        <Glyph name="search" size="sm" />
      </Sigil>
    </span>

    {#if menu}
      <span class="dnd-shell-handle">
        <Sigil title="Music" size="sm" active={$menuOpen && $menuView === 'music'} onclick={uiStore.openMusic}>
          <Glyph name="music" size="sm" />
        </Sigil>
      </span>
    {/if}

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
        <Sigil title="Toggle the chat" size="sm" active={$chatOpen} onclick={uiStore.toggleChat}>
          <Glyph name="chat" size="sm" />
        </Sigil>
      </span>
    {/if}
  </header>

  {#if $track}
    <div class="dnd-shell-player" aria-label="Now playing">
      <span class="dnd-shell-player-acts">
        <IconBtn title="Previous" onclick={() => void playPrev()}>
          <Glyph name="prev" size="sm" />
        </IconBtn>
        <IconBtn title={$playing ? 'Pause' : 'Play'} tone="ember" onclick={toggleSong}>
          <Glyph name={$playing ? 'pause' : 'play'} size="sm" />
        </IconBtn>
        <IconBtn title="Next" onclick={() => void playNext()}>
          <Glyph name="next" size="sm" />
        </IconBtn>
      </span>
      <span class="dnd-shell-player-lines">
        <span class="dnd-shell-player-name">{$track.title}</span>
        <input
          class="dnd-shell-player-seek"
          type="range"
          min="0"
          max={$progress.length || 0}
          step="0.5"
          value={$progress.at}
          aria-label="Seek"
          oninput={(event) => seekSong(Number(event.currentTarget.value))}
        />
        <span class="dnd-shell-player-time">{getClock($progress.at)} / {getClock($progress.length)}</span>
      </span>
      {#if menu}
        <span class="dnd-shell-player-acts">
          <IconBtn title="Open the playlist" active={$menuOpen && $menuView === 'music'} onclick={uiStore.openMusic}>
            <Glyph name="music" size="sm" />
          </IconBtn>
        </span>
      {/if}
    </div>
  {/if}

  {#if menu}
    <Sidebar side="start" open={$menuOpen} run="var(--size-menu-max)">{@render menu()}</Sidebar>
  {/if}

  <div class="dnd-shell-content">
    {#if backdrop}
      <span class="dnd-shell-ground" aria-hidden="true">{@render backdrop()}</span>
    {/if}

    <div class="dnd-scroll dnd-shell-scroll" class:dnd-shell-scroll-flush={flush}>
      <span class="dnd-shell-veil" aria-hidden="true">
        <span class="dnd-shell-window"><Glass size="xl" /></span>
        <span class="dnd-shell-lantern dnd-shell-lantern-start"><Flame size="sm" intensity="steady" sconce hung /></span>
        <span class="dnd-shell-lantern dnd-shell-lantern-end"><Flame size="sm" intensity="calm" sconce hung /></span>
        <Aura variant="veil" tone="ember" />
        <Aura variant="motes" tone="ember" density="normal" />
      </span>

      {#if crown}
        <div class="dnd-shell-crown">{@render crown()}</div>
      {/if}

      {#if band}
        <div class="dnd-shell-band">{@render band()}</div>
      {/if}

      <div class="dnd-shell-hold dnd-shell-hold-{width}" class:dnd-shell-hold-flush={flush}>
        {@render children?.()}
      </div>
    </div>
  </div>

  {#if chat}
    <Sidebar side="end" open={$chatOpen} run="var(--size-chat-max)">{@render chat()}</Sidebar>
  {/if}
</main>

<style>
  .dnd-shell {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: var(--shell-menu) 1fr var(--shell-chat);
    grid-template-rows: var(--size-bar) 1fr;
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
    position: relative;
    grid-area: topbar;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: var(--size-bar);
    padding: 0 var(--space-5);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--stone-light) 22%, transparent) 0%, color-mix(in srgb, #000 40%, transparent) 55%, color-mix(in srgb, #000 70%, transparent) 100%),
      var(--texture-stone),
      var(--stone);
    border-bottom: none;
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    box-shadow: var(--shadow-bar), inset 0 1px 0 var(--sheen);
    z-index: 20;
  }

  .dnd-shell-bar::before {
    content: '';
    position: absolute;
    inset: auto var(--radius-lg) 0 var(--radius-lg);
    height: var(--border-hair);
    background: linear-gradient(90deg, transparent, var(--metal) 12%, var(--metal-bright) 50%, var(--metal) 88%, transparent);
    opacity: 0.5;
    pointer-events: none;
  }

  .dnd-shell-bar::after {
    content: '';
    position: absolute;
    inset: auto var(--radius-lg) calc(var(--arcade) * -1) var(--radius-lg);
    height: var(--arcade);
    background: radial-gradient(circle at 50% 35%, var(--metal-bright) 0%, var(--metal) 35%, var(--metal-dim) 70%, transparent 75%);
    background-size: var(--arcade-step) var(--arcade);
    background-repeat: repeat-x;
    opacity: 0.6;
    pointer-events: none;
  }

  .dnd-shell-player {
    --player-seek: calc(var(--space-8) * 2);
    --player-name: calc(var(--space-8) * 2.5);
    grid-area: topbar;
    justify-self: center;
    align-self: center;
    z-index: 21;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: calc(var(--size-bar) - var(--space-4));
    padding: 0 var(--space-3);
    background: var(--texture-noise), linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: none;
    border-radius: var(--radius-pill);
    box-shadow: var(--rim-thin), var(--bevel-down);
  }

  .dnd-shell-player-acts {
    display: flex;
    flex: none;
    align-items: center;
    height: var(--space-6);
  }

  .dnd-shell-player-lines {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      'name time'
      'seek seek';
    align-items: center;
    column-gap: var(--space-3);
    min-width: 0;
  }

  .dnd-shell-player-name {
    grid-area: name;
    max-width: var(--player-name);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: var(--font-display);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: var(--tracking-wide);
    color: var(--metal-bright);
  }

  .dnd-shell-player-time {
    grid-area: time;
    font-family: var(--font-figures);
    font-size: var(--text-xs);
    color: var(--ink-faint);
    white-space: nowrap;
  }

  .dnd-shell-player-seek {
    grid-area: seek;
    width: 100%;
    min-width: var(--player-seek);
    height: var(--space-2);
    margin: 0;
    accent-color: var(--metal);
    cursor: pointer;
  }

  .dnd-shell-tools {
    display: flex;
    flex: 0 1 auto;
    min-width: 0;
    align-items: center;
    gap: var(--space-2);
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
  }

  .dnd-shell-tools::-webkit-scrollbar {
    display: none;
  }

  .dnd-shell-split {
    flex: none;
    width: var(--border-hair);
    height: var(--size-split);
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
    text-shadow: 0 1px 0 #000, 0 0 12px var(--ember-glow);
  }

  .dnd-shell-nav {
    display: flex;
    flex: 20 1 0;
    min-width: 0;
    height: 100%;
    align-items: center;
    gap: var(--space-2);
    padding-inline-start: var(--space-4);
    border-inline-start: var(--border-hair) solid var(--metal-dim);
  }

  .dnd-shell-run {
    flex: 1 1 0;
    min-width: var(--space-4);
  }


  .dnd-shell-chip {
    display: flex;
    flex: none;
    align-items: center;
    gap: var(--space-3);
    max-width: var(--size-chip-max);
    padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
    background: var(--texture-noise), linear-gradient(180deg, var(--ground-deep) 0%, var(--ground) 100%);
    border: none;
    border-radius: var(--radius-pill);
    box-shadow: var(--rim-thin), var(--bevel-down);
    cursor: pointer;
    text-align: start;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .dnd-shell-chip:hover {
    box-shadow: var(--rim-thin), var(--bevel-down), var(--glow-metal);
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
    width: var(--size-face);
    height: var(--size-face);
    overflow: hidden;
    border-radius: var(--radius-pill);
    background: radial-gradient(circle at 38% 26%, var(--ground-lift) 0%, var(--ground-deep) 84%);
    box-shadow: inset 0 0 0 1px var(--keyline), inset 0 0 0 2px var(--metal), inset 0 2px 4px var(--shade-hard);
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
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--ink-faint);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dnd-shell-content {
    grid-area: content;
    position: relative;
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    container: shell / inline-size;
    background:
      var(--texture-noise),
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
    inset-block-start: 0;
    inset-inline: 0;
    block-size: 100%;
    z-index: -1;
    overflow: hidden;
    pointer-events: none;
    -webkit-mask-image: linear-gradient(180deg, black 60%, transparent 100%);
    mask-image: linear-gradient(180deg, black 60%, transparent 100%);
    background:
      var(--texture-motes),
      radial-gradient(ellipse 22% 38% at 6% 22%, color-mix(in srgb, var(--ember) 24%, transparent) 0%, transparent 70%),
      radial-gradient(ellipse 22% 38% at 94% 22%, color-mix(in srgb, var(--ember) 24%, transparent) 0%, transparent 70%),
      radial-gradient(ellipse 45% 55% at 50% 45%, color-mix(in srgb, var(--ember-glow) 30%, transparent) 0%, transparent 75%),
      radial-gradient(ellipse 90% 70% at 50% 50%, transparent 55%, color-mix(in srgb, var(--ground-deep) 85%, transparent) 100%);
  }

  .dnd-shell-window {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(1.35);
    opacity: 0.12;
    filter: sepia(0.6) saturate(0.7);
  }

  .dnd-shell-lantern {
    position: absolute;
    top: 14%;
    opacity: 0.4;
  }

  .dnd-shell-lantern-start {
    left: clamp(var(--space-1), 1.5cqi, var(--space-5));
  }

  .dnd-shell-lantern-end {
    right: clamp(var(--space-1), 1.5cqi, var(--space-5));
  }

  .dnd-shell-crown {
    position: relative;
    width: 100%;
    padding: var(--space-6) var(--space-6) var(--space-4);
  }

  .dnd-shell-band {
    position: sticky;
    top: 0;
    z-index: 3;
    width: 100%;
  }

  .dnd-shell-scroll {
    position: relative;
    z-index: 2;
    flex: 1;
    min-height: 0;
    overflow-x: hidden;
    overscroll-behavior-x: none;
  }

  .dnd-shell-hold {
    container: page / inline-size;
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
    min-width: 0;
    padding: clamp(var(--space-4), 3cqi, var(--space-6)) clamp(var(--space-3), 3cqi, var(--space-6)) var(--space-8);
    max-width: min(100%, var(--size-page-max));
    margin: 0 auto;
  }

  .dnd-shell-scroll-flush {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .dnd-shell-hold-flush {
    flex: 1;
    min-height: 0;
    max-width: none;
    margin: 0;
    gap: 0;
    padding: 0;
  }

  .dnd-shell-hold-narrow {
    max-width: 860px;
  }

  .dnd-shell-hold-wide {
    max-width: 1200px;
  }

  .dnd-shell > :global(.dnd-sidebar-start) {
    grid-area: menu;
  }

  .dnd-shell > :global(.dnd-sidebar-end) {
    grid-area: chat;
  }

  .dnd-shell-bar :global(.dnd-sigil[title]:hover::after),
  .dnd-shell-bar :global(.dnd-sigil[title]:focus-visible::after) {
    top: calc(100% + var(--space-1));
    bottom: auto;
  }

  @media (max-width: 1100px) {
    .dnd-shell-chip-lines {
      display: none;
    }

    .dnd-shell-chip {
      padding: var(--space-1);
    }
  }

  @container shell (max-width: 47.5rem) {
    .dnd-shell-lantern {
      display: none;
    }
  }

  @media (max-width: 860px) {
    .dnd-shell-mark,
    .dnd-shell-player-lines {
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

  @media (max-width: 560px) {
    .dnd-shell-bar {
      gap: var(--space-2);
      padding: 0 var(--space-3);
    }

    .dnd-shell-run,
    .dnd-shell-split {
      display: none;
    }
  }
</style>
