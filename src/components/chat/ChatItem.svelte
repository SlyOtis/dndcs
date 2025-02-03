<script lang="ts">
    import {format} from "date-fns";
    import type {LogItem} from "../../lib/chat";
    let {logItem, showHidden}: {logItem: LogItem, showHidden: boolean} = $props()


</script>

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
        <div class="chat-title">
            <h4>{logItem.data.text}</h4>
            <span class="date">{format(logItem.data.rolledAt, 'MMM d h:mm')}</span>
        </div>

        {#if logItem.data.details}
            <span>Rolls: {logItem.data.details}</span>
        {/if}
        <div class="result">
            <span>On the die: <b>{logItem.data.roll}</b></span>
            <span>Total with modifiers: <b>{logItem.data.total}</b></span>
        </div>
    </li>
{/if}

<style>

    li {
        padding: 8px 12px;
        background-color: var(--color-chat-light);
        position: relative;
        width: 100%;
        height: auto;
        margin: 0;
        list-style: none;
        color: var(--color-chat-text);
    }

    li:nth-child(even) {
        background-color: var(--color-chat-light);
    }

    li:nth-child(odd) {
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
        transition: all 250ms ease-in-out;
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
</style>