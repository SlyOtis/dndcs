<script lang="ts">
  import type {CharacterHitPoints} from "$lib/character.types";
  import Orb from "$components/ui/Orb.svelte";
  import Meter from "$components/ui/Meter.svelte";

  let {hp = $bindable()}: { hp: CharacterHitPoints } = $props()

  function updateCurrent(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    const oldValue = hp.current;
    hp.current = Math.max(0, value);

    if (value > oldValue) {
      window.dispatchEvent(new CustomEvent('playHealSpell'));
      window.dispatchEvent(new CustomEvent('showFunnyText', {
        detail: { text: 'Health restored!', category: 'healing' }
      }));
    }
  }

  function updateMax(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    hp.max = Math.max(1, value);
  }

  function updateTemporary(event: Event) {
    const target = event.target as HTMLInputElement;
    const value = parseInt(target.value) || 0;
    hp.temporary = Math.max(0, value);
  }
</script>

<div class="vitals">
  <Orb value={hp.current} max={hp.max} tone="life" size="sm" label="Hit points" />

  <div class="vitals-body">
    <span class="dnd-label">Hit Points</span>

    <Meter value={hp.current} max={hp.max} tone="life" size="sm" showValue />

    <div class="vitals-fields">
      <label class="vitals-field">
        <span>Current</span>
        <input class="dnd-num" type="number" value={hp.current} oninput={updateCurrent} min="0" />
      </label>

      <label class="vitals-field">
        <span>Max</span>
        <input class="dnd-num" type="number" value={hp.max} oninput={updateMax} min="1" />
      </label>

      <label class="vitals-field">
        <span>Temp</span>
        <input
          class="dnd-num"
          type="number"
          value={hp.temporary === 0 ? '' : hp.temporary}
          oninput={updateTemporary}
          placeholder="--"
          min="0"
        />
      </label>
    </div>
  </div>
</div>

<style>
  .vitals {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-4);
    grid-column: 4 / 6;
    align-self: stretch;
    justify-self: stretch;
    background:
      var(--texture-noise),
      linear-gradient(180deg, var(--ground-raised) 0%, var(--ground-deep) 100%);
    background-blend-mode: overlay, normal;
    border: var(--border-hair) solid var(--metal-dim);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm), inset 0 1px 0 var(--metal-edge);
  }

  .vitals-body {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    flex: 1;
    min-width: 0;
  }

  .vitals-fields {
    display: flex;
    gap: var(--space-3);
  }

  .vitals-field {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: var(--text-xs);
    color: var(--ink-dim);
  }
</style>
