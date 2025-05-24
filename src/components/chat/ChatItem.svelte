<script lang="ts">
    import {format} from "date-fns";
    import {marked} from 'marked';
    import type {LogItem} from "../../lib/chat";
    let {logItem, showHidden}: {logItem: LogItem, showHidden: boolean} = $props()

    // Configure marked for better formatting
    marked.setOptions({
        breaks: true,
        gfm: true
    });

    function renderMarkdown(text: string): string {
        return marked(text) as string;
    }
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
                <div class="message" class:card={logItem.data.data?.type === 'item_card' || logItem.data.data?.type === 'npc_card'}>
                    <div class="formatted-content">
                        {@html renderMarkdown(logItem.data.message)}
                    </div>
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
        padding: 12px 16px;
        position: relative;
        width: 100%;
        height: auto;
        margin: 0;
        list-style: none;
        color: var(--color-chat-text);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
        opacity: 0.8;
        font-weight: 500;
        color: #c0c0c0;
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
        padding: 8px 12px;
        width: 100%;
        text-align: center;
        overflow: hidden;
        background-color: rgba(255, 215, 0, 0.1);
        border-radius: 6px;
        font-weight: 500;
        color: var(--color-primary-main);
    }

    .response {
        position: relative;
        width: 100%;
        height: 100%;
        background-color: var(--color-chat-dark);
        border-radius: 8px;
        padding: 12px;
        border: 1px solid rgba(255, 215, 0, 0.2);
    }

    .response > span {
        font-size: 0.8em;
        opacity: 0.85;
        color: #e0e0e0;
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
        line-height: 1.4;
    }

    .message.card {
        background: linear-gradient(145deg, rgba(20, 15, 10, 0.95), rgba(40, 30, 20, 0.9));
        border: 2px solid var(--color-primary-main);
        border-radius: 12px;
        padding: 1.2rem;
        margin: 0.8rem 0;
        box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 215, 0, 0.1);
        backdrop-filter: blur(10px);
    }

    .formatted-content {
        color: #f5f5f5;
        font-size: 0.95em;
        line-height: 1.6;
    }

    .formatted-content :global(h1),
    .formatted-content :global(h2),
    .formatted-content :global(h3),
    .formatted-content :global(h4) {
        color: var(--color-primary-main);
        margin: 0.8rem 0 0.4rem 0;
        font-weight: 700;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    .formatted-content :global(strong) {
        color: var(--color-primary-main);
        font-weight: 600;
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.3);
    }

    .formatted-content :global(em) {
        color: #d4d1ce;
        font-style: italic;
    }

    .formatted-content :global(ul),
    .formatted-content :global(ol) {
        margin: 0.5rem 0;
        padding-left: 1.5rem;
    }

    .formatted-content :global(li) {
        margin: 0.3rem 0;
        color: #f0f0f0;
    }

    .formatted-content :global(p) {
        margin: 0.6rem 0;
        color: #f0f0f0;
    }

    .formatted-content :global(img) {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 0.5rem 0;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .formatted-content :global(code) {
        background: rgba(255, 255, 255, 0.1);
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
        color: var(--color-primary-main);
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
    }

    .formatted-content :global(blockquote) {
        border-left: 3px solid var(--color-primary-main);
        padding-left: 1rem;
        margin: 1rem 0;
        color: #b8b5b2;
        font-style: italic;
    }
</style>