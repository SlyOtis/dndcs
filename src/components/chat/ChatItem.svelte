<script lang="ts">
    import {format} from "date-fns";
    import {marked} from 'marked';
    import type {LogItem} from "../../lib/chat";
    let {logItem, showHidden, scrollTheme = false}: {logItem: LogItem, showHidden: boolean, scrollTheme?: boolean} = $props()

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
        <li class="chat" class:hidden={!showHidden} class:scroll-theme={scrollTheme}>
            <div class="chat-title" class:scroll-theme={scrollTheme}>
                <span>Query:</span>
                <span class="date">{format(logItem.data.sentAt, 'MMM d h:mm')}</span>
            </div>
            <span class="query" class:scroll-theme={scrollTheme}>{logItem.data.query}</span>
            <div class="chat-title" class:scroll-theme={scrollTheme}>
                <span>Response:</span>
                <span class="date">{format(logItem.data.returnedAt, 'MMM d h:mm')}</span>
            </div>
            <div class="response" class:scroll-theme={scrollTheme}>
                <span>{logItem.data.response}</span>
            </div>
        </li>
    {:else}
        <li class="chat" class:scroll-theme={scrollTheme}>
            <div class="chat-title" class:scroll-theme={scrollTheme}>
                <span>{scrollTheme ? '📜 Query:' : 'Query:'}</span>
                <span class="date">{format(logItem.data.sentAt, 'MMM d h:mm')}</span>
            </div>
            <span class="query" class:scroll-theme={scrollTheme}>{logItem.data.query}</span>
            <div class="chat-title" class:scroll-theme={scrollTheme}>
                <span>{scrollTheme ? '✒️ Response:' : 'Response:'}</span>
                <span class="date">{format(logItem.data.returnedAt, 'MMM d h:mm')}</span>
            </div>
            {#if logItem.data.message}
                <div class="message" class:card={logItem.data.data?.type === 'item_card' || logItem.data.data?.type === 'npc_card'} class:scroll-theme={scrollTheme}>
                    <div class="formatted-content" class:scroll-theme={scrollTheme}>
                        {@html renderMarkdown(logItem.data.message)}
                    </div>
                </div>
            {:else}
                <div class="response" class:scroll-theme={scrollTheme}>
                    <span>{logItem.data.message}</span>
                </div>
            {/if}
        </li>
    {/if}
{:else }
    <li class="roll" class:scroll-theme={scrollTheme}>
        <div class="chat-title" class:scroll-theme={scrollTheme}>
            <h4>{scrollTheme ? '🎲 ' + logItem.data.text : logItem.data.text}</h4>
            <span class="date">{format(logItem.data.rolledAt, 'MMM d h:mm')}</span>
        </div>

        {#if logItem.data.details}
            <span class:scroll-theme={scrollTheme}>Rolls: {logItem.data.details}</span>
        {/if}
        <div class="result" class:scroll-theme={scrollTheme}>
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
    
    /* Scroll Theme Styles */
    li.scroll-theme {
        background: rgba(244, 241, 232, 0.05);
        border-bottom: 1px solid rgba(139, 69, 19, 0.3);
        color: #2c1810;
        font-family: 'Cinzel', 'UnifrakturMaguntia', serif;
        border-radius: 8px;
        margin: 8px 0;
        box-shadow: 0 2px 4px rgba(139, 69, 19, 0.1);
    }
    
    li.scroll-theme:nth-child(even) {
        background: rgba(244, 241, 232, 0.1);
    }
    
    li.scroll-theme:nth-child(odd) {
        background: rgba(232, 220, 198, 0.1);
    }
    
    .chat-title.scroll-theme {
        color: #8b4513;
        font-weight: 700;
        text-shadow: 1px 1px 2px rgba(244, 241, 232, 0.8);
    }
    
    .query.scroll-theme {
        background: rgba(139, 69, 19, 0.15);
        border: 2px solid rgba(139, 69, 19, 0.3);
        color: #2c1810;
        font-style: italic;
        border-radius: 12px;
        position: relative;
    }
    
    .query.scroll-theme::before {
        content: '📜';
        position: absolute;
        left: -25px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 18px;
    }
    
    .response.scroll-theme {
        background: rgba(244, 241, 232, 0.2);
        border: 2px solid rgba(139, 69, 19, 0.2);
        color: #2c1810;
        box-shadow: inset 0 2px 4px rgba(139, 69, 19, 0.1);
    }
    
    .response.scroll-theme > span {
        color: #2c1810;
        opacity: 1;
    }
    
    .message.scroll-theme {
        color: #2c1810;
        font-family: 'Cinzel', serif;
        line-height: 1.8;
    }
    
    .message.scroll-theme.card {
        background: linear-gradient(145deg, rgba(244, 241, 232, 0.95), rgba(232, 220, 198, 0.9));
        border: 3px solid #8b4513;
        color: #2c1810;
        box-shadow: 
            0 4px 12px rgba(139, 69, 19, 0.3),
            inset 0 1px 0 rgba(244, 241, 232, 0.8);
    }
    
    .formatted-content.scroll-theme {
        color: #2c1810;
        font-family: 'Cinzel', serif;
    }
    
    .formatted-content.scroll-theme :global(h1),
    .formatted-content.scroll-theme :global(h2),
    .formatted-content.scroll-theme :global(h3),
    .formatted-content.scroll-theme :global(h4) {
        color: #8b4513;
        text-shadow: 1px 1px 2px rgba(244, 241, 232, 0.8);
    }
    
    .formatted-content.scroll-theme :global(strong) {
        color: #8b4513;
        text-shadow: 1px 1px 1px rgba(244, 241, 232, 0.8);
    }
    
    .formatted-content.scroll-theme :global(em) {
        color: #654321;
        font-style: italic;
    }
    
    .formatted-content.scroll-theme :global(p),
    .formatted-content.scroll-theme :global(li) {
        color: #2c1810;
    }
    
    .formatted-content.scroll-theme :global(code) {
        background: rgba(139, 69, 19, 0.15);
        color: #8b4513;
        border: 1px solid rgba(139, 69, 19, 0.3);
    }
    
    .formatted-content.scroll-theme :global(blockquote) {
        border-left: 3px solid #8b4513;
        color: #654321;
        background: rgba(244, 241, 232, 0.3);
        padding: 12px;
        border-radius: 0 8px 8px 0;
    }
    
    .result.scroll-theme {
        background: rgba(139, 69, 19, 0.1);
        border-radius: 12px;
        padding: 8px;
        border: 2px solid rgba(139, 69, 19, 0.2);
    }
    
    .result.scroll-theme > span {
        color: #2c1810;
        font-weight: 600;
    }
    
    .result.scroll-theme > *:last-child {
        background: rgba(139, 69, 19, 0.2);
        color: #8b4513;
        border: 1px solid rgba(139, 69, 19, 0.3);
    }
    
    .date.scroll-theme {
        color: #8b4513;
        opacity: 0.8;
        font-style: italic;
    }
</style>