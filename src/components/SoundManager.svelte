<script lang="ts">
  import { onMount } from 'svelte';
  import { userProfile } from '$lib/stores/auth.store';

  type Wave = OscillatorType | 'noise';

  type Voice = {
    wave: Wave;
    from: number;
    to?: number;
    at?: number;
    length: number;
    gain?: number;
    band?: number;
  };

  const tone = (from: number, at: number, length: number, gain = 0.25, wave: Wave = 'triangle'): Voice => ({ wave, from, at, length, gain });
  const rattle = (count: number, gap: number, band: number): Voice[] =>
    Array.from({ length: count }, (_, index) => ({ wave: 'noise', from: 0, band: band + index * 180, at: index * gap, length: 0.035, gain: 0.5 - index * 0.04 }));

  const recipes = {
    diceRoll: [...rattle(7, 0.055, 1800), tone(220, 0.4, 0.08, 0.15, 'square')],
    criticalHit: [...rattle(4, 0.05, 2000), tone(523, 0.22, 0.14), tone(659, 0.34, 0.14), tone(784, 0.46, 0.14), tone(1047, 0.58, 0.45, 0.3)],
    criticalFail: [...rattle(4, 0.05, 1200), { wave: 'sawtooth', from: 330, to: 82, at: 0.24, length: 0.7, gain: 0.22 }],
    buttonClick: [{ wave: 'noise', from: 0, band: 3200, length: 0.025, gain: 0.35 }, tone(1400, 0, 0.03, 0.08, 'square')],
    pageFlip: [{ wave: 'noise', from: 0, band: 2400, length: 0.22, gain: 0.3 }],
    quillWrite: [...rattle(3, 0.07, 5200)],
    levelUp: [tone(392, 0, 0.12), tone(523, 0.12, 0.12), tone(659, 0.24, 0.12), tone(784, 0.36, 0.12), tone(1047, 0.48, 0.6, 0.3)],
    spellCast: [{ wave: 'sine', from: 300, to: 1200, length: 0.5, gain: 0.25 }, { wave: 'sine', from: 450, to: 1800, at: 0.05, length: 0.45, gain: 0.12 }],
    coinDrop: [tone(2093, 0, 0.1, 0.2, 'sine'), tone(2637, 0.09, 0.14, 0.2, 'sine'), tone(2093, 0.2, 0.2, 0.12, 'sine')],
    questComplete: [tone(523, 0, 0.18), tone(659, 0, 0.18), tone(784, 0.2, 0.18), tone(1047, 0.4, 0.7, 0.3)],
    itemFound: [tone(880, 0, 0.1, 0.2, 'sine'), tone(1319, 0.1, 0.3, 0.2, 'sine')],
    doorOpen: [{ wave: 'sawtooth', from: 90, to: 140, length: 0.6, gain: 0.12 }, { wave: 'noise', from: 0, band: 400, at: 0.55, length: 0.12, gain: 0.4 }],
    swordHit: [{ wave: 'noise', from: 0, band: 3000, length: 0.08, gain: 0.5 }, tone(1760, 0, 0.35, 0.12, 'square'), tone(2350, 0, 0.3, 0.08, 'sine')],
    arrowShoot: [{ wave: 'noise', from: 0, band: 1500, length: 0.25, gain: 0.3 }, { wave: 'sine', from: 900, to: 300, length: 0.25, gain: 0.1 }],
    shieldBlock: [{ wave: 'noise', from: 0, band: 600, length: 0.12, gain: 0.6 }, tone(180, 0, 0.3, 0.2, 'square')],
    healSpell: [tone(523, 0, 0.3, 0.18, 'sine'), tone(659, 0.1, 0.3, 0.18, 'sine'), tone(784, 0.2, 0.5, 0.18, 'sine')],
    fireSpell: [{ wave: 'noise', from: 0, band: 700, length: 0.7, gain: 0.45 }, { wave: 'sawtooth', from: 120, to: 60, length: 0.6, gain: 0.1 }],
    restoreEnergy: [{ wave: 'sine', from: 220, to: 880, length: 0.6, gain: 0.2 }],
    inspiration: [tone(659, 0, 0.14, 0.2, 'sine'), tone(988, 0.12, 0.14, 0.2, 'sine'), tone(1319, 0.24, 0.5, 0.25, 'sine')]
  } satisfies Record<string, Voice[]>;

  type SoundKey = keyof typeof recipes;

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

  const soundEnabled = $derived($userProfile?.preferences?.sound_enabled ?? true);
  const volume = $derived($userProfile?.preferences?.sound_volume ?? 0.7);

  let context: AudioContext | null = null;
  let noise: AudioBuffer | null = null;

  function getContext(): AudioContext {
    context ??= new AudioContext();
    if (!noise) {
      noise = context.createBuffer(1, context.sampleRate, context.sampleRate);
      const data = noise.getChannelData(0);
      for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
    }
    return context;
  }

  function playVoice(audio: AudioContext, output: AudioNode, voice: Voice) {
    const start = audio.currentTime + (voice.at ?? 0);
    const end = start + voice.length;
    const envelope = audio.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(voice.gain ?? 0.25, start + Math.min(0.01, voice.length / 4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    envelope.connect(output);

    if (voice.wave === 'noise') {
      const source = audio.createBufferSource();
      source.buffer = noise;
      const band = audio.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = voice.band ?? 1000;
      band.Q.value = 1.2;
      source.connect(band).connect(envelope);
      source.start(start, Math.random() * 0.5, voice.length);
      return;
    }

    const oscillator = audio.createOscillator();
    oscillator.type = voice.wave;
    oscillator.frequency.setValueAtTime(voice.from, start);
    if (voice.to) oscillator.frequency.exponentialRampToValueAtTime(voice.to, end);
    oscillator.connect(envelope);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }

  function playSound(sound: SoundKey, showText: boolean = true) {
    if (!soundEnabled) return;

    if (showText && sound in funnyTexts) {
      showRandomText(sound as keyof typeof funnyTexts);
    }

    if (volume <= 0) return;

    const audio = getContext();
    if (audio.state === 'suspended') audio.resume();
    const output = audio.createGain();
    output.gain.value = volume;
    output.connect(audio.destination);

    for (const voice of recipes[sound]) playVoice(audio, output, voice);
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
    const listeners = (Object.keys(recipes) as SoundKey[]).map((sound) => {
      const event = `play${sound.charAt(0).toUpperCase()}${sound.slice(1)}`;
      const listener = (e: Event) => playSound(sound, (e as CustomEvent).detail?.showText !== false);
      window.addEventListener(event, listener);
      return () => window.removeEventListener(event, listener);
    });

    return () => {
      listeners.forEach((cleanup) => cleanup());
      context?.close();
    };
  });
</script>
