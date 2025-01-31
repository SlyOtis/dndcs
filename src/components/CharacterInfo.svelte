<script lang="ts">
    import type {CharacterInfo} from "../lib/types";
    let {info = $bindable()}: {info: CharacterInfo} = $props()

    let imageUrl = $derived.by(() => {
      if (info.state?.image?.overlay === false) {
        return info.state.image.url!!
      }

      for (let condition of info.conditions) {
        if (condition?.image.overlay === false) {
          return condition.image.url!!
        }
      }

      return info.imageUrl
    })

</script>

<div class="root">
    <div class="info">
        <div class="profile-picture">
            <img src={imageUrl} alt={info.name} />
        </div>
        <h1>{info.name}</h1>
        <span>{info.gender} {info.race.name} {info.class.name}</span>
        <span>Level {info.level}</span>
    </div>
    <div class="actions">
        <button onclick={() => window.location.href = info.info}>Go to docs</button>
    </div>
</div>

<style>

    .root {
        position: relative;
        display: flex;
        width: 100%;
        height: auto;
        justify-content: space-between;
        align-items: center;
        flex-direction: row;
        padding: 8px 16px;
        overflow: hidden;
    }

    .info {
        position: relative;
        display: grid;
        width: auto;
        height: auto;
        gap: 8px;
        grid-template-columns: 100px 1fr;
        align-items: center;
        justify-content: center;
    }

    .profile-picture {
        position: relative;
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        grid-column: 1;
        grid-row: span 3;
    }

    .profile-picture > img {
        position: relative;
        object-fit: cover;
        object-position: center center;
        border-radius: 50%;
        overflow: hidden;
        border: 6px var(--color-primary-main) solid;
    }

    h1 {
        margin: 0;
        padding: 0;
    }

    .actions > button {
        border: 1px solid var(--color-primary-main);
        color: var(--color-primary-text);
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        overflow: hidden;
        outline: none;
        display: flex;
        background: none;
    }
</style>