import type {CharacterContext, CharacterStore, RollLog, RollResult} from "./types";
import testCharacter from './character.fixture'
import {writable, type Unsubscriber, type Writable} from "svelte/store";
import type {Character, CharacterAbility, CharacterCurrency, CharacterInfo} from "./character.types";
import { addChangeLogEntry, createStateSnapshot, type ChangeAction } from "./changelog";

const rollStore = writable<RollLog>(JSON.parse(localStorage.getItem('roll_log') || '[]'))
const sidebarStore = writable(JSON.parse(localStorage.getItem('sidebar') || 'true'))

export function getRollLog(): { rollStore: Writable<RollLog>, unsubscribeRoll: Unsubscriber } {
  return {
    rollStore,
    unsubscribeRoll: rollStore.subscribe(value => {
      localStorage.setItem('roll_log', JSON.stringify(value));
    })
  }
}


export function getSidebar() {
  return {
    sidebarStore,
    unsubscribeSidebar: sidebarStore.subscribe(value => {
      localStorage.setItem('sidebar', JSON.stringify(value))
    })
  }
}

export async function rollDie(die: number, amount: number): Promise<RollResult> {
  const result = await fetch('https://www.random.org/integers/?format=plain&min=1&rnd=new&col=1&base=10&num=' + amount + '&max=' + die)
    .then(res => res.text());

  const rolls = result.split('\n').reduce((prev, curr) => {
    const res = parseInt(curr, 0)
    return isNaN(res) ? prev : [...prev, res]
  }, [] as number[])

  return {
    sum: rolls.reduce((prev, curr) => prev + curr, 0),
    rolls
  }
}

export async function rollAbility(name: string, modifier: number) {
  const res = await rollDie(20, 1);
  const total = res.sum + modifier;
  
  writeRollLog('ability', `Rolled ${name} 1d20`, '1d20', res.sum, total);
  
  // Trigger sound and visual feedback for ability checks
  if (typeof window !== 'undefined') {
    let type: 'critical' | 'damage' | 'miss' = 'damage';
    
    if (res.sum === 20) {
      type = 'critical'; // Natural 20
      window.dispatchEvent(new CustomEvent('playCriticalHit'));
    } else if (res.sum === 1) {
      type = 'miss'; // Natural 1
      window.dispatchEvent(new CustomEvent('playCriticalFail'));
    } else {
      window.dispatchEvent(new CustomEvent('playDiceRoll'));
      if (total >= 20) {
        type = 'critical'; // High success
      }
    }
    
    window.dispatchEvent(new CustomEvent('showDamage', {
      detail: {
        damage: total,
        type: type
      }
    }));
  }
}

export async function rollSkill(name: string, modifier: number, proficiency: number, x?: number, y?: number) {
  const res = await rollDie(20, 1);
  const total = res.sum + modifier;
  
  writeRollLog('skill', `Rolled ${name} 1d20`, '1d20', res.sum, total);
  
  // Trigger sound and visual feedback for skill checks
  if (typeof window !== 'undefined') {
    let type: 'critical' | 'damage' | 'miss' = 'damage';
    let funnyText = '';
    
    if (res.sum === 20) {
      type = 'critical'; // Natural 20
      funnyText = `Natural 20! ${name} mastery!`;
      window.dispatchEvent(new CustomEvent('playCriticalHit'));
    } else if (res.sum === 1) {
      type = 'miss'; // Natural 1
      funnyText = `Natural 1! Epic ${name} fail!`;
      window.dispatchEvent(new CustomEvent('playCriticalFail'));
    } else {
      window.dispatchEvent(new CustomEvent('playDiceRoll'));
      if (total >= 20) {
        type = 'critical'; // High success
        funnyText = `Excellent ${name}!`;
      } else if (total >= 15) {
        funnyText = `Good ${name}!`;
      } else if (total <= 5) {
        funnyText = `Poor ${name}...`;
      }
    }
    
    window.dispatchEvent(new CustomEvent('showDamage', {
      detail: {
        damage: total,
        type: type,
        x: x,
        y: y
      }
    }));
    
    // Show funny text near click position if provided
    if (funnyText && x !== undefined && y !== undefined) {
      window.dispatchEvent(new CustomEvent('showFunnyText', {
        detail: { 
          text: funnyText, 
          category: type === 'critical' ? 'criticalHit' : type === 'miss' ? 'criticalFail' : 'spellCast',
          x: x,
          y: y
        }
      }));
    }
  }
}

