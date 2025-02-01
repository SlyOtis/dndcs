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
        <h3>{info.name}</h3>
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
        height: 100%;
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
        height: 100%;
        gap: 8px;
        grid-template-columns: 80px 1fr;
        grid-template-rows: auto auto auto;
        align-items: center;
        justify-content: center;
        max-height: 100%;
        overflow: hidden;
        box-sizing: border-box;
    }

    .profile-picture {
        position: relative;
        width: 100%;
        height: 100%;
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
        width: 100%;
        height: 100%;
    }

    h3 {
        margin: 0;
        padding: 0;
    }

    span {
        font-size: 0.8em;
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