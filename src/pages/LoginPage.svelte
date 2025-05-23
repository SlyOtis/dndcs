<script lang="ts">
  import { onMount } from 'svelte';
  import {navigate} from "sly-svelte-location-router";

  let apiKey = '';

  // Load API key from localStorage on component mount
  onMount(() => {
    const savedApiKey = localStorage.getItem('replicate_api_key');
    if (savedApiKey) {
      apiKey = savedApiKey;
    }
  });

  // Save API key to localStorage
  function saveApiKey() {
    localStorage.setItem('replicate_api_key', apiKey);
    navigate("/character")
  }
</script>

<div class="container">
    <div class="medieval-background"></div>
    <div class="background-pattern"></div>
    <div class="content">
        <div class="title-section">
            <h1 class="main-title">D&D</h1>
            <h2 class="sub-title">Character Sheet</h2>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h3>Enter the Realm</h3>
                <p class="flavor-text">Provide your Replicate API key to begin your adventure</p>
            </div>
            
            <div class="form-section">
                <input
                    type="password"
                    bind:value={apiKey}
                    placeholder="Your magical API key..."
                    class="mystical-input"
                />
                <button on:click={saveApiKey} class="adventure-button">
                    <span>Begin Adventure</span>
                </button>
            </div>
            
            <div class="info-section">
                <p>Need an API key? Visit the <a href="https://replicate.com" target="_blank">Replicate Academy</a></p>
            </div>
        </div>
    </div>
