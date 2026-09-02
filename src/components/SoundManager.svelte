<script lang="ts">
  import { onMount } from 'svelte';
  
  // Environment variable for sound path
  const SOUND_PATH = import.meta.env.VITE_SOUND_PATH || '/sounds';
  
  // Sound files mapping
  const soundFiles = {
    // Roll sounds
    diceRoll: 'dice-roll.wav',
    criticalHit: 'critical-hit.wav',
    criticalFail: 'critical-fail.wav',
    
    // UI sounds
    buttonClick: 'button-click.wav',
    pageFlip: 'page-flip.wav',
    quillWrite: 'quill-write.wav',
    
    // Ambient sounds
    levelUp: 'level-up.wav',
    spellCast: 'spell-cast.wav',
    coinDrop: 'coin-drop.wav',
    
    // Achievement sounds
    questComplete: 'quest-complete.wav',
    itemFound: 'item-found.wav',
    doorOpen: 'door-open.wav',
    inspiration: 'inspiration.wav',
    
    // Combat sounds
    swordHit: 'sword-hit.wav',
    arrowShoot: 'arrow-shoot.wav',
    shieldBlock: 'shield-block.wav',
    
    // Magic sounds
    healSpell: 'heal-spell.wav',
    fireSpell: 'fire-spell.wav',
    restoreEnergy: 'restore-energy.wav'
  };
  
  // Audio cache
  const audioCache = new Map<string, HTMLAudioElement>();
  
  // Funny random texts for different actions
  const funnyTexts = {
    criticalHit: [
      "By the gods! What a strike!",
      "The dice favor you today, adventurer!",
      "A mighty blow worthy of legend!",
      "Even the dragons would be impressed!",
      "Your ancestors smile upon this roll!",
      "The tavern will sing of this deed!",
      "Fortune smiles upon the bold!",
      "A critical success of epic proportions!"
    ],
    criticalFail: [
      "Ouch! Even I felt that one...",
      "Perhaps you should consider a different profession?",
      "The dice mock your efforts today!",
      "Even a kobold could do better!",
      "Your weapon seems confused about its purpose...",
      "That's not how physics is supposed to work!",
      "The universe briefly reconsidered its laws...",
      "Someone angered the dice gods today!"
    ],
    levelUp: [
      "Huzzah! Another step towards greatness!",
      "The path of the hero continues!",
      "Power courses through your veins!",
      "Your legend grows ever stronger!",
      "The realm has gained a mightier champion!",
      "Experience forged in fire and triumph!",
      "Another chapter in your epic tale!",
      "Glory and honor to the rising hero!"
    ],
    healing: [
      "Ah, the sweet touch of restoration!",
      "Health flows like a gentle stream!",
      "Your wounds close as if by magic!",
      "Vitality returns to weary bones!",
      "The healing light mends what was broken!",
      "Life springs eternal in the brave!",
      "Restored and ready for adventure!",
      "Health renewed, spirit refreshed!"
    ],
    spellCast: [
      "The arcane energies dance at your command!",
      "Magic flows through your fingertips!",
      "The weave of reality bends to your will!",
      "Mystical forces heed your call!",
      "The ancient words hold their power!",
      "Sorcery sparks in the air!",
      "The spell takes shape with ethereal beauty!",
      "Magic answers the call of a true caster!"
    ],
    treasure: [
      "Shiny! The magpie in me approves!",
      "Gold! The eternal motivator of heroes!",
      "Your purse grows heavier with fortune!",
      "Wealth worthy of a dragon's hoard!",
      "The sweet sound of clinking coins!",
      "Riches beyond a peasant's dreams!",
      "Your bank account smiles upon you!",
      "Fortune favors the adventurous!"
    ],
    inspiration: [
      "MEGA INSPIRED!!!",
      "The spark of greatness ignites!",
      "Epic inspiration flows through you!",
      "The muses whisper secrets of glory!",
      "Legendary determination activated!",
      "Your inner hero awakens!",
      "The power of inspiration compels you!",
      "Destiny calls and you answer!",
      "Inspiration strikes like lightning!",
      "The gods themselves cheer you on!",
      "Maximum inspiration achieved!",
      "Your legend grows ever brighter!"
    ]
  };
  
  // Volume setting from localStorage
  let volume = $state(parseFloat(localStorage.getItem('dnd_sound_volume') || '0.7'));
  let soundEnabled = $state(localStorage.getItem('dnd_sound_enabled') !== 'false');
  
  // Update localStorage when settings change
  $effect(() => {
    localStorage.setItem('dnd_sound_volume', volume.toString());
    localStorage.setItem('dnd_sound_enabled', soundEnabled.toString());
  });
  
  // Preload audio files
  function preloadAudio(filename: string): HTMLAudioElement {
    if (audioCache.has(filename)) {
      return audioCache.get(filename)!;
    }
    
    const audio = new Audio(`${SOUND_PATH}/${filename}`);
    audio.volume = volume;
    audio.preload = 'auto';
    
    // Handle loading errors gracefully
    audio.onerror = () => {
      console.warn(`Could not load sound file: ${filename}`);
    };
    
    audioCache.set(filename, audio);
    return audio;
  }
  
  // Play sound function
  function playSound(soundKey: keyof typeof soundFiles, showText: boolean = true) {
    if (!soundEnabled) return;
    
    const filename = soundFiles[soundKey];
    if (!filename) return;
    
    try {
      const audio = preloadAudio(filename);
      audio.volume = volume;
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn(`Could not play sound ${soundKey}:`, error);
      });
      
      // Show funny text if requested
      if (showText && funnyTexts[soundKey as keyof typeof funnyTexts]) {
        showRandomText(soundKey as keyof typeof funnyTexts);
      }
    } catch (error) {
      console.warn(`Error playing sound ${soundKey}:`, error);
    }
  }
  
  // Show random funny text
  function showRandomText(category: keyof typeof funnyTexts) {
    const texts = funnyTexts[category];
    if (!texts || texts.length === 0) return;
    
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    
    // Dispatch custom event to show text
    window.dispatchEvent(new CustomEvent('showFunnyText', {
      detail: { text: randomText, category }
    }));
  }
  
  // Global sound event listeners
  onMount(() => {
    // Preload commonly used sounds
    Object.values(soundFiles).forEach(filename => {
      preloadAudio(filename);
    });
    
    // Listen for sound events
    const soundEvents = [
      { event: 'playDiceRoll', sound: 'diceRoll' as const },
      { event: 'playCriticalHit', sound: 'criticalHit' as const },
      { event: 'playCriticalFail', sound: 'criticalFail' as const },
      { event: 'playButtonClick', sound: 'buttonClick' as const },
      { event: 'playPageFlip', sound: 'pageFlip' as const },
      { event: 'playQuillWrite', sound: 'quillWrite' as const },
      { event: 'playLevelUp', sound: 'levelUp' as const },
      { event: 'playSpellCast', sound: 'spellCast' as const },
      { event: 'playCoinDrop', sound: 'coinDrop' as const },
      { event: 'playQuestComplete', sound: 'questComplete' as const },
      { event: 'playItemFound', sound: 'itemFound' as const },
      { event: 'playDoorOpen', sound: 'doorOpen' as const },
      { event: 'playSwordHit', sound: 'swordHit' as const },
      { event: 'playArrowShoot', sound: 'arrowShoot' as const },
      { event: 'playShieldBlock', sound: 'shieldBlock' as const },
      { event: 'playHealSpell', sound: 'healSpell' as const },
      { event: 'playFireSpell', sound: 'fireSpell' as const },
      { event: 'playRestoreEnergy', sound: 'restoreEnergy' as const },
      { event: 'playInspiration', sound: 'inspiration' as const }
    ];
    
    const listeners: Array<() => void> = [];
    
    soundEvents.forEach(({ event, sound }) => {
      const listener = (e: Event) => {
        const customEvent = e as CustomEvent;
        const showText = customEvent.detail?.showText !== false;
        playSound(sound, showText);
      };
      
      window.addEventListener(event, listener);
      listeners.push(() => window.removeEventListener(event, listener));
    });
    
    // Cleanup
    return () => {
      listeners.forEach(cleanup => cleanup());
    };
  });
  
  // Expose sound controls globally
  (globalThis as any).soundManager = {
    playSound,
    setVolume: (newVolume: number) => {
      volume = Math.max(0, Math.min(1, newVolume));
      audioCache.forEach(audio => {
        audio.volume = volume;
      });
    },
    toggleSound: () => {
      soundEnabled = !soundEnabled;
    },
    getVolume: () => volume,
    isEnabled: () => soundEnabled,
    getSoundState: () => soundEnabled,
    setSoundState: (enabled: boolean) => {
      soundEnabled = enabled;
    }
  };
