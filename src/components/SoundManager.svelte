<script lang="ts">
  import { onMount } from 'svelte';
  
  const SOUND_PATH = import.meta.env.VITE_SOUND_PATH || '/sounds';
  
  const soundEvents = [
    { event: 'playDiceRoll', sound: 'diceRoll' },
    { event: 'playCriticalHit', sound: 'criticalHit' },
    { event: 'playCriticalFail', sound: 'criticalFail' },
    { event: 'playButtonClick', sound: 'buttonClick' },
    { event: 'playPageFlip', sound: 'pageFlip' },
    { event: 'playQuillWrite', sound: 'quillWrite' },
    { event: 'playLevelUp', sound: 'levelUp' },
    { event: 'playSpellCast', sound: 'spellCast' },
    { event: 'playCoinDrop', sound: 'coinDrop' },
    { event: 'playQuestComplete', sound: 'questComplete' },
    { event: 'playItemFound', sound: 'itemFound' },
    { event: 'playDoorOpen', sound: 'doorOpen' },
    { event: 'playSwordHit', sound: 'swordHit' },
    { event: 'playArrowShoot', sound: 'arrowShoot' },
    { event: 'playShieldBlock', sound: 'shieldBlock' },
    { event: 'playHealSpell', sound: 'healSpell' },
    { event: 'playFireSpell', sound: 'fireSpell' },
    { event: 'playRestoreEnergy', sound: 'restoreEnergy' },
    { event: 'playInspiration', sound: 'inspiration' }
  ] as const;
  
  type SoundKey = (typeof soundEvents)[number]['sound'];
  
  const audioCache = new Map<SoundKey, Promise<HTMLAudioElement | null>>();
  
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
  
  let volume = $state(parseFloat(localStorage.getItem('dnd_sound_volume') || '0.7'));
  let soundEnabled = $state(localStorage.getItem('dnd_sound_enabled') !== 'false');
  
  $effect(() => {
    localStorage.setItem('dnd_sound_volume', volume.toString());
    localStorage.setItem('dnd_sound_enabled', soundEnabled.toString());
  });
  
  function getAudio(sound: SoundKey): Promise<HTMLAudioElement | null> {
    if (!audioCache.has(sound)) {
      const url = `${SOUND_PATH}/${sound.replace(/[A-Z]/g, c => `-${c.toLowerCase()}`)}.wav`;
      audioCache.set(sound, fetch(url, { method: 'HEAD' })
        .then(res => {
          if (!res.ok || !res.headers.get('content-type')?.startsWith('audio/')) return null;
          const audio = new Audio(url);
          audio.volume = volume;
          return audio;
        })
        .catch(() => null));
    }
    return audioCache.get(sound)!;
  }
  
  async function playSound(sound: SoundKey, showText: boolean = true) {
    if (!soundEnabled) return;
    
    if (showText && sound in funnyTexts) {
      showRandomText(sound as keyof typeof funnyTexts);
    }
    
    const audio = await getAudio(sound);
    if (!audio) return;
    
    audio.volume = volume;
    audio.currentTime = 0;
    audio.play().catch(error => {
      console.warn(`Could not play sound ${sound}:`, error);
    });
  }
  
  function showRandomText(category: keyof typeof funnyTexts) {
    const texts = funnyTexts[category];
    if (!texts || texts.length === 0) return;
    
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    
    window.dispatchEvent(new CustomEvent('showFunnyText', {
      detail: { text: randomText, category }
    }));
  }
  
  onMount(() => {
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
    
    return () => {
      listeners.forEach(cleanup => cleanup());
    };
  });
  
  (globalThis as any).soundManager = {
    playSound,
    setVolume: (newVolume: number) => {
      volume = Math.max(0, Math.min(1, newVolume));
      audioCache.forEach(pending => {
        pending.then(audio => {
          if (audio) audio.volume = volume;
        });
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
