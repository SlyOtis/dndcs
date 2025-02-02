<script lang="ts">

  import {getRollLog} from "../lib/engine";
  import {onDestroy} from "svelte";
  import {getMilliseconds} from 'date-fns'

  const {unsubscribe, rollStore} = getRollLog()

  onDestroy(() => unsubscribe())

  function onSend(e) {
    e.preventDefault()
    e.stopPropagation()
  }

  $effect($rollStore)

  let chatLog = $derived.by(() => $rollStore.sort((a, b) => {
    return getMilliseconds(a.rolledAt) - getMilliseconds(b.rolledAt)
  }))



</script>

<div class="root">
    <div class="inner">
        <div class="scroll">
            <ul>
                {#each chatLog as logItem}
                    <li>
                        <div></div>
                        {logItem.text}

                    </li>
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
    }

    ul {
        height: auto;
    }
</style>