export async function rollInitiative(modifier: number) {
  const res = await rollDie(20, 1);
  const total = res.sum + modifier;
  
  writeRollLog('initiative', `Rolled Initiative 1d20`, '1d20', res.sum, total);
  
  // Trigger sound and visual feedback for initiative
  if (typeof window !== 'undefined') {
    let type: 'critical' | 'damage' | 'miss' = 'damage';
    
    if (res.sum === 20) {
      type = 'critical'; // Natural 20
      window.dispatchEvent(new CustomEvent('playCriticalHit'));
    } else if (res.sum === 1) {
      type = 'miss'; // Natural 1
      window.dispatchEvent(new CustomEvent('playCriticalFail'));
    } else {
      window.dispatchEvent(new CustomEvent('playDiceRoll'));
      if (total >= 18) {
        type = 'critical'; // High initiative
      }
    }
    
    window.dispatchEvent(new CustomEvent('showDamage', {
      detail: {
        damage: total,
        type: type
      }
    }));
  }
}

export async function rollSave(name: string, modifier: number, proficiency: number) {
  const res = await rollDie(20, 1);
  const total = res.sum + modifier;
  
  writeRollLog('save', `Rolled ${name} saving throw 1d20`, '1d20', res.sum, total);
  
  // Trigger sound and visual feedback for saving throws
  if (typeof window !== 'undefined') {
    let type: 'critical' | 'damage' | 'miss' = 'damage';
    
    if (res.sum === 20) {
      type = 'critical'; // Natural 20 - automatic success
      window.dispatchEvent(new CustomEvent('playCriticalHit'));
    } else if (res.sum === 1) {
      type = 'miss'; // Natural 1 - automatic failure
      window.dispatchEvent(new CustomEvent('playCriticalFail'));
    } else {
      window.dispatchEvent(new CustomEvent('playDiceRoll'));
      if (total >= 18) {
        type = 'critical'; // High save
      }
    }
    
    window.dispatchEvent(new CustomEvent('showDamage', {
      detail: {
        damage: total,
        type: type
      }
    }));
  }
}

export async function rollPassive(name: string, modifier: number) {
  const res = await rollDie(20, 1);
  const total = res.sum + modifier;
  
  writeRollLog('passive', `Rolled ${name} passive 1d20`, '1d20', res.sum, total);
  
  // Trigger sound and visual feedback for passive checks
  if (typeof window !== 'undefined') {
    let type: 'critical' | 'damage' | 'miss' = 'damage';
    
    if (res.sum === 20) {
      type = 'critical'; // Natural 20
      window.dispatchEvent(new CustomEvent('playCriticalHit'));
    } else if (res.sum === 1) {
      type = 'miss'; // Natural 1
      window.dispatchEvent(new CustomEvent('playCriticalFail'));
    } else {
      window.dispatchEvent(new CustomEvent('playDiceRoll'));
      if (total >= 18) {
        type = 'critical'; // High passive roll
      }
    }
    
    window.dispatchEvent(new CustomEvent('showDamage', {
      detail: {
        damage: total,
        type: type
      }
    }));
  }
}

