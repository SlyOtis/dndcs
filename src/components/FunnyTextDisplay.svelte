<script lang="ts">
  import { onMount } from 'svelte';
  
  interface TextDisplay {
    id: number;
    text: string;
    category: string;
    opacity: number;
    scale: number;
    x: number;
    y: number;
    rotation: number;
  }
  
  let displayTexts = $state<TextDisplay[]>([]);
  let textId = 0;
  
  function showText(text: string, category: string, x?: number, y?: number) {
    // If click coordinates are provided, use them with some randomization
    let posX, posY;
    if (x !== undefined && y !== undefined) {
      // Convert pixel coordinates to percentages and add some randomization
      posX = Math.max(10, Math.min(90, (x / window.innerWidth) * 100 + (Math.random() - 0.5) * 10));
      posY = Math.max(10, Math.min(90, (y / window.innerHeight) * 100 + (Math.random() - 0.5) * 10));
    } else {
      // Fallback to random position
      posX = Math.random() * 60 + 20;
      posY = Math.random() * 40 + 30;
    }

    const newText: TextDisplay = {
      id: textId++,
      text,
      category,
      opacity: 0,
      scale: 0.3,
      x: posX,
      y: posY,
      rotation: (Math.random() - 0.5) * 20 // Random rotation between -10deg and +10deg
    };
    
    displayTexts.push(newText);
    
    // Animate in with bounce effect
    setTimeout(() => {
      const textElement = displayTexts.find(t => t.id === newText.id);
      if (textElement) {
        textElement.opacity = 1;
        textElement.scale = 1.2; // Overshoot for bounce effect
      }
    }, 50);
    
    // Scale down to normal size for bounce effect
    setTimeout(() => {
      const textElement = displayTexts.find(t => t.id === newText.id);
      if (textElement) {
        textElement.scale = 1;
      }
    }, 200);
    
    // Float upward animation
    setTimeout(() => {
      const textElement = displayTexts.find(t => t.id === newText.id);
      if (textElement) {
        textElement.y -= 10; // Move up slightly
        textElement.rotation += (Math.random() - 0.5) * 10; // Add some rotation
      }
    }, 1000);
    
    // Animate out with fade and float
    setTimeout(() => {
      const textElement = displayTexts.find(t => t.id === newText.id);
      if (textElement) {
        textElement.opacity = 0;
        textElement.scale = 0.8;
        textElement.y -= 5; // Float up as it fades
      }
    }, 2500);
    
    // Remove from array
    setTimeout(() => {
      displayTexts = displayTexts.filter(t => t.id !== newText.id);
    }, 3000);
  }
  
  onMount(() => {
    const handleFunnyText = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { text, category, x, y } = customEvent.detail;
      showText(text, category, x, y);
    };
    
    window.addEventListener('showFunnyText', handleFunnyText);
    
    return () => {
      window.removeEventListener('showFunnyText', handleFunnyText);
    };
  });
</script>

