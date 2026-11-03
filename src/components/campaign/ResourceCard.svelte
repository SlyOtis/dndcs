<script lang="ts">
  import type { Snippet } from 'svelte'
  import { navigate } from 'sly-svelte-location-router'
  import { RESOURCES, type Resource, type ResourceKind } from '$lib/resources'
  import Card from '$components/ui/Card.svelte'

  const {
    under,
    kind,
    one,
    tone = 'metal',
    on = false,
    children
  }: {
    /** The address the resource list lives at, which this card opens beneath. */
    under: string
    /** Which resource is drawn. */
    kind: ResourceKind
    /** The resource itself. */
    one: Resource
    /** Colours the rim against the active theme. */
    tone?: 'metal' | 'ember' | 'verdigris'
    /** Marks the card as the resource being read. */
    on?: boolean
    /** The stat row this type writes under the sub line. */
    children?: Snippet
  } = $props()

  const mark = $derived(RESOURCES[kind].mark(one))
</script>

<Card
  title={one.title}
  sub={one.description}
  image={one.image}
  badge={mark || undefined}
  {tone}
  {on}
  onclick={() => navigate(`${under}/${one.id}`)}
>
  {@render children?.()}
</Card>
