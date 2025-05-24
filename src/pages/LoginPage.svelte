<script lang="ts">
  import { onMount } from 'svelte';
  import { navigate } from "sly-svelte-location-router";
  import { authService } from '../lib/auth.service';
  import { isAuthenticated, authError, isLoading } from '../lib/stores/auth.store';
  
  let email = '';
  let password = '';
  let displayName = '';
  let isSignUp = false;
  let loading = false;
  let localError = '';

  // Redirect if already authenticated
  $effect(() => {
    if ($isAuthenticated) {
      navigate("/main/character");
    }
  });

  async function handleEmailAuth() {
    if (!email || !password) {
      localError = 'Please fill in all fields';
      return;
    }

    if (isSignUp && !displayName.trim()) {
      localError = 'Please enter your display name';
      return;
    }

    loading = true;
    localError = '';

    try {
      if (isSignUp) {
        await authService.signUp(email, password, displayName);
      } else {
        await authService.signIn(email, password);
      }
      // Navigation will happen automatically via the auth state change
    } catch (error) {
      localError = error instanceof Error ? error.message : 'Authentication failed';
    } finally {
      loading = false;
    }
  }

  async function handleGoogleAuth() {
    loading = true;
    localError = '';

    try {
      await authService.signInWithGoogle();
      // Navigation will happen automatically via the auth state change
    } catch (error) {
      localError = error instanceof Error ? error.message : 'Google sign-in failed';
    } finally {
      loading = false;
    }
  }

  function toggleMode() {
    isSignUp = !isSignUp;
    localError = '';
    email = '';
    password = '';
    displayName = '';
  }
</script>

<main class="container">
  <div class="medieval-background"></div>
  <div class="background-pattern"></div>
  <div class="content">
    <div class="title-section">
      <h1 class="main-title">D&D</h1>
      <h2 class="sub-title">Character Studio</h2>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3>{isSignUp ? 'Join the Adventure' : 'Welcome Back, Adventurer'}</h3>
        <p class="flavor-text">
          {isSignUp ? 'Create your account to begin your journey' : 'Sign in to continue your quest'}
        </p>
      </div>
      
      {#if localError || $authError}
        <div class="error-message">
          {localError || $authError}
        </div>
      {/if}

      <div class="form-section">
        {#if isSignUp}
          <input
            type="text"
            bind:value={displayName}
            placeholder="Your adventurer name..."
            class="mystical-input"
            disabled={loading || $isLoading}
          />
        {/if}
        
        <input
          type="email"
          bind:value={email}
          placeholder="Your email address..."
          class="mystical-input"
          disabled={loading || $isLoading}
        />
        
        <input
          type="password"
          bind:value={password}
          placeholder="Your secret passphrase..."
          class="mystical-input"
          disabled={loading || $isLoading}
        />
        
        <button 
          on:click={handleEmailAuth} 
          class="adventure-button"
          disabled={loading || $isLoading}
        >
          {#if loading || $isLoading}
            <span class="loading-spinner"></span>
            {isSignUp ? 'Creating Account...' : 'Signing In...'}
          {:else}
            <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
          {/if}
        </button>

        <div class="divider">
          <span>or</span>
        </div>

        <button 
          on:click={handleGoogleAuth} 
          class="google-button"
          disabled={loading || $isLoading}
        >
          {#if loading || $isLoading}
            <span class="loading-spinner"></span>
            Connecting...
          {:else}
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          {/if}
        </button>
      </div>
      
      <div class="toggle-section">
        <p>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          <button on:click={toggleMode} class="toggle-button" disabled={loading || $isLoading}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
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

  .mystical-input {
    width: 100%;
    padding: 1rem;
    margin-bottom: 1rem;
    border: 2px solid #ffd700;
    border-radius: 8px;
    background: rgba(15, 10, 5, 0.9);
    color: #ffffff;
    font-size: 1rem;
    transition: all 0.3s ease;
    box-sizing: border-box;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .mystical-input:focus {
    outline: none;
    border-color: #ffed4e;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.4), inset 0 2px 4px rgba(0, 0, 0, 0.5);
    background: rgba(20, 15, 10, 0.95);
  }

  .mystical-input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .adventure-button, .google-button {
    width: 100%;
    padding: 1rem;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 1rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    border: 2px solid;
    margin-bottom: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .adventure-button {
    background: linear-gradient(145deg, #ffd700, #ffed4e);
    color: #1a1a1a;
    border-color: #ffc107;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  }

  .google-button {
    background: #ffffff;
    color: #333333;
    border-color: #ddd;
  }

  .adventure-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
  }

  .google-button:hover {
    background: #f8f9fa;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .adventure-button:disabled, .google-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .google-icon {
    width: 20px;
    height: 20px;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .divider {
    text-align: center;
    margin: 1rem 0;
    position: relative;
  }

  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 215, 0, 0.3);
  }

  .divider span {
    background: linear-gradient(145deg, rgba(40, 25, 15, 0.95), rgba(25, 15, 10, 0.98));
    padding: 0 1rem;
    color: #ffd700;
    font-size: 0.9rem;
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