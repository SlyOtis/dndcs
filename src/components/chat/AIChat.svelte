<script lang="ts">

  import {getRollLog} from "../../lib/engine";
  import {onDestroy} from "svelte";
  import {differenceInMilliseconds, format} from 'date-fns'
  import {type ChatLog, detectAction, getReplicateLog} from "../../lib/chat";
  import ChatItem from "./ChatItem.svelte";

  const {unsubscribeRoll, rollStore} = getRollLog()
  const {unsubscribeReplicate, replicateStore} = getReplicateLog()

  onDestroy(() => {
    unsubscribeRoll()
    unsubscribeReplicate()
  })

  let chatLog: ChatLog = $derived.by(() => {
    $rollStore.length > 0;

    return [...$rollStore.reduce((prev, curr) => {
      return [
        ...prev,
        {createdAt: curr.rolledAt, type: 'roll', data: curr},
      ]
    }, [] as ChatLog) as ChatLog, ...$replicateStore.reduce((prev, curr) => {
      return [
        ...prev,
        {createdAt: curr.sentAt, type: 'chat', data: curr},
      ]
    }, [] as ChatLog) as ChatLog].sort((a, b) => {
      return differenceInMilliseconds(a.createdAt, b.createdAt)
    })
  })

  let chatInput: string = $state("")
  let stateThinking = $state<string | undefined>(undefined)
  let stateError = $state<string | undefined>(undefined)
  let showHidden = $state<boolean>(false)
  let scroller: HTMLElement

  $effect(() => {
    chatLog.length || stateThinking?.length || stateError?.length || showHidden;
    scroller.scrollTo(0, scroller.scrollHeight)
  })

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      onSend(e)
    }
  }

  function onSend(e) {
    e.preventDefault()
    e.stopPropagation()

    if (!chatInput.length) {
      return
    }

    stateThinking = "Thinking about it"
    detectAction(chatInput).then(() => stateThinking = undefined).catch(err => {
      stateThinking = undefined
      stateError = err
    })
    document.activeElement?.blur();
    chatInput = ''
  }

</script>

<div class="root">
    <div class="inner">
        <div class="scroll" bind:this={scroller}>
            <ul>
                {#each chatLog as logItem}
                    <ChatItem {logItem} {showHidden} />
                {/each}
            </ul>
        </div>
        {#if stateThinking || stateError}
            <div class="status" class:error={stateError?.length}>
                <span class="thinking">{stateThinking || stateError}</span>
            </div>
        {/if}
        <div class="input" class:disabled={stateThinking?.length || stateError?.length}>
            <textarea bind:value={chatInput} onkeydown={onKeyDown}></textarea>
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
    }

    .disabled > * {
        user-select: none;
        pointer-events: none;
        cursor: default;
        opacity: 0.65;
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
</style>