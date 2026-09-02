<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from "sly-svelte-location-router";
  import { authService } from '../lib/auth.service';
  import { isAuthenticated, authError, isLoading } from '$lib/stores/auth.store';
  import Button from '$components/ui/Button.svelte';
  import Field from '$components/ui/Field.svelte';
  
  let email = $state('');
  let password = $state('');
  let loading = $state(false);
  let localError = $state('');

  // Redirect if already authenticated
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

<main class="container">
  <div class="medieval-background"></div>
  <div class="background-pattern"></div>
  <div class="content">
    <div class="title-section">
      <h1 class="main-title">D&D</h1>
      <h2 class="sub-title">Character Sheet</h2>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3>Welcome Back, Adventurer</h3>
        <p class="flavor-text">
          Sign in to continue your quest
        </p>
      </div>
      
      {#if localError || $authError}
        <div class="error-message">
          {localError || $authError}
        </div>
      {/if}

      <form class="form-section" onsubmit={(e) => {
        e.preventDefault();
        handleSignIn();
      }}>
        
        <Field label="Email" id="login-email" required>
          <input
            id="login-email"
            type="email"
            bind:value={email}
            placeholder="Your email address..."
            disabled={loading || $isLoading}
          />
        </Field>

        <Field label="Passphrase" id="login-password" required>
          <input
            id="login-password"
            type="password"
            bind:value={password}
            placeholder="Your secret passphrase..."
            disabled={loading || $isLoading}
          />
        </Field>

        <Button type="submit" fill loading={loading || $isLoading}>
          {loading || $isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

      </form>
      
      <div class="toggle-section">
        <p>
          Don't have an account?
          <a href="/signup" class="toggle-button">
            Sign Up
          </a>
        </p>
      </div>
    </div>
  </div>
</main>

<style>
  .container {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    background: 
      linear-gradient(135deg, rgba(20, 15, 10, 0.9) 0%, rgba(40, 25, 15, 0.8) 50%, rgba(15, 10, 5, 0.95) 100%),
      url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffd700' fill-opacity='0.05'%3E%3Ccircle cx='6' cy='6' r='1.5'/%3E%3Ccircle cx='18' cy='18' r='1'/%3E%3Ccircle cx='42' cy='12' r='1.5'/%3E%3Ccircle cx='54' cy='30' r='1'/%3E%3Ccircle cx='30' cy='48' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    overflow: hidden;
    min-height: 100vh;
  }

  .medieval-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='castle' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23000;stop-opacity:0.3'/%3E%3Cstop offset='100%25' style='stop-color:%23000;stop-opacity:0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0,800 L0,600 L50,600 L50,500 L100,500 L100,480 L120,480 L120,450 L180,450 L180,480 L200,480 L200,500 L250,500 L250,520 L300,520 L300,480 L350,480 L350,460 L400,460 L400,500 L450,500 L450,520 L500,520 L500,480 L550,480 L550,450 L600,450 L600,480 L650,480 L650,500 L700,500 L700,520 L750,520 L750,500 L800,500 L800,480 L850,480 L850,460 L900,460 L900,480 L950,480 L950,500 L1000,500 L1000,520 L1050,520 L1050,600 L1200,600 L1200,800 Z' fill='url(%23castle)'/%3E%3C/svg%3E"),
      url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 400'%3E%3Cpath d='M0,400 L0,300 L100,200 L200,250 L300,150 L400,200 L500,100 L600,180 L700,120 L800,200 L900,150 L1000,220 L1100,180 L1200,250 L1200,400 Z' fill='%23000' opacity='0.2'/%3E%3C/svg%3E");
    background-position: bottom center, bottom center;
    background-repeat: no-repeat, no-repeat;
    background-size: 100% 60%, 100% 40%;
    z-index: 1;
  }

  .background-pattern {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(circle at 15% 25%, rgba(255, 215, 0, 0.4) 0%, transparent 3px),
      radial-gradient(circle at 85% 15%, rgba(255, 107, 53, 0.3) 0%, transparent 2px),
      radial-gradient(circle at 70% 85%, rgba(255, 215, 0, 0.3) 0%, transparent 2px),
      radial-gradient(circle at 25% 75%, rgba(138, 43, 226, 0.2) 0%, transparent 3px),
      radial-gradient(circle at 60% 35%, rgba(255, 215, 0, 0.2) 0%, transparent 2px),
      radial-gradient(ellipse at 30% 60%, rgba(255, 215, 0, 0.1) 0%, transparent 40%),
      radial-gradient(ellipse at 80% 40%, rgba(138, 43, 226, 0.08) 0%, transparent 45%);
    background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 60% 60%, 50% 50%;
    animation: magicalGlow 6s ease-in-out infinite alternate;
    z-index: 2;
  }

  @keyframes magicalGlow {
    0% { opacity: 0.6; }
    100% { opacity: 0.9; }
  }

  .content {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
    padding: 2rem;
  }

  .title-section {
    text-align: center;
    margin-bottom: 2rem;
  }

  .main-title {
    font-size: 6rem;
    font-weight: 900;
    margin: 0;
    background: linear-gradient(45deg, #ffd700, #ffed4e, #ffc107, #ffd700);
    background-size: 400% 400%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s ease-in-out infinite;
    text-shadow: 0 0 40px rgba(255, 215, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.9);
    font-family: 'Cinzel', serif;
    letter-spacing: 0.2em;
  }

  .sub-title {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0.5rem 0 0 0;
    color: #ffffff;
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.9), 0 0 20px rgba(255, 215, 0, 0.3);
    letter-spacing: 0.15em;
    font-family: 'Cinzel', serif;
  }

  @keyframes shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .card {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    max-width: 450px;
    width: 100%;
    background: linear-gradient(145deg, rgba(40, 25, 15, 0.95), rgba(25, 15, 10, 0.98));
    border: 3px solid #ffd700;
    border-radius: 16px;
    padding: 2.5rem;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 215, 0, 0.2);
    backdrop-filter: blur(12px);
  }

  .card-header {
    text-align: center;
    margin-bottom: 2rem;
  }

  .card-header h3 {
    font-size: 1.8rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: #ffd700;
    text-shadow: 0 3px 6px rgba(0, 0, 0, 0.9);
    font-family: 'Cinzel', serif;
  }

  .flavor-text {
    font-size: 1rem;
    color: #e8ddd7;
    margin: 0;
    font-style: italic;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
    line-height: 1.4;
  }

  .error-message {
    width: 100%;
    padding: 1rem;
    margin-bottom: 1rem;
    background: rgba(220, 53, 69, 0.2);
    border: 1px solid #dc3545;
    border-radius: 8px;
    color: #ff6b6b;
    text-align: center;
    font-size: 0.9rem;
  }

  .form-section {
    width: 100%;
    margin-bottom: 1.5rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .toggle-section {
    text-align: center;
    margin-top: 1rem;
  }

  .toggle-section p {
    margin: 0;
    color: #e8ddd7;
    font-size: 0.9rem;
  }

  .toggle-button {
    background: none;
    border: none;
    color: #ffd700;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    margin-left: 0.5rem;
    transition: color 0.3s ease;
  }

  .toggle-button:hover {
    color: #ffed4e;
  }

  .toggle-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    .main-title {
      font-size: 4rem;
    }
    
    .sub-title {
      font-size: 1.3rem;
    }
    
    .card {
      max-width: 90%;
      padding: 1.5rem;
    }
  }
</style>