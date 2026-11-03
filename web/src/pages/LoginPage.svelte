<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { authService } from '../lib/auth.service';
  import { isAuthenticated, authError, isLoading } from '$lib/stores/auth.store';
  import Button from '$components/ui/Button.svelte';
  import Field from '$components/ui/Field.svelte';
  import Frame from '$components/ui/Frame.svelte';
  import Aura from '$components/ui/Aura.svelte';
  import Glass from '$components/ui/Glass.svelte';
  import Flame from '$components/ui/Flame.svelte';
  import Ornament from '$components/ui/Ornament.svelte';

  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let localError = $state('');

  const busy = $derived(loading || $isLoading);

  $effect(() => {
    if ($isAuthenticated) {
      navigate("/");
    }
  });

  async function handleSignIn() {
    if (!email || !password) {
      localError = 'Please fill in all fields';
      return;
    }

    loading = true;
    localError = '';

    try {
      await authService.signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        if (error.message.includes('auth/user-not-found') || error.message.includes('auth/invalid-credential')) {
          localError = 'Invalid email or password. Please check your credentials.';
        } else if (error.message.includes('auth/wrong-password')) {
          localError = 'Incorrect password. Please try again.';
        } else if (error.message.includes('auth/invalid-email')) {
          localError = 'Please enter a valid email address.';
        } else if (error.message.includes('auth/user-disabled')) {
          localError = 'This account has been disabled. Please contact support.';
        } else if (error.message.includes('auth/too-many-requests')) {
          localError = 'Too many failed attempts. Please try again later.';
        } else if (error.message.includes('400')) {
          localError = 'Invalid email or password. Please check your credentials.';
        } else {
          localError = error.message;
        }
      } else {
        localError = 'Sign in failed. Please try again.';
      }
    } finally {
      loading = false;
    }
  }
</script>

<main class="gate">
  <Aura variant="veil" tone="verdigris" />
  <Aura variant="motes" tone="ember" density="thick" />

  <div class="gate-window">
    <Glass size="xl" />
  </div>

  <span class="gate-torch gate-torch-left">
    <Flame size="lg" intensity="steady" sconce hung />
  </span>
  <span class="gate-torch gate-torch-right">
    <Flame size="lg" intensity="calm" sconce hung />
  </span>

  <div class="gate-content">
    <header class="gate-title">
      <h1 class="dnd-heading dnd-heading-hero gate-mark">D&amp;D</h1>
      <span class="gate-rule"><Ornament name="divider" tone="metal" /></span>
      <h2 class="dnd-label gate-sub">Character Sheet</h2>
    </header>

    <div class="gate-card">
      <Frame variant="cathedral" crest pad="lg">
        <div class="dnd-stack gate-form">
          <div class="gate-welcome">
            <h3 class="dnd-heading">Welcome Back, Adventurer</h3>
            <p class="gate-flavor">Sign in to continue your quest</p>
          </div>

          {#if localError || $authError}
            <p class="gate-error" role="alert">{localError || $authError}</p>
          {/if}

          <form
            class="dnd-stack"
            onsubmit={(event) => {
              event.preventDefault();
              handleSignIn();
            }}
          >
            <Field label="Email" id="login-email" required valid={email.includes('@')}>
              <input
                id="login-email"
                type="email"
                bind:value={email}
                placeholder="Your email address..."
                disabled={busy}
              />
            </Field>

            <Field label="Passphrase" id="login-password" required>
              <input
                id="login-password"
                type="password"
                bind:value={password}
                placeholder="Your secret passphrase..."
                disabled={busy}
              />
            </Field>

            <Button type="submit" size="lg" fill loading={busy}>
              {busy ? 'Signing In' : 'Sign In'}
            </Button>
          </form>

          <hr class="dnd-rule" />

          <p class="gate-switch">
            No sigil of your own yet?
            <a href="/signup">Forge one</a>
          </p>
        </div>
      </Frame>
    </div>
  </div>
</main>

<style>
  .gate {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    --verdigris: var(--ember);
    --verdigris-dim: var(--metal-dim);
    background:
      radial-gradient(ellipse 22% 38% at 14% 26%, color-mix(in srgb, var(--ember) 26%, transparent) 0%, transparent 70%),
      radial-gradient(ellipse 22% 38% at 86% 26%, color-mix(in srgb, var(--ember) 26%, transparent) 0%, transparent 70%),
      radial-gradient(ellipse 45% 55% at 50% 55%, color-mix(in srgb, var(--ember-glow) 35%, transparent) 0%, transparent 75%),
      var(--backdrop);
  }

  .gate-window {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 0;
    transform: translate(-50%, -52%) scale(1.35);
    opacity: 0.16;
    filter: sepia(0.6) saturate(0.7);
  }

  .gate-torch {
    position: absolute;
    top: 16%;
    z-index: 1;
  }

  .gate-torch-left {
    left: 12%;
  }

  .gate-torch-right {
    right: 12%;
  }

  .gate-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-7);
    padding: var(--space-6);
    max-height: 100%;
    overflow: auto;
    scrollbar-width: none;
  }

  .gate-title {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    text-align: center;
  }

  .gate-mark {
    font-size: clamp(3rem, 12vw, 5.5rem);
    line-height: 1;
    margin: 0;
  }

  .gate-rule {
    display: block;
    width: min(17.5rem, 60vw);
  }

  .gate-sub {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--metal);
    text-shadow: 0 1px 0 #000, 0 0 10px var(--ember-glow);
  }

  .gate-card {
    width: min(27.5rem, 92vw);
    filter: drop-shadow(0 0 2.5rem color-mix(in srgb, var(--ember-glow) 45%, transparent));
  }

  .gate-form {
    gap: var(--space-5);
  }

  .gate-welcome {
    text-align: center;
  }

  .gate-flavor {
    margin: var(--space-2) 0 0;
    font-size: var(--text-sm);
    font-style: italic;
    color: var(--ink-dim);
  }

  .gate-error {
    margin: 0;
    padding: var(--space-3) var(--space-4);
    border-block: var(--border-hair) solid color-mix(in srgb, var(--state-bad) 55%, transparent);
    border-radius: var(--radius-sm);
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--state-bad) 24%, transparent), color-mix(in srgb, var(--state-bad) 6%, transparent)),
      var(--texture-noise),
      var(--ground-deep);
    box-shadow: var(--bevel-down);
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .gate-switch {
    margin: 0;
    text-align: center;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  @media (max-width: 900px) {
    .gate-torch {
      display: none;
    }
  }
</style>
