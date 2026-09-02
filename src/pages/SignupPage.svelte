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
  let displayName = $state('');
  let replicateApiKey = $state('');
  let loading = $state(false);
  let localError = $state('');

  const busy = $derived(loading || $isLoading);
  const keyLooksRight = $derived(replicateApiKey.startsWith('r8_'));

  $effect(() => {
    if ($isAuthenticated) {
      navigate("/");
    }
  });

  async function handleSignUp() {
    if (!email || !password || !displayName.trim()) {
      localError = 'Please fill in your name, your email and a password';
      return;
    }

    if (replicateApiKey.trim() && !keyLooksRight) {
      localError = 'A Replicate key starts with r8_. Leave it empty to add it later.';
      return;
    }

    loading = true;
    localError = '';

    try {
      await authService.signUp(email, password, displayName, replicateApiKey);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('auth/email-already-in-use')) {
          localError = 'An account with this email already exists. Please sign in instead.';
        } else if (error.message.includes('auth/weak-password')) {
          localError = 'Password is too weak. Please use at least 6 characters.';
        } else if (error.message.includes('auth/invalid-email')) {
          localError = 'Please enter a valid email address.';
        } else if (error.message.includes('auth/operation-not-allowed')) {
          localError = 'Email/password accounts are not enabled. Please contact support.';
        } else {
          localError = error.message;
        }
      } else {
        localError = 'Account creation failed. Please try again.';
      }
    } finally {
      loading = false;
    }
  }
</script>

<main class="gate">
  <Aura variant="veil" tone="verdigris" />
  <Aura variant="motes" tone="ember" density="normal" />

  <div class="gate-window">
    <Glass size="xl" />
  </div>

  <span class="gate-torch gate-torch-left">
    <Flame size="lg" intensity="calm" sconce hung />
  </span>
  <span class="gate-torch gate-torch-right">
    <Flame size="lg" intensity="steady" sconce hung />
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
            <h3 class="dnd-heading">Join the Adventure</h3>
            <p class="gate-flavor">Create your account to begin your journey</p>
          </div>

          {#if localError || $authError}
            <p class="gate-error" role="alert">{localError || $authError}</p>
          {/if}

          <form
            class="dnd-stack"
            onsubmit={(event) => {
              event.preventDefault();
              handleSignUp();
            }}
          >
            <Field label="Adventurer name" id="signup-name" required valid={displayName.trim().length > 1}>
              <input
                id="signup-name"
                type="text"
                bind:value={displayName}
                placeholder="Your adventurer name..."
                disabled={busy}
              />
            </Field>

            <Field label="Email" id="signup-email" required valid={email.includes('@')}>
              <input
                id="signup-email"
                type="email"
                bind:value={email}
                placeholder="Your email address..."
                disabled={busy}
              />
            </Field>

            <Field label="Passphrase" id="signup-password" required valid={password.length >= 6}>
              <input
                id="signup-password"
                type="password"
                bind:value={password}
                placeholder="Your secret passphrase..."
                disabled={busy}
              />
            </Field>

            <Field
              label="Replicate API key"
              id="signup-key"
              valid={replicateApiKey.trim() === '' || keyLooksRight}
              help="Optional. The AI features need it. It stays on your own account and is used from your browser only, and you can add it later on your account page."
            >
              <input
                id="signup-key"
                type="text"
                bind:value={replicateApiKey}
                placeholder="r8_..."
                disabled={busy}
              />
            </Field>

            <p class="gate-note">
              Get your API key from
              <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer">Replicate</a>
            </p>

            <Button type="submit" size="lg" fill loading={busy}>
              {busy ? 'Forging Account' : 'Create Account'}
            </Button>
          </form>

          <hr class="dnd-rule" />

          <p class="gate-switch">
            Already sworn in?
            <a href="/login">Sign in</a>
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
    background: var(--backdrop);
  }

  .gate-window {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 0;
    transform: translate(-50%, -52%) scale(1.35);
    opacity: 0.3;
  }

  .gate-torch {
    position: absolute;
    top: 14%;
    z-index: 1;
  }

  .gate-torch-left {
    left: 11%;
  }

  .gate-torch-right {
    right: 11%;
  }

  .gate-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
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
    font-size: clamp(2.4rem, 9vw, 4rem);
    line-height: 1;
    margin: 0;
  }

  .gate-rule {
    display: block;
    width: min(260px, 60vw);
  }

  .gate-sub {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--ink-dim);
  }

  .gate-card {
    width: min(480px, 92vw);
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
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--state-bad) 24%, transparent),
      color-mix(in srgb, var(--state-bad) 6%, transparent)
    );
    font-size: var(--text-sm);
    color: var(--ink);
  }

  .gate-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--ink-faint);
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