</div>

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
            /* Medieval castle silhouette */
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Cdefs%3E%3ClinearGradient id='castle' x1='0%25' y1='0%25' x2='0%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23000;stop-opacity:0.3'/%3E%3Cstop offset='100%25' style='stop-color:%23000;stop-opacity:0.6'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0,800 L0,600 L50,600 L50,500 L100,500 L100,480 L120,480 L120,450 L180,450 L180,480 L200,480 L200,500 L250,500 L250,520 L300,520 L300,480 L350,480 L350,460 L400,460 L400,500 L450,500 L450,520 L500,520 L500,480 L550,480 L550,450 L600,450 L600,480 L650,480 L650,500 L700,500 L700,520 L750,520 L750,500 L800,500 L800,480 L850,480 L850,460 L900,460 L900,480 L950,480 L950,500 L1000,500 L1000,520 L1050,520 L1050,600 L1200,600 L1200,800 Z' fill='url(%23castle)'/%3E%3C/svg%3E"),
            /* Mountain ranges */
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 400'%3E%3Cpath d='M0,400 L0,300 L100,200 L200,250 L300,150 L400,200 L500,100 L600,180 L700,120 L800,200 L900,150 L1000,220 L1100,180 L1200,250 L1200,400 Z' fill='%23000' opacity='0.2'/%3E%3C/svg%3E");
        background-position: 
            bottom center,
            bottom center;
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
            /* Magical sparkles */
            radial-gradient(circle at 15% 25%, rgba(255, 215, 0, 0.4) 0%, transparent 3px),
            radial-gradient(circle at 85% 15%, rgba(255, 107, 53, 0.3) 0%, transparent 2px),
            radial-gradient(circle at 70% 85%, rgba(255, 215, 0, 0.3) 0%, transparent 2px),
            radial-gradient(circle at 25% 75%, rgba(138, 43, 226, 0.2) 0%, transparent 3px),
            radial-gradient(circle at 60% 35%, rgba(255, 215, 0, 0.2) 0%, transparent 2px),
            /* Mystical fog effects */
            radial-gradient(ellipse at 30% 60%, rgba(255, 215, 0, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 80% 40%, rgba(138, 43, 226, 0.08) 0%, transparent 45%);
        background-size: 
            100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%,
            60% 60%, 50% 50%;
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
        font-size: 8rem;
        font-weight: 900;
        margin: 0;
        background: linear-gradient(45deg, #ffd700, #ffed4e, #ffc107, #ffd700);
        background-size: 400% 400%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 3s ease-in-out infinite;
        text-shadow: 
            0 0 40px rgba(255, 215, 0, 0.8),
            0 4px 8px rgba(0, 0, 0, 0.9),
            0 2px 4px rgba(0, 0, 0, 0.8);
        transform: perspective(300px) rotateX(12deg);
        filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.7));
        font-family: 'Cinzel', serif;
        letter-spacing: 0.2em;
        position: relative;
    }

    .main-title::before {
        content: 'D&D';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: #ffd700;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        z-index: -1;
        filter: blur(2px);
        opacity: 0.5;
    }

    .sub-title {
        font-size: 2.2rem;
        font-weight: 700;
        margin: 0;
        color: #ffffff;
        text-shadow: 
            0 4px 8px rgba(0, 0, 0, 0.9),
            0 2px 4px rgba(0, 0, 0, 0.8),
            0 0 20px rgba(255, 215, 0, 0.3);
        letter-spacing: 0.15em;
        font-family: 'Cinzel', serif;
        transform: translateY(-10px);
        filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.6));
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
        max-width: 500px;
        background: 
            linear-gradient(145deg, 
                rgba(40, 25, 15, 0.95), 
                rgba(25, 15, 10, 0.98)
            );
        border: 3px solid #ffd700;
        border-radius: 16px;
        padding: 2.5rem;
        box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(255, 215, 0, 0.2),
            inset 0 -1px 0 rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
    }

    .card::before {
        content: '';
        position: absolute;
        top: -3px;
        left: -3px;
        right: -3px;
        bottom: -3px;
        background: linear-gradient(45deg, #ffd700, #ffed4e, #ffc107, #ffd700);
        border-radius: 19px;
        z-index: -1;
        opacity: 0.8;
        animation: borderGlow 3s linear infinite;
    }

    .card::after {
        content: '';
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 8px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        border-radius: 12px;
        pointer-events: none;
    }

    @keyframes borderGlow {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
    }

    .card-header {
        text-align: center;
        margin-bottom: 2rem;
    }

    .card-header h3 {
        font-size: 2rem;
        font-weight: 700;
        margin: 0 0 0.5rem 0;
        color: #ffd700;
        text-shadow: 
            0 3px 6px rgba(0, 0, 0, 0.9),
            0 0 15px rgba(255, 215, 0, 0.4);
        font-family: 'Cinzel', serif;
        letter-spacing: 0.05em;
    }

    .flavor-text {
        font-size: 1.1rem;
        color: #e8ddd7;
        margin: 0;
        font-style: italic;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
        text-align: center;
        line-height: 1.4;
    }

    .form-section {
        width: 100%;
        margin-bottom: 1.5rem;
    }

    .mystical-input {
        width: 100%;
        padding: 1.2rem;
        margin-bottom: 1.5rem;
        border: 2px solid #ffd700;
        border-radius: 8px;
        background: rgba(15, 10, 5, 0.9);
        color: #ffffff;
        font-size: 1.1rem;
        font-family: 'Cinzel', serif;
        transition: all 0.3s ease;
        box-sizing: border-box;
        box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.5),
            0 2px 8px rgba(0, 0, 0, 0.3);
    }

    .mystical-input:focus {
        outline: none;
        border-color: #ffed4e;
        box-shadow: 
            0 0 25px rgba(255, 215, 0, 0.6),
            inset 0 2px 4px rgba(0, 0, 0, 0.5);
        background: rgba(20, 15, 10, 0.95);
        transform: translateY(-1px);
    }

    .mystical-input::placeholder {
        color: #999;
        font-style: italic;
        font-family: 'Cinzel', serif;
    }

    .adventure-button {
        width: 100%;
        padding: 1.2rem 2rem;
        background: linear-gradient(145deg, #ffd700, #ffed4e);
        color: #1a1a1a;
        border: 2px solid #ffc107;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 700;
        font-size: 1.2rem;
        font-family: 'Cinzel', serif;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .adventure-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        transition: left 0.6s;
    }

    .adventure-button:hover::before {
        left: 100%;
    }

    .adventure-button:hover {
        transform: translateY(-3px);
        box-shadow: 
            0 8px 25px rgba(255, 215, 0, 0.6),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
        background: linear-gradient(145deg, #ffed4e, #fff176);
        border-color: #ffd700;
    }

    .adventure-button:active {
        transform: translateY(-1px);
        box-shadow: 
            0 4px 12px rgba(255, 215, 0, 0.4),
            inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .info-section {
        text-align: center;
        font-size: 1rem;
        color: #c8c8c8;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }

    .info-section a {
        color: #ffd700;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
    }

    .info-section a:hover {
        color: #ffed4e;
        text-shadow: 
            0 0 12px rgba(255, 215, 0, 0.8),
            0 1px 2px rgba(0, 0, 0, 0.8);
        transform: translateY(-1px);
    }

    @media (max-width: 768px) {
        .main-title {
            font-size: 5rem;
        }
        
        .sub-title {
            font-size: 1.5rem;
        }
        
        .card {
            max-width: 90%;
            padding: 1.5rem;
        }
    }
</style>