<!-- Text Display Container -->
<div class="funny-text-container">
  {#each displayTexts as textItem (textItem.id)}
    <div 
      class="funny-text {textItem.category}"
      style="
        opacity: {textItem.opacity}; 
        transform: scale({textItem.scale}) rotate({textItem.rotation}deg);
        left: {textItem.x}%;
        top: {textItem.y}%;
      "
    >
      {textItem.text}
    </div>
  {/each}
</div>

<style>
  .funny-text-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    pointer-events: none;
  }
  
  .funny-text {
    position: absolute;
    color: white;
    font-family: 'Cinzel', serif;
    font-size: 1.4em;
    font-weight: 700;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.9),
      -1px -1px 2px rgba(0, 0, 0, 0.7),
      1px 1px 3px rgba(0, 0, 0, 0.8);
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: center;
    white-space: nowrap;
    letter-spacing: 1px;
    user-select: none;
  }
  
  .funny-text.criticalHit {
    color: #ffd700;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.9),
      0 0 10px #ffd700,
      0 0 20px #ffd700,
      0 0 30px #ffd700;
    animation: criticalPulse 0.6s ease-in-out;
  }
  
  .funny-text.criticalFail {
    color: #ff4444;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.9),
      0 0 10px #ff4444,
      0 0 20px #ff4444;
    animation: shakeFail 0.6s ease-in-out;
  }
  
  .funny-text.levelUp {
    color: #00ff88;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.9),
      0 0 15px #00ff88,
      0 0 25px #00ff88,
      0 0 35px #00ff88;
    animation: levelUpGlow 1.2s ease-in-out;
    font-size: 1.6em;
  }
  
  .funny-text.healing {
    color: #20c997;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.9),
      0 0 12px #20c997,
      0 0 22px #20c997;
    animation: healingPulse 0.8s ease-in-out;
  }
  
  .funny-text.spellCast {
    color: #aa44ff;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.9),
      0 0 12px #aa44ff,
      0 0 22px #aa44ff,
      0 0 32px #aa44ff;
    animation: magicSparkle 1s ease-in-out;
  }
  
  .funny-text.treasure {
    color: #ffc107;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.9),
      0 0 12px #ffc107,
      0 0 22px #ffc107,
      0 0 32px #ffc107;
    animation: treasureShine 1s ease-in-out;
  }
  
  .funny-text.inspiration {
    color: #ff69b4;
    text-shadow: 
      2px 2px 4px rgba(0, 0, 0, 0.9),
      0 0 15px #ff69b4,
      0 0 25px #ff69b4,
      0 0 35px #ff69b4;
    animation: inspirationBlast 1.2s ease-in-out;
    font-size: 1.6em;
    font-weight: 800;
  }
  
  @keyframes criticalPulse {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.15) rotate(1deg); }
    50% { transform: scale(1.2) rotate(-1deg); }
    75% { transform: scale(1.1) rotate(1deg); }
  }
  
  @keyframes shakeFail {
    0%, 100% { transform: translateX(0) rotate(0deg); }
    20% { transform: translateX(-8px) rotate(-2deg); }
    40% { transform: translateX(8px) rotate(2deg); }
    60% { transform: translateX(-6px) rotate(-1deg); }
    80% { transform: translateX(4px) rotate(1deg); }
  }
  
  @keyframes levelUpGlow {
    0% { transform: scale(0.8) rotate(-5deg); filter: brightness(1); }
    25% { transform: scale(1.2) rotate(2deg); filter: brightness(1.3); }
    50% { transform: scale(1.15) rotate(-1deg); filter: brightness(1.5); }
    75% { transform: scale(1.05) rotate(1deg); filter: brightness(1.2); }
    100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
  }
  
  @keyframes healingPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.9; transform: scale(1.08); filter: brightness(1.2); }
  }
  
  @keyframes magicSparkle {
    0% { transform: scale(1) rotate(0deg); filter: hue-rotate(0deg); }
    25% { transform: scale(1.05) rotate(5deg); filter: hue-rotate(90deg); }
    50% { transform: scale(1.1) rotate(-3deg); filter: hue-rotate(180deg); }
    75% { transform: scale(1.05) rotate(4deg); filter: hue-rotate(270deg); }
    100% { transform: scale(1) rotate(0deg); filter: hue-rotate(360deg); }
  }
  
  @keyframes treasureShine {
    0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
    50% { transform: scale(1.12) rotate(2deg); filter: brightness(1.4); }
  }
  
  @keyframes inspirationBlast {
    0% { transform: scale(0.6) rotate(-8deg); filter: brightness(1); }
    25% { transform: scale(1.3) rotate(5deg); filter: brightness(1.4); }
    50% { transform: scale(1.2) rotate(-3deg); filter: brightness(1.6); }
    75% { transform: scale(1.1) rotate(2deg); filter: brightness(1.3); }
    100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .funny-text {
      font-size: 1.1em;
      letter-spacing: 0.5px;
    }
    
    .funny-text.levelUp, .funny-text.inspiration {
      font-size: 1.3em;
    }
  }
  
  @media (max-width: 480px) {
    .funny-text {
      font-size: 1em;
    }
    
    .funny-text.levelUp, .funny-text.inspiration {
      font-size: 1.2em;
    }
  }
</style>