export async function rollAttack(name: string, modifier: number) {
  const res = await rollDie(20, 1);
  const total = res.sum + modifier;
  
  writeRollLog('attack', `Rolled ${name} attack 1d20`, '1d20', res.sum, total);
  
  // Trigger sound and visual feedback for attacks
  if (typeof window !== 'undefined') {
    let type: 'critical' | 'damage' | 'miss' = 'damage';
    
    if (res.sum === 20) {
      type = 'critical'; // Natural 20 - critical hit
      window.dispatchEvent(new CustomEvent('playCriticalHit'));
      window.dispatchEvent(new CustomEvent('playSwordHit'));
    } else if (res.sum === 1) {
      type = 'miss'; // Natural 1 - critical miss
      window.dispatchEvent(new CustomEvent('playCriticalFail'));
    } else {
      window.dispatchEvent(new CustomEvent('playDiceRoll'));
      if (total >= 18) {
        type = 'critical'; // High attack roll
        window.dispatchEvent(new CustomEvent('playSwordHit'));
      }
    }
    
    window.dispatchEvent(new CustomEvent('showDamage', {
      detail: {
        damage: total,
        type: type
      }
    }));
  }
}

export async function rollAttackWithAmmo(name: string, modifier: number, ammoId: string) {
  // Consume ammunition first
  consumeAmmunition(ammoId);
  
  // Then perform the attack roll
  return rollAttack(name, modifier);
}

export async function rollDamage(name: string, die: number, amount: number, bonus: number) {
  const res = await rollDie(die, amount);
  const totalDamage = res.sum + bonus;
  
  // Determine if it's a critical hit (natural 20 or max damage)
  const maxPossibleDamage = (die * amount) + bonus;
  const isCritical = res.rolls.some(roll => roll === die) || totalDamage === maxPossibleDamage;
  
  writeRollLog('damage', `Rolled ${name} damage ${amount}d${die}`, `${amount}d${die}`, res.sum, totalDamage, res.rolls.join(','));
  
  // Trigger sound and damage display animation
  if (typeof window !== 'undefined') {
    if (isCritical) {
      window.dispatchEvent(new CustomEvent('playCriticalHit'));
      window.dispatchEvent(new CustomEvent('playSwordHit'));
    } else {
      window.dispatchEvent(new CustomEvent('playDiceRoll'));
    }
    
    window.dispatchEvent(new CustomEvent('showDamage', {
      detail: {
        damage: totalDamage,
        type: isCritical ? 'critical' : 'damage'
      }
    }));
  }
}

export async function rollDamageWithAmmo(name: string, die: number, amount: number, bonus: number, ammoId: string) {
  // Note: Ammunition is already consumed in rollAttackWithAmmo
  // This is just for the damage roll when using damage button separately
  return rollDamage(name, die, amount, bonus);
}

export function consumeAmmunition(ammoId: string) {
  const store = getCharacterStore();
  
  store.inventory.update(inventory => {
    const ammoIndex = inventory.findIndex(item => item.id === ammoId);
    if (ammoIndex !== -1 && inventory[ammoIndex].quantity > 0) {
      inventory[ammoIndex].quantity -= 1;
      
      // Log ammunition consumption
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showFunnyText', {
          detail: { text: `${inventory[ammoIndex].title} used!`, category: 'action' }
        }));
      }
      
      // If ammunition runs out, show warning
      if (inventory[ammoIndex].quantity === 0) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('showFunnyText', {
            detail: { text: `Out of ${inventory[ammoIndex].title}!`, category: 'warning' }
          }));
        }
      }
    }
    return inventory;
  });
}

export function writeRollLog(
  type: string,
  text: string,
  formula: string,
  roll: number,
  total: number,
  details?: string
) {
  rollStore.update(state => {
    state.push({type, text, formula, roll, total, details, rolledAt: Date()})
    return state
  })
}

export function asGold(currency: CharacterCurrency): number {
  const totalGP =
    (currency?.pp || 0) * 10 +    // Convert platinum to gold (1pp = 10gp)
    (currency?.gp || 0) +         // Gold pieces as is
    (currency?.sp || 0) * 0.1 +   // Convert silver to gold (1sp = 0.1gp)
    (currency?.cp || 0) * 0.01;   // Convert copper to gold (1cp = 0.01gp)

  return Number(totalGP.toFixed(3)); // Round to 2 decimal places
}

