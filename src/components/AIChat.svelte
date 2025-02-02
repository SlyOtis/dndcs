<script lang="ts">

  import {getRollLog} from "../lib/engine";
  import {onDestroy} from "svelte";
  import {getMilliseconds} from 'date-fns'
  import type {RollLogItem} from "../lib/types";

  const {unsubscribe, rollStore} = getRollLog()

  onDestroy(() => unsubscribe())

  type ChatLogItem = {returnedAt: Date, sentAt: Date, title: string, message: string, data: any, action: string}
  type LogItem = {createdAt: Date} & ({type: 'roll', data: RollLogItem} | {type: 'chat', data: ChatLogItem})
  type ChatLog = Array<LogItem>

  function onSend(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  let chatLog: ChatLog = $derived.by(() => {
    if ($rollStore.length > 0 ) {
      console.log('asd')
    }

    return [...$rollStore.reduce((prev, curr) => {
      return [
        ...prev,
        {createdAt: curr.rolledAt, type: 'roll', data: curr },
      ]
    }, [] as ChatLog) as ChatLog].sort((a, b) => {
      return getMilliseconds(a.createdAt) - getMilliseconds(b.createdAt)
    })
  })

  let scroller: HTMLElement

  $effect(() => {
    chatLog.length;
    scroller.scrollTo(0, scroller.scrollHeight)
  })

</script>

<div class="root">
    <div class="inner">
        <div class="scroll" bind:this={scroller}>
            <ul>
                {#each chatLog as logItem}
                    {#if logItem.type === 'chat'}
                        <li class="chat">
                            <div>{logItem.data.title}</div>
                        </li>
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
        <div class="input">
            <textarea></textarea>
            <button onclick={onSend}><span>Send</span></button>
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
        background-color: var(--color-content-main);
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

    .input > button {
        position: relative;
        width: auto;
        height: 100%;
        outline: none;
        border: none;
        cursor: pointer;
        display: flex;
        justify-content: center;
        align-items: center;
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
        margin: 0;
        padding: 0;
        margin-bottom: 8px;
    }
</style>