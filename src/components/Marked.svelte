<script lang="ts">
  import {Marked, Renderer, type TokenizerExtension, type TokenizerThis} from "marked";
  import {onMount} from "svelte";
  import {Octokit} from "@octokit/rest";
  import {markedEmoji} from "marked-emoji";
  import {markedXhtml} from "marked-xhtml";
  import {gfmHeadingId} from "marked-gfm-heading-id";

  export let content: string | undefined = undefined

  let html: any = undefined
  let loading = true

  const removeOutermostTags = (html: string) => {
    // Match an opening tag at the start, capture content, then match corresponding closing tag
    const regex = /^(?:\s*)<([a-z][a-z0-9]*)[^>]*>([\s\S]*)<\/\1>(?:\s*)$/i;
    const match = regex.exec(html);
    if (match) {
      return match[2];
    }
    return html;
  };

  onMount(async () => {
    if (!content) {
      html = undefined
      loading = false
      return
    }


    const renderer = new Renderer()

    // Match any opening tag at the start, capture everything in between, then match the corresponding closing tag
    const regex = /^<([a-z][a-z0-9]*)[^>]*>([\s\S]*)<\/\1>$/i;
    renderer.link = ({href, title, tokens}) => {
      // TODO:: Remember that this can't be nested and then will fail
      const htmlContent = marked.parser(tokens)
      return `<a href="${href}" class="marked-link" ${title ? `title="${title}"` : ''}>${removeOutermostTags(htmlContent)}</a>`
    };

    renderer.blockquote = ({tokens}) => {
      const text = marked.parser(tokens)
      return `<blockquote class="marked-callout">${text}</blockquote>`
    };

    renderer.image = ({href, title, text}) => {
      return `<img src="${href}" alt="${text}" class="marked-image" ${title ? `title="${title}"` : ''}>`
    };

    const marked = new Marked({
      async: true,
      gfm: true,
      breaks: false,
      pedantic: false,
      renderer
    })

    // Emojis from github
    const octokit = new Octokit();
    const {data: emojis} = await octokit.rest.emojis.get();
    const emojiOptions = {
      emojis,
      renderer: (token: any) => `<img alt="${token.name}" src="${token.emoji}" class="marked-emoji-img">`
    };
    marked.use(markedEmoji(emojiOptions));

    // Fix closing tags
    marked.use(markedXhtml());

    // Fix heading ids
    const headingsOptions = {
      prefix: "_nim-io-",
    };

    marked.use(gfmHeadingId(headingsOptions));

    html = await marked.parse(content);
    loading = false
  })

</script>

<div class="marked-root">
    {#if loading}
        <span>Loading</span>
    {:else}
        {#if html}
            {@html html}
        {:else}
            <span>No Content</span>
        {/if}
    {/if}
</div>

<style>
    .marked-root {
        position: relative;
        width: 100%;
        height: 100%;
    }

    :global(.marked-link) {
        display: inline-block;
        width: max-content;
        color: var(--color-secondary);
        text-decoration: underline;
    }

    :global(em) {
        display: inline-block;
    }

    :global(.marked-callout) {
        display: inline-block;
        border-left: 0.5em solid var(--color-primary);
        padding: 0 2em;
        margin: 0;
    }

    :global(.marked-root h1) {
        font-size: 1.2rem;
    }

    :global(.marked-root h2) {
        font-size: 1rem;
    }

    :global(.marked-root h3) {
        font-size: 0.8rem;
    }

    :global(.marked-root h4) {
        font-size: 0.6rem;
    }

</style>