export function addCurrencies(currency: CharacterCurrency, currency2: CharacterCurrency): CharacterCurrency {
  return (Object.keys(currency2) as [curr: keyof CharacterCurrency]).reduce((prev, curr): CharacterCurrency => {
    return {
      ...prev,
      [curr]: (prev?.[curr] || 0) + (currency2?.[curr] || 0),
    }
  }, currency)
}

export function addTreasure(amount: number, currencyType: string = 'gp') {
  // Trigger treasure sound and funny text
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('playCoinDrop'));
    window.dispatchEvent(new CustomEvent('showFunnyText', {
      detail: { 
        text: `${amount} ${currencyType} added to your hoard!`, 
        category: 'treasure' 
      }
    }));
  }
}

export function resetCharacterLevel(targetLevel: number = 4) {
  // Reset character level and related stats
  const store = getCharacterStore();
  
  store.info.update(currentInfo => ({
    ...currentInfo,
    level: targetLevel,
    proficiencyBonus: Math.ceil(targetLevel / 4) + 1, // Standard D&D proficiency progression
    hp: {
      ...currentInfo.hp,
      // Reset HP to appropriate level 4 values (assuming d8 hit die + CON modifier)
      current: 34,
      max: 34
    },
    class: {
      ...currentInfo.class,
      hitDice: {
        amount: targetLevel,
        die: 8
      }
    }
  }));
  
  // Clear localStorage to ensure the reset sticks
  localStorage.removeItem('ch_info');
  
  // Trigger success message
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('showFunnyText', {
      detail: { 
        text: `Character reset to level ${targetLevel}!`, 
        category: 'levelUp' 
      }
    }));
  }
  
  return targetLevel;
}

export function getCharacter(): Character {
  return testCharacter
}

let characterStoreInstance: CharacterStore | null = null;
let characterStoreId: string | null = null;

// Helper function to update character store with change tracking
export function updateCharacterWithChangeLog<K extends keyof Character>(
  property: K,
  updater: (current: Character[K]) => Character[K],
  action: ChangeAction,
  description: string,
  metadata?: any
) {
  const store = getCharacterStore();
  
  // Get current state before change
  let beforeState: any;
  const unsubscribe = (store[property] as any).subscribe((current: any) => {
    beforeState = current;
  });
  unsubscribe();
  
  if (beforeState === undefined) {
    throw new Error(`Failed to get current state for property ${String(property)}`);
  }
  
  // Apply the change
  (store[property] as any).update(updater);
  
  // Get state after change
  let afterState: any;
  const unsubscribeAfter = (store[property] as any).subscribe((current: any) => {
    afterState = current;
  });
  unsubscribeAfter();
  
  if (afterState === undefined) {
    throw new Error(`Failed to get updated state for property ${String(property)}`);
  }
  
  // Log the change
  addChangeLogEntry({
    action,
    description,
    beforeState: { [property]: createStateSnapshot(beforeState) } as Partial<Character>,
    afterState: { [property]: createStateSnapshot(afterState) } as Partial<Character>,
    revertible: true,
    metadata
  });
}

// Helper function to apply state changes to character (for undo/redo)
export function applyStateToCharacter(partialState: Partial<Character>) {
  const store = characterStoreInstance ?? getCharacterStore();

  Object.entries(partialState).forEach(([key, value]) => {
    const propertyKey = key as keyof Character;
    if (store[propertyKey] && value !== undefined) {
      (store[propertyKey] as any).set(value);
    }
  });
}

// Inject the state application function into global scope for changelog
(globalThis as any).__applyCharacterState = applyStateToCharacter;

