<script lang="ts">
  import {Router, type Routes} from "sly-svelte-location-router";
  import {onMount} from "svelte";
  import SoundManager from "./components/SoundManager.svelte";
  import FunnyTextDisplay from "./components/FunnyTextDisplay.svelte";

  const routes: Routes = {
    "/": {
      name: "login",
      component: () => import("./pages/LoginPage.svelte")
    },
    "/character": {
      name: "character",
      component: () => import("./pages/CharacterPage.svelte"),
    }
  }
</script>

<Router {routes} fallback="/"/>

<!-- Global Sound System -->
<SoundManager />

<!-- Global Funny Text Display -->
<FunnyTextDisplay />