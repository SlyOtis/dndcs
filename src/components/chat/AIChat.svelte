<script lang="ts">

  import {getRollLog} from "../../lib/engine";
  import {onDestroy, getContext} from "svelte";
  import {differenceInMilliseconds, format} from 'date-fns'
  import {type ChatLog, detectAction, getReplicateLog} from "../../lib/chat";
  import ChatItem from "./ChatItem.svelte";

  const {unsubscribeRoll, rollStore} = getRollLog()
  const {unsubscribeReplicate, replicateStore} = getReplicateLog()
  
  // Get dialog state from context to disable chat when dialogs are open
  const dialogState = getContext<{isAnyDialogOpen: boolean, setDialogState: (isOpen: boolean) => void}>('dialogState');
  let isDialogOpen = $derived(dialogState?.isAnyDialogOpen || false);

  onDestroy(() => {
    unsubscribeRoll()
    unsubscribeReplicate()
    
    // Clean up chat theme event listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('chatThemeChanged', handleChatThemeChanged);
    }
  })

  let chatLog: ChatLog = $derived.by(() => {
    const rollItems = $rollStore.map(curr => ({
      createdAt: new Date(curr.rolledAt),
      type: 'roll' as const,
      data: curr
    }));

    const chatItems = $replicateStore.map(curr => ({
      createdAt: curr.sentAt,
      type: 'chat' as const,
      data: curr
    }));

    return [...rollItems, ...chatItems].sort((a, b) => {
      return differenceInMilliseconds(a.createdAt, b.createdAt)
    })
  })

  let chatInput: string = $state("")
  let stateThinking = $state<string | undefined>(undefined)
  let stateError = $state<string | undefined>(undefined)
  let showHidden = $state<boolean>(false)
  let isScrollTheme = $state<boolean>(localStorage.getItem('chat_scroll_theme') === 'true')
  let scroller: HTMLElement
  
  // Listen for chat theme changes from the top bar
  function handleChatThemeChanged(event: Event) {
    const customEvent = event as CustomEvent;
    isScrollTheme = customEvent.detail.isScrollTheme;
  }
  
  // Set up event listener for theme changes
  if (typeof window !== 'undefined') {
    window.addEventListener('chatThemeChanged', handleChatThemeChanged);
  }

  $effect(() => {
    chatLog.length || stateThinking?.length || stateError?.length || showHidden;
    scroller.scrollTo(0, scroller.scrollHeight)
  })

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSend(e)
    }
  }

  function onSend(e: Event) {
    e.preventDefault()
    e.stopPropagation()

    if (!chatInput.length) {
      return
    }

    stateThinking = "Thinking about it"
    detectAction(chatInput).then(() => stateThinking = undefined).catch((err: any) => {
      stateThinking = undefined
      stateError = err.message || 'An error occurred'
    })
    if (document.activeElement && 'blur' in document.activeElement) {
      (document.activeElement as HTMLElement).blur();
    }
    chatInput = ''
  }


</script>