export function getCharacterStore(id: string = 'local', character: Character = getCharacter()): CharacterStore {
  if (characterStoreInstance && characterStoreId === id) {
    return characterStoreInstance;
  }

  if (characterStoreInstance) {
    characterStoreInstance.unsubscribe();
    characterStoreInstance = null;
  }

  const prefix = `ch_${id}_`

  const {unsubscribe, ...rest} = Object.keys(character).reduce((prev: any, curr) => {
    let extProp: any = localStorage.getItem(prefix + curr)
    if (extProp) {
      try {
        extProp = JSON.parse(extProp) as Character[keyof Character]
        
        // Migration: If equipped is not an array, reset it
        if (curr === 'equipped' && !Array.isArray(extProp)) {
          console.warn('Migrating equipped from object to array format');
          extProp = [];
        }
      } catch (e) {
        console.warn('Failed to parse localStorage for', curr, '- using default');
        extProp = null;
      }
    }

    const prop = extProp || character[curr as keyof Character] as Character[keyof Character]
    const propStore = writable(prop)

    const unsubscribe = propStore.subscribe(state => {
      localStorage.setItem(prefix + curr, JSON.stringify(state))
    })

    return {
      ...prev,
      [curr]: propStore,
      unsubscribe: [...prev.unsubscribe, unsubscribe]
    }
  }, {unsubscribe: []}) as CharacterContext & { unsubscribe: Unsubscriber[] }

  const store = {
    ...rest,
    unsubscribe: () => unsubscribe.forEach(unsub => unsub())
  };
  
  characterStoreInstance = store;
  characterStoreId = id;
  return store;
}

export async function decryptMediaUrl(url: string): Promise<{ type: 'video' | 'image' | 'unknown', url: string }> {
  const youtubePatterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
    /youtube.com\/shorts\/([^"&?\/\s]{11})/
  ];

  for (const pattern of youtubePatterns) {
    if (!pattern.test(url)) continue

    // Extract video ID from various YouTube URL formats
    const videoIdRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(videoIdRegex);

    if (!match) continue;

    const videoId = match[1];
    const params = 'autoplay=1&mute=1&loop=1&playlist=' + videoId + '&controls=0&showinfo=0&rel=0';
    return {
      type: 'video',
      url: `https://www.youtube-nocookie.com/embed/${videoId}?${params}`
    };
  }

  const extension = url?.split('.')?.pop()?.toLowerCase();

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov'];

  if (extension) {
    if (imageExtensions.includes(extension)) return {type: 'image', url};
    if (videoExtensions.includes(extension)) return {type: 'video', url};
  }

  try {
    const response = await fetch(url, {method: 'HEAD'});
    const contentType = response.headers.get('content-type');

    if (contentType?.startsWith('image/')) return {type: 'image', url};
    if (contentType?.startsWith('video/')) return {type: 'video', url};

    return {type: 'unknown', url};
  } catch (error) {
    console.error('Error checking content-type:', error);
    return {type: 'unknown', url};
  }
}
export function getEmptyCharacterInfo(): CharacterInfo {
  return {
    name: '',
    description: '',
    gender: '',
    imageUrl: '',
    infoUrl: '',
    level: 1,
    inspiration: false,
    hp: { current: 0, max: 0, temporary: 0 },
    ac: 10,
    initiative: 0,
    speed: '30 ft',
    proficiencyBonus: 2,
    weight: 0,
    carry_capacity: 0,
    race: { name: 'Unknown', type: 'Unknown' },
    class: { name: 'Unknown', hitDice: { amount: 1, die: 8 } },
    conditions: [],
    defences: [],
    state: { type: 'normal' }
  }
}

export function getAbilities(scores: Record<string, number>): CharacterAbility[] {
  return Object.entries(scores).map(([id, score]) => ({
    id,
    title: id.charAt(0).toUpperCase() + id.slice(1),
    score,
    modifier: Math.floor((score - 10) / 2)
  }))
}
