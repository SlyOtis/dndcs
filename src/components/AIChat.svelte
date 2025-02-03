<script lang="ts">

  import {getRollLog} from "../lib/engine";
  import {onDestroy} from "svelte";
  import {format, getMilliseconds, parseISO} from 'date-fns'
  import {type ChatLog, detectAction, getReplicateLog} from "../lib/chat";

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
        {createdAt: curr.returnedAt, type: 'chat', data: curr},
      ]
    }, [] as ChatLog) as ChatLog].sort((a, b) => {
      return getMilliseconds(a.createdAt) - getMilliseconds(b.createdAt)
    })
  })

  let chatInput: string = $state("")
  let stateThinking = $state<string | undefined>(undefined)
  let showHidden = $state<boolean>(false)
  let scroller: HTMLElement

  $effect(() => {
    chatLog.length || stateThinking;
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
    detectAction(chatInput).then(() => stateThinking = undefined).catch(err => stateThinking = err)
    document.activeElement?.blur();
    chatInput = ''
  }

</script>

<div class="root">
    <div class="inner">
        <div class="scroll" bind:this={scroller}>
            <ul>
                {#each chatLog as logItem}
                    {#if logItem.type === 'chat'}
                        {#if logItem.data.hidden}
                            <li class="chat" class:hidden={!showHidden}>
                                <div class="chat-title">
                                    <span>Query:</span>
                                    <span class="date">{format(logItem.data.sentAt, 'MMM d h:mm')}</span>
                                </div>
                                <span class="query">{logItem.data.query}</span>
                                <div class="chat-title">
                                    <span>Response:</span>
                                    <span class="date">{format(logItem.data.returnedAt, 'MMM d h:mm')}</span>
                                </div>
                                <div class="response">
                                    <span>{logItem.data.response}</span>
                                </div>
                            </li>
                        {:else}
                            <li class="chat">
                                <div class="chat-title">
                                    <span>Query:</span>
                                    <span class="date">{format(logItem.data.sentAt, 'MMM d h:mm')}</span>
                                </div>
                                <span class="query">{logItem.data.query}</span>
                                <div class="chat-title">
                                    <span>Response:</span>
                                    <span class="date">{format(logItem.data.returnedAt, 'MMM d h:mm')}</span>
                                </div>
                                {#if logItem.data.message}
                                    <div class="message">
                                        <span>{logItem.data.message}</span>
                                    </div>
                                {:else}
                                    <div class="response">
                                        <span>{logItem.data.message}</span>
                                    </div>
                                {/if}
                            </li>
                        {/if}
                    {:else }
                        <li class="roll">
                            <h4>{logItem.data.text}</h4>
                            <div class="result">
                                <span>On the die: <b>{logItem.data.roll}</b></span>
                                <span>Total with modifiers: <b>{logItem.data.total}</b></span>
                            </div>
                        </li>
                    {/if}
                {/each}
            </ul>
        </div>
        {#if stateThinking}
            <div>
                <span class="thinking">{stateThinking}</span>
            </div>
        {/if}
        <div class="input" class:disabled={stateThinking!!}>
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

    ul, li {
        position: relative;
        width: 100%;
        height: auto;
        margin: 0;
        padding: 0;
        list-style: none;
        background-color: var(--color-chat-light);
        color: var(--color-chat-text);
    }

    ul {
        height: auto;
    }

    li {
        padding: 8px 12px;
    }

    li:nth-child(odd) {
        background-color: var(--color-chat-light);
    }

    li:nth-child(even) {
        background-color: var(--color-chat-main);
    }

    .result {
        position: relative;
        width: 100%;
        height: 100%;
        gap: 8px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        overflow: hidden;
    }

    .result > span {
        position: relative;
        width: auto;
        height: 100%;
        padding: 8px;
    }

    .result > *:last-child {
        background-color: var(--color-chat-dark);
        border-radius: 8px;
        overflow: hidden;
    }

    h4 {
        padding: 0;
        margin: 0 0 8px;
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

    .date {
        font-size: 0.7em;
        opacity: 0.75;
        font-weight: 500;
    }

    .chat-title {
        position: relative;
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        margin-bottom: 4px;
    }

    .chat-title:not(:first-child) {
        margin-top: 12px;
    }

    .chat {
        position: relative;
        width: 100%;
        height: auto;
        transition: max-height 250ms ease-in-out;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
    }

    .query {
        position: relative;
        padding: 4px 8px;
        width: 100%;
        text-align: center;
        overflow: hidden;
    }

    .response {
        position: relative;
        width: 100%;
        height: 100%;
        background-color: var(--color-chat-dark);
        border-radius: 8px;
        padding: 8px;
    }

    .response > span {
        font-size: 0.7em;
        opacity: 0.75;
    }

    .hidden {
        display: none;
        max-height: 0;
    }

    .message {
        position: relative;
        width: 100%;
        height: 100%;
        font-size: 0.8em;
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
</style>