<div class="root" class:disabled={isDialogOpen} class:scroll-theme={isScrollTheme}>
    <div class="inner" class:scroll-theme={isScrollTheme}>
        <div class="scroll" bind:this={scroller} class:scroll-theme={isScrollTheme}>
            <ul class:scroll-theme={isScrollTheme}>
                {#each chatLog as logItem}
                    <ChatItem {logItem} {showHidden} scrollTheme={isScrollTheme} />
                {/each}
            </ul>
        </div>
        {#if stateThinking || stateError}
            <div class="status" class:error={stateError?.length}>
                <span class="thinking">{stateThinking || stateError}</span>
            </div>
        {/if}
        <div class="input" class:disabled={stateThinking?.length || stateError?.length || isDialogOpen} class:scroll-theme={isScrollTheme}>
            <textarea bind:value={chatInput} onkeydown={onKeyDown} class:scroll-theme={isScrollTheme}></textarea>
            <div class="actions">
                <button onclick={() => showHidden = !showHidden}><span>Show</span></button>
                <button onclick={onSend}><span>Send</span></button>
            </div>
        </div>
    </div>
</div>

<style>
    .root {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-left: 1px solid var(--color-primary-main);
        background-color: var(--color-content-dark);
        z-index: 1000;
    }

    .inner {
        position: absolute;
        width: var(--size-sidebar-max);
        min-width: var(--size-sidebar-max);
        left: 0;
        top: 0;
        bottom: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
    }

    .scroll {
        position: relative;
        width: 100%;
        height: 100%;
        flex: 1;
        display: flex;
        flex-direction: column-reverse;
        justify-content: end;
        align-items: start;
        overflow: hidden;
        overflow-y: scroll;
    }

    .input {
        position: relative;
        width: 100%;
        height: auto;
        display: flex;
        justify-content: stretch;
        align-items: center;
        flex-direction: row;
        border-top: 1px solid var(--color-primary-main);
        overflow: hidden;
    }

    .input > textarea {
        position: relative;
        width: 100%;
        height: 150px;
        border: none;
        overflow: auto;
        resize: none;
        padding: 8px;
    }

    .actions > button {
        position: relative;
        width: 100%;
        height: 100%;
        outline: none;
        border: none;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .actions > button:first-child {
        background-color: var(--color-primary-main);
        height: min-content;
        padding: 8px;
    }

    ul {
        position: relative;
        width: 100%;
        height: auto;
        margin: 0;
        padding: 0;
        list-style: none;
        background-color: var(--color-chat-light);
        color: var(--color-chat-text);
    }

    .disabled {
        user-select: none;
        pointer-events: none;
        cursor: default;
        opacity: 0.5;
    }

    .disabled > * {
        user-select: none;
        pointer-events: none;
        cursor: default;
        opacity: 0.65;
    }
    
    .root.disabled {
        filter: grayscale(0.5);
        pointer-events: none;
        user-select: none;
    }

    .actions {
        position: relative;
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: stretch;
        align-items: center;
        flex-direction: column;
        flex: 0;
    }

    .status {
        position: relative;
        width: 100%;
        height: auto;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: row;
        border-top: 1px solid var(--color-primary-main);
    }

    .status.error {
        border-color: red;
        color: red;
    }
    
    /* Medieval Scroll Theme Styles */
    /* Scroll Theme Root */
    .root.scroll-theme {
        background: linear-gradient(45deg, #f4f1e8 0%, #e8dcc6 50%, #d4c5a9 100%);
        border-left: 3px solid #8b4513;
        box-shadow: inset 0 0 20px rgba(139, 69, 19, 0.3);
        position: relative;
    }
    
    .root.scroll-theme::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: 
            repeating-linear-gradient(
                0deg,
                transparent 0px,
                transparent 24px,
                rgba(139, 69, 19, 0.1) 25px,
                rgba(139, 69, 19, 0.1) 26px
            );
        pointer-events: none;
        z-index: 1;
    }
    
    .root.scroll-theme::after {
        content: '';
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        bottom: 10px;
        border: 2px solid #8b4513;
        border-radius: 8px;
        pointer-events: none;
        z-index: 1;
        box-shadow: 
            inset 0 0 10px rgba(139, 69, 19, 0.2),
            0 0 0 1px rgba(139, 69, 19, 0.3);
    }
    
    /* Scroll Theme Inner */
    .inner.scroll-theme {
        background: transparent;
        z-index: 2;
        position: relative;
        margin: 20px;
    }
    
    /* Scroll Theme Chat List */
    ul.scroll-theme {
        background: transparent;
        color: #2c1810;
        font-family: 'Cinzel', 'UnifrakturMaguntia', 'Blackletter', serif;
        padding: 20px;
    }
    
    /* Scroll Theme Scroll Area */
    .scroll.scroll-theme {
        background: transparent;
    }
    
    /* Scroll Theme Input */
    .input.scroll-theme {
        background: rgba(139, 69, 19, 0.1);
        border-top: 2px solid #8b4513;
        border-radius: 8px;
        margin: 0 10px 10px 10px;
        box-shadow: inset 0 2px 4px rgba(139, 69, 19, 0.2);
    }
    
    textarea.scroll-theme {
        background: rgba(244, 241, 232, 0.9);
        color: #2c1810;
        font-family: 'Cinzel', 'UnifrakturMaguntia', 'Blackletter', serif;
        font-size: 14px;
        line-height: 1.6;
        border: 2px solid #8b4513;
        border-radius: 6px;
        margin: 8px;
        padding: 12px;
        box-shadow: inset 0 2px 4px rgba(139, 69, 19, 0.1);
    }
    
    textarea.scroll-theme::placeholder {
        color: rgba(44, 24, 16, 0.6);
        font-style: italic;
    }
    
    /* Scroll Theme Status */
    .scroll-theme .status {
        background: rgba(139, 69, 19, 0.1);
        border-top: 2px solid #8b4513;
        color: #2c1810;
        font-family: 'Cinzel', serif;
        margin: 0 10px;
        border-radius: 6px 6px 0 0;
    }
    
    /* Scroll Theme Thinking Animation */
    .scroll-theme .thinking {
        position: relative;
    }
    
    .scroll-theme .thinking::after {
        content: '✒️';
        animation: quill-writing 1.5s ease-in-out infinite;
        margin-left: 8px;
    }
    
    @keyframes quill-writing {
        0% { transform: rotate(-5deg); }
        50% { transform: rotate(5deg); }
        100% { transform: rotate(-5deg); }
    }
    
    /* Medieval decorative elements */
    .scroll-theme .actions > button {
        background: linear-gradient(145deg, #d4af37, #b8860b);
        border: 2px solid #8b4513;
        color: #2c1810;
        font-family: 'Cinzel', serif;
        font-weight: 600;
        border-radius: 6px;
        margin: 4px;
        transition: all 0.2s ease;
        text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
    }
    
    .scroll-theme .actions > button:hover {
        background: linear-gradient(145deg, #ffd700, #d4af37);
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(139, 69, 19, 0.3);
    }
    
    .scroll-theme .actions > button:active {
        transform: translateY(0);
        box-shadow: 0 1px 4px rgba(139, 69, 19, 0.3);
    }
</style>