</script>

<!-- Sound control panel (hidden by default, can be toggled) -->
<div class="sound-controls" class:visible={false}>
  <div class="sound-panel">
    <h4>🎵 Sound Settings</h4>
    
    <div class="control">
      <label>
        <input type="checkbox" bind:checked={soundEnabled} />
        Enable Sounds
      </label>
    </div>
    
    <div class="control">
      <label>
        Volume: {Math.round(volume * 100)}%
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          bind:value={volume}
          disabled={!soundEnabled}
        />
      </label>
    </div>
    
    <div class="test-sounds">
      <button onclick={() => playSound('diceRoll')}>🎲 Dice</button>
      <button onclick={() => playSound('criticalHit')}>⚡ Crit</button>
      <button onclick={() => playSound('spellCast')}>✨ Spell</button>
      <button onclick={() => playSound('inspiration')}>💡 Inspire</button>
    </div>
  </div>
</div>

<style>
  .sound-controls {
    position: fixed;
    top: 10px;
    left: 10px;
    z-index: 9998;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }
  
  .sound-controls.visible {
    opacity: 1;
    pointer-events: all;
  }
  
  .sound-panel {
    background: var(--ground-deep);
    border: 2px solid var(--metal);
    border-radius: 12px;
    padding: 16px;
    color: var(--ink);
    font-family: var(--font-display);
    min-width: 200px;
    box-shadow: 0 4px 12px var(--shade-soft);
  }
  
  .sound-panel h4 {
    margin: 0 0 12px 0;
    color: var(--metal);
    text-align: center;
  }
  
  .control {
    margin: 8px 0;
  }
  
  .control label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.9em;
  }
  
  .control input[type="range"] {
    width: 100%;
  }
  
  .test-sounds {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    justify-content: space-around;
  }
  
  .test-sounds button {
    background: var(--metal);
    border: 1px solid var(--metal-dim);
    border-radius: 6px;
    padding: 6px 8px;
    cursor: pointer;
    font-size: 0.8em;
    transition: transform 0.2s ease;
  }
  
  .test-sounds button:hover {
    transform: scale(1.1);
  }
</style>
