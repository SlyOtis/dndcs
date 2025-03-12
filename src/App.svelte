<script lang="ts">
  import {Router, type Routes} from "sly-svelte-location-router";
  import {onMount} from "svelte";

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