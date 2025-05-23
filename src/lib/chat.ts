import {type Unsubscriber, type Writable, writable} from "svelte/store";
import type {RollLog, RollLogItem} from "./types";
import {rollDie, writeRollLog, getCharacterStore, updateCharacterWithChangeLog} from "./engine";
import type {Character} from "./character.types";
import { ChangeActions, undoLastChange, redoLastChange } from "./changelog";

export type ReplicateLogItem = {
  returnedAt: Date,
  sentAt: Date,
  hidden?: boolean,
  query: string,
  response?: any,
  data?: any,
  message?: string
}
export type LogItem = { createdAt: Date } & ({ type: 'roll', data: RollLogItem } | {
  type: 'chat',
  data: ReplicateLogItem
})
export type ChatLog = Array<LogItem>
export type ReplicateLog = Array<ReplicateLogItem>

const replicateStore = writable<ReplicateLog>(JSON.parse(localStorage.getItem('replicate_log') || '[]') as ReplicateLog);

export function getReplicateLog(): { replicateStore: Writable<ReplicateLog>, unsubscribeReplicate: Unsubscriber } {
  return {
    replicateStore,
    unsubscribeReplicate: replicateStore.subscribe(value => {
      localStorage.setItem('replicate_log', JSON.stringify(value));
    })
  }
}

export interface ActionResponse {
  sentAt: Date,
  returnedAt: Date,
  explanation: string,
  sources: Array<string>,
  func: string,
  args: {
    [key: string]: any
  },
  next?: string
}

type AiAction = Omit<ActionResponse, 'sentAt' | 'returnedAt'>

export interface ReplicateInput {
  top_k: number,
  top_p: number,
  prompt: string,
  max_tokens: number,
  min_tokens: number,
  temperature: number,
  length_penalty: number,
  stop_sequences: string,
  prompt_template: string,
  presence_penalty: number,
  log_performance_metrics: boolean
}

const defaultModel = "meta/meta-llama-3-70b-instruct"

// Available models with their capabilities
export const availableModels = {
  "meta/meta-llama-3-70b-instruct": {
    name: "Llama 3 70B",
    description: "Large, powerful model for complex reasoning",
    maxTokens: 4000,
    type: "llama"
  },
  "meta/meta-llama-3-8b-instruct": {
    name: "Llama 3 8B", 
    description: "Faster, smaller model for quick responses",
    maxTokens: 2000,
    type: "llama"
  },
  "mistralai/mixtral-8x7b-instruct-v0.1": {
    name: "Mixtral 8x7B",
    description: "Excellent for creative tasks and roleplay",
    maxTokens: 8000,
    type: "mixtral"
  },
  "anthropic/claude-3-haiku": {
    name: "Claude 3 Haiku",
    description: "Fast and efficient for quick tasks",
    maxTokens: 4000,
    type: "claude"
  }
};

async function callReplicate(input: ReplicateInput, modelId?: string) {
  const model = modelId || defaultModel;
  const apiKey = localStorage.getItem("replicate_api_key")

  if (!apiKey) {
    throw new Error("Replicate api key is missing")
  }

  const url = "/replicate/models/" + model + "/predictions";
  console.log('Making Replicate API call to:', url);
  
  const req = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + apiKey
    },
    body: JSON.stringify({
      stream: false,
      input
    })
  })

  console.log('Replicate response status:', req.status);
  
  if (!req.ok) {
    const errorText = await req.text();
    console.error('Replicate error:', errorText);
    throw new Error(`Replicate API error ${req.status}: ${req.statusText} - ${errorText}`)
  }

  const sentAt = new Date()

  const resp = await req.json()
  let getUrl: string | undefined = resp?.urls?.get
  // https://api.replicate.com/v1/predictions/zc4xabca4hrj00cmsd9s1ps9xw
  getUrl = getUrl?.replace('https://api.replicate.com/v1', 'replicate')

  if (!getUrl) {
    throw new Error(`Invalid response`)
  }

  let timeout: any
  const pullResult = (retries?: number): Promise<any> => new Promise((resolve, reject) => {
    const currentRetries = retries || 1;
    
    if (currentRetries > 15) {
      reject(new Error('Replicate API timeout after 15 retries'));
      return;
    }
    
    clearTimeout(timeout)
    timeout = setTimeout(async () => {
      try {
        console.log(`Polling Replicate result, attempt ${currentRetries}`);
        
        const res = await fetch(getUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
          },
        })

        if (!res.ok) {
          console.log(`Poll failed with status ${res.status}, retrying...`);
          return pullResult(currentRetries + 1).then(resolve).catch(reject);
        }

        const body = await res.json()
        console.log('Replicate poll response:', body);
        
        if (body.status === 'succeeded') {
          const output = body.output?.join('');
          console.log('Replicate output:', output);
          
          if (output) {
            try {
              const parsed = JSON.parse(output);
              resolve(parsed);
            } catch (parseError) {
              console.error('Failed to parse Replicate output as JSON:', parseError);
              reject(new Error('Invalid JSON response from Replicate'));
            }
          } else {
            reject(new Error('Empty output from Replicate'));
          }
        } else if (body.status === 'failed') {
          reject(new Error(`Replicate prediction failed: ${body.error}`));
        } else {
          // Still processing, continue polling
          return pullResult(currentRetries + 1).then(resolve).catch(reject);
        }
      } catch (e) {
        console.error('Error during polling:', e);
        return pullResult(currentRetries + 1).then(resolve).catch(reject);
      }
    }, 2000 * currentRetries)
  })

  const res = await pullResult() as any
  return {
    ...res,
    sentAt,
    returnedAt: new Date(),
  } as ActionResponse
}

export async function detectAction(query: string, modelId?: string) {
  // Simple pattern matching for common commands before AI processing
  const lowercaseQuery = query.toLowerCase().trim();
  
  // Direct command shortcuts
  if (lowercaseQuery.includes('level up') || lowercaseQuery === 'level up' || lowercaseQuery === 'levelup') {
    console.log('Direct level up command detected');
    return await aiLevelUp({ explanation: 'Direct level up command', sources: [], func: 'levelUp', args: {} });
  }
  
  if (lowercaseQuery.includes('change theme') || lowercaseQuery.includes('theme')) {
    console.log('Direct theme command detected');
    return await aiChangeTheme({ explanation: 'Direct theme command', sources: [], func: 'changeTheme', args: {} });
  }
  
  // Health/healing commands
  if (lowercaseQuery.includes('refill health') || lowercaseQuery.includes('heal me') || lowercaseQuery.includes('restore health')) {
    console.log('Direct health refill command detected');
    return await aiRefillHealth({ explanation: 'Direct health refill command', sources: [], func: 'refillHealth', args: {} });
  }
  
  // Special resource commands
  if (lowercaseQuery.includes('refill grit') || lowercaseQuery.includes('restore grit') || 
      lowercaseQuery.includes('refill chi') || lowercaseQuery.includes('restore chi') ||
      lowercaseQuery.includes('refill sorcery') || lowercaseQuery.includes('restore sorcery')) {
    console.log('Direct special resource refill command detected');
    return await aiRefillSpecial({ explanation: 'Direct special resource refill command', sources: [], func: 'refillSpecial', args: {} });
  }
  
  // Spell slot commands
  if (lowercaseQuery.includes('refill spell') || lowercaseQuery.includes('restore spell')) {
    console.log('Direct spell slot refill command detected');
    return await aiRefillSpellSlots({ explanation: 'Direct spell slot refill command', sources: [], func: 'refillSpellSlots', args: {} });
  }
  
  // Rest commands
  if (lowercaseQuery.includes('short rest') || lowercaseQuery === 'rest') {
    console.log('Direct short rest command detected');
    return await aiShortRest({ explanation: 'Direct short rest command', sources: [], func: 'shortRest', args: {} });
  }
  
  if (lowercaseQuery.includes('long rest') || lowercaseQuery.includes('sleep')) {
    console.log('Direct long rest command detected');
    return await aiLongRest({ explanation: 'Direct long rest command', sources: [], func: 'longRest', args: {} });
  }
  
  // Level progression queries
  const levelMatch = lowercaseQuery.match(/(?:what (?:do )?i get (?:at|in) level (\d+)|level (\d+) (?:features|abilities|progression)|(\d+)(?:th|st|nd|rd) level)/);
  if (levelMatch) {
    const level = parseInt(levelMatch[1] || levelMatch[2] || levelMatch[3], 10);
    console.log(`Direct level progression command detected for level ${level}`);
    return await aiLevelProgression({ explanation: 'Direct level progression query', sources: [], func: 'levelProgression', args: { level } });
  }
  
  // Level down queries
  const levelDownMatch = lowercaseQuery.match(/(?:level.*down.*(?:to )?(?:level )?(\d+)|reduce.*level.*(?:to )?(\d+)|back.*(?:to )?level (\d+))/);
  if (levelDownMatch) {
    const targetLevel = parseInt(levelDownMatch[1] || levelDownMatch[2] || levelDownMatch[3], 10);
    console.log(`Direct level down command detected to level ${targetLevel}`);
    return await aiLevelDown({ explanation: 'Direct level down command', sources: [], func: 'levelDown', args: { targetLevel } });
  }
  
  // Undo/Redo commands
  if (lowercaseQuery.includes('undo') || lowercaseQuery.includes('ctrl+z') || lowercaseQuery.includes('revert')) {
    console.log('Direct undo command detected');
    return await aiUndoLastChange({ explanation: 'Direct undo command', sources: [], func: 'undoLastChange', args: {} });
  }
  
  if (lowercaseQuery.includes('redo') || lowercaseQuery.includes('ctrl+y')) {
    console.log('Direct redo command detected');
    return await aiRedoLastChange({ explanation: 'Direct redo command', sources: [], func: 'redoLastChange', args: {} });
  }
  
  // Test damage display command
  if (lowercaseQuery.includes('test damage') || lowercaseQuery.includes('test confetti') || lowercaseQuery.includes('demo damage')) {
    console.log('Direct test damage command detected');
    window.dispatchEvent(new CustomEvent('testDamageDisplay'));
    
    replicateStore.update(state => ([...state, {
      query: 'Test Damage Display',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: "🎆 **Testing Damage Display!**\n\nWatch the screen for WoW-style damage numbers and confetti animations!\n\nTry rolling some dice by clicking skill check buttons or attack/damage buttons to see the system in action.",
      hidden: false
    }]));
    
    return Promise.resolve();
  }
  
  // Condition management commands
  const addConditionMatch = lowercaseQuery.match(/(?:add|apply|give me|inflict)\s+(?:condition\s+)?(.+?)(?:\s+(?:condition|effect|status))?$/);
  if (addConditionMatch) {
    const conditionName = addConditionMatch[1].trim();
    console.log(`Direct add condition command detected: ${conditionName}`);
    return await aiAddCondition({ explanation: 'Direct add condition command', sources: [], func: 'addCondition', args: { condition: conditionName } });
  }
  
  const removeConditionMatch = lowercaseQuery.match(/(?:remove|cure|clear|end)\s+(?:condition\s+)?(.+?)(?:\s+(?:condition|effect|status))?$/);
  if (removeConditionMatch) {
    const conditionName = removeConditionMatch[1].trim();
    console.log(`Direct remove condition command detected: ${conditionName}`);
    return await aiRemoveCondition({ explanation: 'Direct remove condition command', sources: [], func: 'removeCondition', args: { condition: conditionName } });
  }
  
  // Defense/resistance management commands
  const addDefenseMatch = lowercaseQuery.match(/(?:add|give me|grant)\s+(?:(?:resistance|immunity|defense)\s+(?:to\s+)?)?(.+?)(?:\s+(?:resistance|immunity|defense))?$/);
  if (addDefenseMatch && (lowercaseQuery.includes('resistance') || lowercaseQuery.includes('immunity') || lowercaseQuery.includes('defense'))) {
    const defenseName = addDefenseMatch[1].trim();
    console.log(`Direct add defense command detected: ${defenseName}`);
    return await aiAddDefense({ explanation: 'Direct add defense command', sources: [], func: 'addDefense', args: { defense: defenseName } });
  }
  
  const removeDefenseMatch = lowercaseQuery.match(/(?:remove|lose|clear)\s+(?:(?:resistance|immunity|defense)\s+(?:to\s+)?)?(.+?)(?:\s+(?:resistance|immunity|defense))?$/);
  if (removeDefenseMatch && (lowercaseQuery.includes('resistance') || lowercaseQuery.includes('immunity') || lowercaseQuery.includes('defense'))) {
    const defenseName = removeDefenseMatch[1].trim();
    console.log(`Direct remove defense command detected: ${defenseName}`);
    return await aiRemoveDefense({ explanation: 'Direct remove defense command', sources: [], func: 'removeDefense', args: { defense: defenseName } });
  }
  
  // List conditions/defenses commands
  if (lowercaseQuery.includes('list conditions') || lowercaseQuery.includes('show conditions') || lowercaseQuery.includes('what conditions')) {
    console.log('Direct list conditions command detected');
    return await aiListConditions({ explanation: 'Direct list conditions command', sources: [], func: 'listConditions', args: {} });
  }
  
  if (lowercaseQuery.includes('list defenses') || lowercaseQuery.includes('show defenses') || lowercaseQuery.includes('what resistances')) {
    console.log('Direct list defenses command detected');
    return await aiListDefenses({ explanation: 'Direct list defenses command', sources: [], func: 'listDefenses', args: {} });
  }
  
  // Inventory/items commands
  if (lowercaseQuery.includes('show items') || lowercaseQuery.includes('list items') || lowercaseQuery.includes('my items') || 
      lowercaseQuery.includes('show inventory') || lowercaseQuery.includes('list inventory') || lowercaseQuery.includes('my inventory') ||
      lowercaseQuery === 'items' || lowercaseQuery === 'inventory') {
    console.log('Direct show items command detected');
    return await aiShowItems({ explanation: 'Direct show items command', sources: [], func: 'showItems', args: {} });
  }
  
  // Specific item query commands (e.g., "show me my gun", "show my sword", etc.)
  const specificItemMatch = lowercaseQuery.match(/(?:show|find|describe|tell me about)\s+(?:me\s+)?(?:my\s+)?(.+?)(?:\s+(?:item|equipment|weapon|armor))?$/);
  if (specificItemMatch && !lowercaseQuery.includes('items') && !lowercaseQuery.includes('inventory') && 
      !lowercaseQuery.includes('conditions') && !lowercaseQuery.includes('defenses') &&
      !lowercaseQuery.includes('add') && !lowercaseQuery.includes('remove')) {
    const itemQuery = specificItemMatch[1].trim();
    console.log(`Direct show specific item command detected: ${itemQuery}`);
    return await aiShowSpecificItem({ explanation: 'Direct show specific item command', sources: [], func: 'showSpecificItem', args: { itemQuery } });
  }
  
  // Add item/ammunition commands
  const addItemMatch = lowercaseQuery.match(/(?:add|give me|create)\s+(\d+)?\s*(?:x\s+)?(.+?)(?:\s+(?:to inventory|item|equipment))?$/);
  if (addItemMatch && (lowercaseQuery.includes('add') || lowercaseQuery.includes('give me') || lowercaseQuery.includes('create'))) {
    const quantity = parseInt(addItemMatch[1]) || 1;
    const itemName = addItemMatch[2].trim();
    console.log(`Direct add item command detected: ${quantity}x ${itemName}`);
    return await aiAddItem({ explanation: 'Direct add item command', sources: [], func: 'addItem', args: { itemName, quantity } });
  }
  
  // Remove item/ammunition commands
  const removeItemMatch = lowercaseQuery.match(/(?:remove|delete|lose)\s+(\d+)?\s*(?:x\s+)?(.+?)(?:\s+(?:from inventory|item|equipment))?$/);
  if (removeItemMatch && (lowercaseQuery.includes('remove') || lowercaseQuery.includes('delete') || lowercaseQuery.includes('lose'))) {
    const quantity = parseInt(removeItemMatch[1]) || 1;
    const itemName = removeItemMatch[2].trim();
    console.log(`Direct remove item command detected: ${quantity}x ${itemName}`);
    return await aiRemoveItem({ explanation: 'Direct remove item command', sources: [], func: 'removeItem', args: { itemName, quantity } });
  }
  const input = {
    top_k: 0,
    top_p: 0.9,
    prompt: query,
    max_tokens: 2000,
    min_tokens: 0,
    temperature: 0.6,
    length_penalty: 1,
    stop_sequences: "<|end_of_text|>,<|eot_id|>",
    prompt_template: `
      <|begin_of_text|><|start_header_id|>system<|end_header_id|>
      \n\nYou are a helpful action selecting assistant that always find the correct action the user wants. Figure out 
      what data is most likely required, and what functions to call among the below options (include arguments if described)
      Try as best as possible to always resolve i to one of the actions and populate the arguments!
      
      Data sources: 
      1. info: All character general info
      2. feats: All character traits and feats 
      3. abilities: All character abilities
      4. savingThrows: All character saving throws
      5. skills: All character skills 
      6. senses: All character senses and passive abilities
      7. actions: All actions the character can take 
      8. spells: All player spells
      9. proficients: All character proficiencies
      10. inventory: All character inventory
      11. currency: All character currency, 
      12. background: All character background and lore
      13. dnd_handbook: Dungeons & dragons 5th edition sources
      14. items_database: Equipment, weapons, armor, and magic items
      15. npcs_database: NPCs, monsters, and creatures
      16. external: External source
      
      Functions:
      1. rollDie: rolls a specific set of dies [args; die: 4 | 6 | 8 | 10 | 12 | 20 | 100, amount: number].
      2. lookupCharacterSource: Looks up details about the character (this is the user) [args; query: string].
      3. lookupSource: Look up a dungeons and dragons related query [args; query: string].
      4. updateInfo: Update general character information.
      5. updateFeats: Updates character feats.
      6. updateAbilities: Updates character abilities.
      7. updateSavingThrows: Updates character saving throws.
      8. updateSkills: Updates character skills.
      9. updateSenses: Update character senses.
      10. updateActions: Updates character actions.
      11. updateSpells: Updates character spells.
      12. updateProficients: Updates character proficients.
      13. updateInventory: Updates character inventory.
      14. updateCurrency: Updates character currency/money.
      15. updateBackground: Updates character background and lore.
      16. levelUp: Triggers the level up dialog for character advancement.
      17. changeTheme: Opens the theme selection dialog.
      18. showCombatActions: Lists all available combat actions and spells.
      19. recommendFeat: Suggests feats based on character build and level.
      20. findUnusedItems: Shows least used or never used inventory items.
      21. showSources: Opens the character sources management dialog.
      22. calculateStats: Shows current character statistics and modifiers.
      23. suggestSpells: Recommends spells for spellcasting characters.
      24. optimizeBuild: Provides character optimization suggestions.
      25. lookupItem: Look up information about a specific item or equipment [args; itemName: string].
      26. lookupNPC: Look up information about an NPC, monster, or creature [args; npcName: string].
      27. searchItems: Search for items by type, properties, or description [args; query: string, type?: string].
      28. searchNPCs: Search for NPCs by type, challenge rating, or abilities [args; query: string, type?: string].
      29. refillHealth: Restore character hit points to maximum [args; amount?: number].
      30. refillSpecial: Restore special resources like grit points, chi, sorcery points [args; resourceName?: string].
      31. refillSpellSlots: Restore spell slots to maximum [args; level?: number].
      32. shortRest: Take a short rest to recover some resources.
      33. longRest: Take a long rest to recover most resources.
      34. levelProgression: Show what features, feats, and abilities are gained at a specific level [args; level: number].
      35. levelDown: Reduce character level and revert associated changes [args; targetLevel: number].
      36. undoLastChange: Undo the most recent character change (Ctrl+Z functionality).
      37. redoLastChange: Redo the most recently undone change.
      
      Return:
      Always answer as a json after the below schema, omit all other output. No other output then the below json schema!!
      (When in doubt, put your follow up question as the next parameter).    
      {{
        "explanation": "Why you have decided the sources and function",
        "sources": ["key of the sources to use as a string array"],
        "func": "key of the function to call",
        "args:": {{
          "key of argument": "argument value"  
        }},
        "next"?: "A prompt for the next AI call with what to do with the result, if the user has explicitly specified to do something with the result. Omit if not specified!"
      }}
      
      no other response than json, omit all other output but the json response!
     
      <|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n
    `,
    presence_penalty: 1.15,
    log_performance_metrics: false
  };

  const {sentAt, returnedAt, ...rest} = await callReplicate(input, modelId) as ActionResponse

  console.log('AI Action Result:', rest)

  replicateStore.update(state => ([...state, {
    query,
    sentAt,
    returnedAt,
    response: JSON.stringify(rest),
    data: rest,
    hidden: true
  }]))

  console.log('Executing function:', rest.func)

  switch (rest.func) {
    case 'rollDie': {
      return await aiRollDie(rest)
    }
    case 'updateInventory': {
      return aiUpdateInventory(rest)
    }
    case 'levelUp': {
      return await aiLevelUp(rest)
    }
    case 'changeTheme': {
      return await aiChangeTheme(rest)
    }
    case 'showCombatActions': {
      return aiShowCombatActions(rest)
    }
    case 'recommendFeat': {
      return aiRecommendFeat(rest)
    }
    case 'findUnusedItems': {
      return aiFindUnusedItems(rest)
    }
    case 'showSources': {
      return await aiShowSources(rest)
    }
    case 'calculateStats': {
      return aiCalculateStats(rest)
    }
    case 'suggestSpells': {
      return aiSuggestSpells(rest)
    }
    case 'optimizeBuild': {
      return aiOptimizeBuild(rest)
    }
    case 'lookupItem': {
      return aiLookupItem(rest)
    }
    case 'lookupNPC': {
      return aiLookupNPC(rest)
    }
    case 'searchItems': {
      return aiSearchItems(rest)
    }
    case 'searchNPCs': {
      return aiSearchNPCs(rest)
    }
    case 'refillHealth': {
      return aiRefillHealth(rest)
    }
    case 'refillSpecial': {
      return aiRefillSpecial(rest)
    }
    case 'refillSpellSlots': {
      return aiRefillSpellSlots(rest)
    }
    case 'shortRest': {
      return aiShortRest(rest)
    }
    case 'longRest': {
      return aiLongRest(rest)
    }
    case 'levelProgression': {
      return await aiLevelProgression(rest)
    }
    case 'levelDown': {
      return await aiLevelDown(rest)
    }
    case 'undoLastChange': {
      return await aiUndoLastChange(rest)
    }
    case 'redoLastChange': {
      return await aiRedoLastChange(rest)
    }
    case 'addCondition': {
      return await aiAddCondition(rest)
    }
    case 'removeCondition': {
      return await aiRemoveCondition(rest)
    }
    case 'addDefense': {
      return await aiAddDefense(rest)
    }
    case 'removeDefense': {
      return await aiRemoveDefense(rest)
    }
    case 'listConditions': {
      return await aiListConditions(rest)
    }
    case 'listDefenses': {
      return await aiListDefenses(rest)
    }
    case 'showItems': {
      return await aiShowItems(rest)
    }
    case 'showSpecificItem': {
      return await aiShowSpecificItem(rest)
    }
    case 'addItem': {
      return await aiAddItem(rest)
    }
    case 'removeItem': {
      return await aiRemoveItem(rest)
    }
    default:
      if (rest.next) {
        replicateStore.update(state => ([...state, {
          query,
          sentAt,
          returnedAt: new Date(),
          message: rest.next,
          hidden: false
        }]))
      } else {
        throw new Error(`Unknown action ${rest.func}`)
      }
  }
}

async function aiRollDie(action: AiAction) {
  try {
    const die = parseInt(action.args.die, 0)
    const amount = parseInt(action.args.amount, 0)

    const res = await rollDie(die, amount)
    return writeRollLog('ai', `Rolled some dies ${amount}d${die}`, res.sum, res.sum, res.rolls.join(','));
  } catch (e: any) {
    throw new Error(e)
  }
}

// Global UI action dispatcher - will be set by the main component
let uiActionDispatcher: ((action: string, payload?: any) => void) | null = null;

export function setUIActionDispatcher(dispatcher: (action: string, payload?: any) => void) {
  uiActionDispatcher = dispatcher;
}

async function aiUpdateInventory(action: AiAction) {
  try {
    const die = parseInt(action.args.die, 0)
    const amount = parseInt(action.args.amount, 0)

    const res = await rollDie(die, amount)
    return writeRollLog('ai', `Rolled some dies ${amount}d${die}`, res.sum, res.sum, res.rolls.join(','));
  } catch (e: any) {
    throw new Error(e)
  }
}

async function aiLevelUp(action: AiAction) {
  try {
    if (uiActionDispatcher) {
      uiActionDispatcher('levelUp');
    }
    
    replicateStore.update(state => ([...state, {
      query: 'Level Up',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: "🎉 Opening level up dialog! Time to advance your character.",
      hidden: false
    }]));
    
    return Promise.resolve(); // Make sure we return something
  } catch (error) {
    console.error('Level up error:', error);
    
    replicateStore.update(state => ([...state, {
      query: 'Level Up',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: "❌ **Error:** Unable to open level up dialog. Please try using the Level Up button in the character info panel.",
      hidden: false
    }]));
    
    return Promise.resolve();
  }
}

async function aiChangeTheme(action: AiAction) {
  try {
    if (uiActionDispatcher) {
      uiActionDispatcher('changeTheme');
    }
    
    replicateStore.update(state => ([...state, {
      query: 'Change Theme',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: "🎨 Opening theme selection dialog! Choose your preferred visual style.",
      hidden: false
    }]));
    
    return Promise.resolve();
  } catch (error) {
    console.error('Change theme error:', error);
    return Promise.resolve();
  }
}

async function aiShowCombatActions(action: AiAction) {
  // This would query character data and show combat options
  replicateStore.update(state => ([...state, {
    query: 'Show Combat Actions',
    sentAt: new Date(),
    returnedAt: new Date(),
    message: "⚔️ **Available Combat Actions:**\n\n• **Attack** - Make a weapon or spell attack\n• **Cast a Spell** - Use one of your known spells\n• **Dash** - Double your movement speed\n• **Dodge** - Gain advantage on Dex saves, attackers have disadvantage\n• **Help** - Give an ally advantage on their next ability check\n• **Hide** - Make a Stealth check to become hidden\n• **Ready** - Prepare an action for a specific trigger\n• **Search** - Look for something with a Perception or Investigation check\n\nAsk me about specific spells or abilities for more details!",
    hidden: false
  }]));
}

async function aiRecommendFeat(action: AiAction) {
  replicateStore.update(state => ([...state, {
    query: 'Recommend Feat',
    sentAt: new Date(),
    returnedAt: new Date(),
    message: "💡 **Feat Recommendations:**\n\nBased on your character build, here are some great feat options:\n\n• **Great Weapon Master** - Perfect for two-handed weapon fighters\n• **Sharpshooter** - Excellent for ranged combat specialists\n• **War Caster** - Essential for spellcasters in melee\n• **Lucky** - Great for any character, provides rerolls\n• **Alert** - Boosts initiative and prevents surprise\n\nTell me more about your playstyle for personalized recommendations!",
    hidden: false
  }]));
}

async function aiFindUnusedItems(action: AiAction) {
  replicateStore.update(state => ([...state, {
    query: 'Find Unused Items',
    sentAt: new Date(),
    returnedAt: new Date(),
    message: "🎒 **Inventory Analysis:**\n\nItems you might want to consider using or selling:\n\n• **Rope (50 feet)** - Always handy for climbing or puzzles\n• **Caltrops** - Great for area denial in combat\n• **Ball Bearings** - Can slow down pursuers\n• **Healing Potions** - Don't hoard these, use them!\n\nConsider what tools might solve problems you're facing!",
    hidden: false
  }]));
}

async function aiShowSources(action: AiAction) {
  try {
    if (uiActionDispatcher) {
      uiActionDispatcher('showSources');
    }
    
    replicateStore.update(state => ([...state, {
      query: 'Show Sources',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: "📚 Opening character sources dialog! Manage your imported class data and sourcebooks.",
      hidden: false
    }]));
    
    return Promise.resolve();
  } catch (error) {
    console.error('Show sources error:', error);
    return Promise.resolve();
  }
}

async function aiCalculateStats(action: AiAction) {
  replicateStore.update(state => ([...state, {
    query: 'Calculate Stats',
    sentAt: new Date(),
    returnedAt: new Date(),
    message: "📊 **Character Statistics:**\n\n**Combat Stats:**\n• Attack Bonus: +7 (varies by weapon)\n• Damage Bonus: +4 (Strength)\n• Armor Class: 16\n• Hit Points: 45/45\n\n**Saving Throws:**\n• Proficient: Strength +7, Constitution +6\n• Others: Dex +2, Int +0, Wis +1, Cha +1\n\n**Skills:** Based on your proficiencies and ability modifiers\n\nNeed specific calculations? Just ask!",
    hidden: false
  }]));
}

async function aiSuggestSpells(action: AiAction) {
  replicateStore.update(state => ([...state, {
    query: 'Suggest Spells',
    sentAt: new Date(),
    returnedAt: new Date(),
    message: "✨ **Spell Suggestions:**\n\n**Cantrips (Always useful):**\n• **Eldritch Blast** - Reliable damage\n• **Mage Hand** - Utility at range\n• **Prestidigitation** - Endless possibilities\n\n**1st Level:**\n• **Shield** - +5 AC as reaction\n• **Magic Missile** - Guaranteed damage\n• **Healing Word** - Bonus action healing\n\n**2nd Level:**\n• **Misty Step** - Teleport as bonus action\n• **Web** - Area control\n\nWhat's your spell focus? Damage, utility, or support?",
    hidden: false
  }]));
}

async function aiOptimizeBuild(action: AiAction) {
  replicateStore.update(state => ([...state, {
    query: 'Optimize Build',
    sentAt: new Date(),
    returnedAt: new Date(),
    message: "🎯 **Character Optimization Tips:**\n\n**Ability Score Priority:**\n1. **Primary Stat** - Max this first (attacks/spells)\n2. **Constitution** - More HP and concentration\n3. **Secondary Stats** - Based on your role\n\n**Feat vs ASI:**\n• Take feats when primary stat is 16+\n• Prioritize feats that enhance your core strategy\n\n**Action Economy:**\n• Look for bonus action options\n• Consider reaction abilities\n• Don't neglect movement\n\nWhat aspect would you like to optimize?",
    hidden: false
  }]));
}

async function aiLookupItem(action: AiAction) {
  try {
    const itemName = action.args.itemName?.toLowerCase() || '';
    const item = await findItemInDatabase(itemName);
    
    if (item) {
      const itemCard = await createItemCard(item);
      replicateStore.update(state => ([...state, {
        query: `Lookup Item: ${itemName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: itemCard,
        data: { type: 'item_card', item },
        hidden: false
      }]));
    } else {
      replicateStore.update(state => ([...state, {
        query: `Lookup Item: ${itemName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Item Not Found:** "${itemName}"\n\nTry searching for similar items or check the spelling. I can help you search by type (weapon, armor, tool) or properties.`,
        hidden: false
      }]));
    }
  } catch (error) {
    console.error('Item lookup error:', error);
  }
}

async function aiLookupNPC(action: AiAction) {
  try {
    const npcName = action.args.npcName?.toLowerCase() || '';
    const npc = await findNPCInDatabase(npcName);
    
    if (npc) {
      const npcCard = await createNPCCard(npc);
      replicateStore.update(state => ([...state, {
        query: `Lookup NPC: ${npcName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: npcCard,
        data: { type: 'npc_card', npc },
        hidden: false
      }]));
    } else {
      replicateStore.update(state => ([...state, {
        query: `Lookup NPC: ${npcName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **NPC Not Found:** "${npcName}"\n\nTry searching for similar creatures or check the spelling. I can help you search by type (humanoid, monster, beast) or challenge rating.`,
        hidden: false
      }]));
    }
  } catch (error) {
    console.error('NPC lookup error:', error);
  }
}

async function aiSearchItems(action: AiAction) {
  try {
    const query = action.args.query?.toLowerCase() || '';
    const type = action.args.type?.toLowerCase() || '';
    const results = await searchItemsDatabase(query, type);
    
    if (results.length > 0) {
      const itemsList = results.slice(0, 5).map(item => 
        `• **${item.name}** (${item.rarity}) - ${item.description.substring(0, 80)}...`
      ).join('\n');
      
      replicateStore.update(state => ([...state, {
        query: `Search Items: ${query}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `🔍 **Items Found:**\n\n${itemsList}\n\n${results.length > 5 ? `\\n*Showing first 5 of ${results.length} results*` : ''}\n\nAsk me about a specific item for detailed information!`,
        hidden: false
      }]));
    } else {
      replicateStore.update(state => ([...state, {
        query: `Search Items: ${query}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **No Items Found** matching "${query}"\n\nTry different keywords or item types: weapon, armor, tool, consumable, magic`,
        hidden: false
      }]));
    }
  } catch (error) {
    console.error('Item search error:', error);
  }
}

async function aiSearchNPCs(action: AiAction) {
  try {
    const query = action.args.query?.toLowerCase() || '';
    const type = action.args.type?.toLowerCase() || '';
    const results = await searchNPCsDatabase(query, type);
    
    if (results.length > 0) {
      const npcsList = results.slice(0, 5).map(npc => 
        `• **${npc.name}** (CR ${npc.challengeRating}) - ${npc.description.substring(0, 80)}...`
      ).join('\n');
      
      replicateStore.update(state => ([...state, {
        query: `Search NPCs: ${query}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `🔍 **NPCs Found:**\n\n${npcsList}\n\n${results.length > 5 ? `\\n*Showing first 5 of ${results.length} results*` : ''}\n\nAsk me about a specific NPC for detailed stats!`,
        hidden: false
      }]));
    } else {
      replicateStore.update(state => ([...state, {
        query: `Search NPCs: ${query}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **No NPCs Found** matching "${query}"\n\nTry different keywords or types: humanoid, monster, beast, undead`,
        hidden: false
      }]));
    }
  } catch (error) {
    console.error('NPC search error:', error);
  }
}

// Database lookup functions
async function findItemInDatabase(itemName: string): Promise<any | null> {
  try {
    const response = await fetch('/sources/items/equipment.json');
    const data = await response.json();
    
    // Find exact match or partial match
    const items = Object.values(data.items) as any[];
    return items.find(item => 
      item.name.toLowerCase().includes(itemName) || 
      item.id.toLowerCase().includes(itemName) ||
      item.tags?.some((tag: string) => tag.toLowerCase().includes(itemName))
    ) || null;
  } catch (error) {
    console.error('Error loading items database:', error);
    return null;
  }
}

async function findNPCInDatabase(npcName: string): Promise<any | null> {
  try {
    const response = await fetch('/sources/npcs/common-npcs.json');
    const data = await response.json();
    
    // Find exact match or partial match
    const npcs = Object.values(data.npcs) as any[];
    return npcs.find(npc => 
      npc.name.toLowerCase().includes(npcName) || 
      npc.id.toLowerCase().includes(npcName) ||
      npc.tags?.some((tag: string) => tag.toLowerCase().includes(npcName))
    ) || null;
  } catch (error) {
    console.error('Error loading NPCs database:', error);
    return null;
  }
}

async function searchItemsDatabase(query: string, type: string): Promise<any[]> {
  try {
    const response = await fetch('/sources/items/equipment.json');
    const data = await response.json();
    
    const items = Object.values(data.items) as any[];
    return items.filter(item => {
      const matchesQuery = !query || 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(query));
      
      const matchesType = !type || 
        item.type.toLowerCase().includes(type) ||
        item.subtype?.toLowerCase().includes(type);
      
      return matchesQuery && matchesType;
    });
  } catch (error) {
    console.error('Error searching items database:', error);
    return [];
  }
}

async function searchNPCsDatabase(query: string, type: string): Promise<any[]> {
  try {
    const response = await fetch('/sources/npcs/common-npcs.json');
    const data = await response.json();
    
    const npcs = Object.values(data.npcs) as any[];
    return npcs.filter(npc => {
      const matchesQuery = !query || 
        npc.name.toLowerCase().includes(query) ||
        npc.description.toLowerCase().includes(query) ||
        npc.tags?.some((tag: string) => tag.toLowerCase().includes(query));
      
      const matchesType = !type || 
        npc.type.toLowerCase().includes(type) ||
        npc.tags?.some((tag: string) => tag.toLowerCase().includes(type));
      
      return matchesQuery && matchesType;
    });
  } catch (error) {
    console.error('Error searching NPCs database:', error);
    return [];
  }
}

// Image fetching service for D&D content
async function fetchDnDImage(searchTerm: string, type: 'item' | 'creature' = 'item'): Promise<string | null> {
  try {
    // Try Unsplash Source first (most reliable, no CORS issues)
    const unsplashUrl = await fetchUnsplashImage(searchTerm, type);
    if (unsplashUrl) {
      return unsplashUrl;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to fetch D&D image:', error);
    return null;
  }
}

// Unsplash Source API - no CORS issues, good quality
async function fetchUnsplashImage(searchTerm: string, type: 'item' | 'creature'): Promise<string | null> {
  try {
    // Create themed search terms for better results
    const itemKeywords = ['sword', 'weapon', 'armor', 'shield', 'medieval', 'fantasy'];
    const creatureKeywords = ['dragon', 'fantasy', 'creature', 'monster', 'warrior', 'medieval'];
    
    const keywords = type === 'item' ? itemKeywords : creatureKeywords;
    
    // Find a keyword that matches the search term or use a default
    let searchKeyword = keywords.find(keyword => 
      searchTerm.toLowerCase().includes(keyword) || 
      keyword.includes(searchTerm.toLowerCase())
    );
    
    // Fallback mapping for common D&D items/creatures
    if (!searchKeyword) {
      const mapping: { [key: string]: string } = {
        // Weapons
        'longsword': 'sword',
        'shortsword': 'sword', 
        'dagger': 'knife',
        'bow': 'bow',
        'crossbow': 'crossbow',
        'staff': 'staff',
        'wand': 'magic',
        'mace': 'mace',
        'axe': 'axe',
        'hammer': 'hammer',
        
        // Armor
        'chainmail': 'armor',
        'plate': 'armor',
        'leather': 'leather',
        'shield': 'shield',
        
        // Items
        'potion': 'potion',
        'scroll': 'scroll',
        'rope': 'rope',
        'torch': 'fire',
        
        // Creatures
        'goblin': 'monster',
        'orc': 'warrior',
        'dragon': 'dragon',
        'wolf': 'wolf',
        'guard': 'guard',
        'merchant': 'person',
        'wizard': 'wizard',
        'knight': 'knight'
      };
      
      searchKeyword = mapping[searchTerm.toLowerCase()] || (type === 'item' ? 'medieval' : 'fantasy');
    }
    
    // Use Unsplash Source with the determined keyword
    const imageUrl = `https://source.unsplash.com/featured/400x300/?${searchKeyword}`;
    
    return imageUrl;
  } catch (error) {
    return null;
  }
}

// Enhanced image URL getter with caching
const imageCache = new Map<string, string>();

async function getImageForItem(item: any): Promise<string> {
  const cacheKey = `item_${item.id || item.name}`;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  // If item already has an imageUrl that's not a placeholder, use it
  if (item.imageUrl && !item.imageUrl.includes('unsplash.com')) {
    imageCache.set(cacheKey, item.imageUrl);
    return item.imageUrl;
  }
  
  // Try to fetch a real D&D image
  const fetchedImage = await fetchDnDImage(item.name, 'item');
  
  if (fetchedImage) {
    imageCache.set(cacheKey, fetchedImage);
    return fetchedImage;
  }
  
  // Fallback to themed placeholder
  const itemType = item.type?.toLowerCase() || 'item';
  const fallbackKeyword = itemType.includes('weapon') ? 'sword' : 
                         itemType.includes('armor') ? 'armor' : 
                         itemType.includes('tool') ? 'tools' : 'medieval';
  const fallbackUrl = `https://source.unsplash.com/featured/400x300/?${fallbackKeyword}`;
  imageCache.set(cacheKey, fallbackUrl);
  return fallbackUrl;
}

async function getImageForNPC(npc: any): Promise<string> {
  const cacheKey = `npc_${npc.id || npc.name}`;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  // If NPC already has an imageUrl that's not a placeholder, use it
  if (npc.imageUrl && !npc.imageUrl.includes('unsplash.com')) {
    imageCache.set(cacheKey, npc.imageUrl);
    return npc.imageUrl;
  }
  
  // Try to fetch a real D&D image
  const fetchedImage = await fetchDnDImage(npc.name, 'creature');
  
  if (fetchedImage) {
    imageCache.set(cacheKey, fetchedImage);
    return fetchedImage;
  }
  
  // Fallback to themed placeholder
  const npcType = npc.type?.toLowerCase() || 'creature';
  const fallbackKeyword = npcType.includes('humanoid') ? 'warrior' : 
                         npcType.includes('beast') ? 'animal' : 
                         npcType.includes('dragon') ? 'dragon' : 'fantasy';
  const fallbackUrl = `https://source.unsplash.com/featured/400x300/?${fallbackKeyword}`;
  imageCache.set(cacheKey, fallbackUrl);
  return fallbackUrl;
}

// Card creation functions
async function createItemCard(item: any): Promise<string> {
  const cost = item.cost ? `${item.cost.amount} ${item.cost.currency}` : 'N/A';
  const weight = item.weight ? `${item.weight} lbs` : 'N/A';
  const imageUrl = await getImageForItem(item);
  
  return `<div class="card">

🗡️ **${item.name}**
*${item.type} (${item.rarity})*

**Description:** ${item.description}

**Properties:**
• **Cost:** ${cost}
• **Weight:** ${weight}
${item.damage ? `• **Damage:** ${item.damage}` : ''}
${item.armorClass ? `• **AC:** ${item.armorClass}` : ''}
${item.effect ? `• **Effect:** ${item.effect}` : ''}
${item.properties?.length ? `• **Properties:** ${item.properties.join(', ')}` : ''}

![${item.name}](${imageUrl})

</div>`;
}

async function createNPCCard(npc: any): Promise<string> {
  const abilities = npc.abilities;
  const abilityMods = abilities ? Object.entries(abilities).map(([key, val]: [string, any]) => 
    `${key.slice(0,3).toUpperCase()}: ${val} (${Math.floor((val - 10) / 2) >= 0 ? '+' : ''}${Math.floor((val - 10) / 2)})`
  ).join(' | ') : '';
  
  const imageUrl = await getImageForNPC(npc);

  return `<div class="card">

👤 **${npc.name}**
*${npc.size} ${npc.type}, ${npc.alignment}*

**Description:** ${npc.description}

**Combat Stats:**
• **AC:** ${npc.armorClass} | **HP:** ${npc.hitPoints} | **Speed:** ${npc.speed}
• **CR:** ${npc.challengeRating}

**Abilities:**
${abilityMods}

${npc.skills?.length ? `**Skills:** ${npc.skills.join(', ')}\n` : ''}
${npc.senses?.length ? `**Senses:** ${npc.senses.join(', ')}\n` : ''}
${npc.languages?.length ? `**Languages:** ${npc.languages.join(', ')}\n` : ''}

${npc.actions?.length ? `**Actions:**\n${npc.actions.map((action: any) => `• **${action.name}:** ${action.description}`).join('\n')}\n` : ''}

![${npc.name}](${imageUrl})

</div>`;
}

// Character resource refill functions
async function aiRefillHealth(action: AiAction) {
  try {
    const characterStore = getCharacterStore();
    const amount = action.args.amount ? parseInt(action.args.amount, 10) : null;
    
    let healingReport = '';
    
    if (amount && amount > 0) {
      // Heal specific amount
      updateCharacterWithChangeLog(
        'info',
        info => {
          const newCurrent = Math.min(info.hp.current + amount, info.hp.max);
          const actualHealing = newCurrent - info.hp.current;
          
          healingReport = `💖 **Healed ${actualHealing} HP**\n\nCurrent HP: ${newCurrent}/${info.hp.max}\n\n${actualHealing > 0 ? 'Feeling better already!' : 'Already at full health!'}`;
          
          return {
            ...info,
            hp: {
              ...info.hp,
              current: newCurrent
            }
          };
        },
        ChangeActions.HP_CHANGE,
        `Healed ${amount} HP`,
        { amount, type: 'heal' }
      );
    } else {
      // Full heal
      updateCharacterWithChangeLog(
        'info',
        info => {
          const healingNeeded = info.hp.max - info.hp.current;
          
          healingReport = `💖 **Health Fully Restored!**\n\n${healingNeeded > 0 ? `Healed ${healingNeeded} HP` : 'Already at full health'}\n\nCurrent HP: ${info.hp.max}/${info.hp.max}\n\nYou feel completely rejuvenated!`;
          
          return {
            ...info,
            hp: {
              ...info.hp,
              current: info.hp.max
            }
          };
        },
        ChangeActions.HP_CHANGE,
        'Fully restored health',
        { type: 'full_heal' }
      );
    }
    
    replicateStore.update(state => ([...state, {
      query: 'Refill Health',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: healingReport,
      hidden: false
    }]));
  } catch (error) {
    console.error('Health refill error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Refill Health',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to refill health. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiRefillSpecial(action: AiAction) {
  try {
    const characterStore = getCharacterStore();
    const resourceName = action.args.resourceName?.toLowerCase() || '';
    
    let specialReport = '';
    let hasSpecialResource = false;
    
    // Check if special resource exists first
    let currentSpecial: any;
    const unsubscribe = characterStore.special.subscribe(special => {
      currentSpecial = special;
    });
    unsubscribe();
    
    if (!currentSpecial || !currentSpecial.name) {
      specialReport = `❌ **No Special Resources Found**\n\nYour character doesn't have any special resources like grit points, chi, or sorcery points to refill.`;
      hasSpecialResource = false;
    } else {
      hasSpecialResource = true;
      
      updateCharacterWithChangeLog(
        'special',
        special => {
          const resourcesRestored = special.max - special.current;
          
          specialReport = `✨ **${special.name} Restored!**\n\n${resourcesRestored > 0 ? `Restored ${resourcesRestored} ${special.name.toLowerCase()}` : 'Already at maximum'}\n\nCurrent: ${special.max}/${special.max}\n\nRegains on: ${special.regain}\n\nYour special abilities are ready!`;
          
          return {
            ...special,
            current: special.max
          };
        },
        ChangeActions.SPECIAL_RESOURCE_CHANGE,
        `Restored ${currentSpecial.name}`,
        { resourceName: currentSpecial.name, type: 'restore' }
      );
    }
    
    if (!hasSpecialResource) {
      replicateStore.update(state => ([...state, {
        query: 'Refill Special',
        sentAt: new Date(),
        returnedAt: new Date(),
        message: specialReport,
        hidden: false
      }]));
      return;
    }
    
    replicateStore.update(state => ([...state, {
      query: 'Refill Special',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: specialReport,
      hidden: false
    }]));
  } catch (error) {
    console.error('Special resource refill error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Refill Special',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to refill special resources. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiRefillSpellSlots(action: AiAction) {
  try {
    const characterStore = getCharacterStore();
    const level = action.args.level ? parseInt(action.args.level, 10) : null;
    
    let spellSlotReport = '';
    let hasSpellSlots = false;
    
    characterStore.info.update(info => {
      if (!info.spells?.slots && !info.slots) {
        spellSlotReport = `❌ **No Spell Slots Found**\n\nYour character doesn't have spell slots to refill.`;
        return info;
      }
      
      hasSpellSlots = true;
      
      if (info.slots) {
        // Refill general slots (like spell slots, but could be other resources)
        const slotsRestored = info.slots.amount - info.slots.expended;
        
        spellSlotReport = `🔮 **${info.slots.title} Restored!**\n\n${slotsRestored > 0 ? `Restored ${slotsRestored} slots` : 'Already at maximum'}\n\nAvailable: ${info.slots.amount}/${info.slots.amount}\n\n${info.slots.description}\n\nYour magical energy is restored!`;
        
        return {
          ...info,
          slots: {
            ...info.slots,
            expended: 0
          }
        };
      } else if (info.spells?.slots) {
        // Refill spell slots by level
        const slotsInfo = Object.entries(info.spells.slots)
          .map(([lvl, slots]) => `Level ${lvl}: ${slots} slots`)
          .join('\n');
        
        spellSlotReport = `🔮 **All Spell Slots Restored!**\n\n**Available Spell Slots:**\n${slotsInfo}\n\nSpellcasting modifier: ${info.spells.modifier}\n\nYour magical energy is fully restored!`;
        
        return info; // Spell slots don't need to be updated as they're just max values
      }
      
      return info;
    });
    
    replicateStore.update(state => ([...state, {
      query: 'Refill Spell Slots',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: spellSlotReport,
      hidden: false
    }]));
  } catch (error) {
    console.error('Spell slots refill error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Refill Spell Slots',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to refill spell slots. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiShortRest(action: AiAction) {
  try {
    const characterStore = getCharacterStore();
    
    // Get current character data
    let currentInfo: any;
    let currentSpecial: any;
    
    const unsubscribeInfo = characterStore.info.subscribe(info => {
      currentInfo = info;
    });
    const unsubscribeSpecial = characterStore.special.subscribe(special => {
      currentSpecial = special;
    });
    unsubscribeInfo();
    unsubscribeSpecial();
    
    const restorations: string[] = [];
    
    // Restore special resources that recharge on short rest
    if (currentSpecial && currentSpecial.regain.toLowerCase().includes('short')) {
      const resourcesRestored = currentSpecial.max - currentSpecial.current;
      if (resourcesRestored > 0) {
        characterStore.special.update(special => ({
          ...special,
          current: special.max
        }));
        restorations.push(`• Restored ${resourcesRestored} ${currentSpecial.name}`);
      }
    }
    
    // You could use hit dice for healing during short rest
    // For now, just restore some HP as an example
    const hitDiceHealing = Math.floor(currentInfo.hp.max * 0.25); // 25% of max HP
    const newHP = Math.min(currentInfo.hp.current + hitDiceHealing, currentInfo.hp.max);
    const actualHealing = newHP - currentInfo.hp.current;
    
    if (actualHealing > 0) {
      characterStore.info.update(info => ({
        ...info,
        hp: {
          ...info.hp,
          current: newHP
        }
      }));
      restorations.push(`• Healed ${actualHealing} HP`);
    }
    
    replicateStore.update(state => ([...state, {
      query: 'Short Rest',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `😴 **Short Rest Complete!**\n\nYou take an hour to rest and recover:\n\n${restorations.length > 0 ? restorations.join('\n') : '• No resources to restore'}\n\n**Current Status:**\n• HP: ${newHP}/${currentInfo.hp.max}\n${currentSpecial ? `• ${currentSpecial.name}: ${currentSpecial.current}/${currentSpecial.max}` : ''}\n\nYou feel refreshed and ready to continue!`,
      hidden: false
    }]));
  } catch (error) {
    console.error('Short rest error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Short Rest',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to complete short rest. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiLongRest(action: AiAction) {
  try {
    const characterStore = getCharacterStore();
    
    // Get current character data
    let currentInfo: any;
    let currentSpecial: any;
    
    const unsubscribeInfo = characterStore.info.subscribe(info => {
      currentInfo = info;
    });
    const unsubscribeSpecial = characterStore.special.subscribe(special => {
      currentSpecial = special;
    });
    unsubscribeInfo();
    unsubscribeSpecial();
    
    const restorations: string[] = [];
    
    // Full health restoration
    const healingNeeded = currentInfo.hp.max - currentInfo.hp.current;
    if (healingNeeded > 0) {
      characterStore.info.update(info => ({
        ...info,
        hp: {
          ...info.hp,
          current: info.hp.max
        }
      }));
      restorations.push(`• Fully restored HP (+${healingNeeded})`);
    }
    
    // Restore all special resources
    if (currentSpecial) {
      const resourcesRestored = currentSpecial.max - currentSpecial.current;
      if (resourcesRestored > 0) {
        characterStore.special.update(special => ({
          ...special,
          current: special.max
        }));
        restorations.push(`• Restored all ${currentSpecial.name} (+${resourcesRestored})`);
      }
    }
    
    // Restore spell slots
    if (currentInfo.slots) {
      const slotsRestored = currentInfo.slots.expended;
      if (slotsRestored > 0) {
        characterStore.info.update(info => ({
          ...info,
          slots: {
            ...info.slots,
            expended: 0
          }
        }));
        restorations.push(`• Restored all ${currentInfo.slots.title} (+${slotsRestored})`);
      }
    }
    
    // All spell slots restored (if using spell system)
    if (currentInfo.spells?.slots) {
      restorations.push(`• Restored all spell slots`);
    }
    
    replicateStore.update(state => ([...state, {
      query: 'Long Rest',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `🌙 **Long Rest Complete!**\n\nYou sleep for 8 hours and fully recover:\n\n${restorations.length > 0 ? restorations.join('\n') : '• Already fully rested'}\n\n**Current Status:**\n• HP: ${currentInfo.hp.max}/${currentInfo.hp.max}\n${currentSpecial ? `• ${currentSpecial.name}: ${currentSpecial.max}/${currentSpecial.max}` : ''}\n${currentInfo.slots ? `• ${currentInfo.slots.title}: ${currentInfo.slots.amount}/${currentInfo.slots.amount}` : ''}\n\nYou wake up completely refreshed and ready for adventure!`,
      hidden: false
    }]));
  } catch (error) {
    console.error('Long rest error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Long Rest',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to complete long rest. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiLevelProgression(action: AiAction) {
  try {
    const level = action.args.level ? parseInt(action.args.level, 10) : null;
    
    if (!level || level < 1 || level > 20) {
      replicateStore.update(state => ([...state, {
        query: 'Level Progression',
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Invalid Level**\n\nPlease specify a valid level between 1 and 20.`,
        hidden: false
      }]));
      return;
    }
    
    // Get character sources from localStorage
    const sources = localStorage.getItem('character_sources');
    let structuredSources: any[] = [];
    
    if (sources) {
      try {
        const parsedSources = JSON.parse(sources);
        const enabledSources = parsedSources.filter((s: any) => s.enabled !== false);
        structuredSources = enabledSources.map((s: any) => s.extractedData).filter(Boolean);
      } catch (error) {
        console.error('Error parsing character sources:', error);
      }
    }
    
    if (structuredSources.length === 0) {
      replicateStore.update(state => ([...state, {
        query: `Level ${level} Progression`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `📚 **No Character Sources Found**\n\nTo see what you gain at level ${level}, please import character class data using the "Sources" button.\n\nSupported formats:\n• Official D&D sourcebooks (PDF)\n• Character class descriptions (text/JSON)\n• Character sheet images`,
        hidden: false
      }]));
      return;
    }
    
    // Search through sources for level-specific features
    const levelFeatures = await searchLevelFeatures(level, structuredSources);
    
    if (levelFeatures.length === 0) {
      replicateStore.update(state => ([...state, {
        query: `Level ${level} Progression`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `📊 **Level ${level} Progression**\n\nNo specific features found for level ${level} in your character sources.\n\nThis could mean:\n• You don't gain new features at this level\n• The level data isn't detailed in your sources\n• Try importing more comprehensive class data`,
        hidden: false
      }]));
      return;
    }
    
    // Create cards for each feature
    const featureCards = await Promise.all(
      levelFeatures.map(feature => createFeatureCard(feature))
    );
    
    const progressionMessage = `📊 **Level ${level} Progression**\n\nHere's what you gain at level ${level}:\n\n${featureCards.join('\n\n')}`;
    
    replicateStore.update(state => ([...state, {
      query: `Level ${level} Progression`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: progressionMessage,
      data: { type: 'level_progression', level, features: levelFeatures },
      hidden: false
    }]));
    
  } catch (error) {
    console.error('Level progression error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Level Progression',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to retrieve level progression data. Please try again.`,
      hidden: false
    }]));
  }
}

async function searchLevelFeatures(targetLevel: number, sources: any[]): Promise<any[]> {
  const features: any[] = [];
  
  for (const source of sources) {
    if (source.levels && Array.isArray(source.levels)) {
      // Find the specific level data
      const levelData = source.levels.find((l: any) => l.level === targetLevel);
      
      if (levelData) {
        // Add features from this level
        if (levelData.features && Array.isArray(levelData.features)) {
          features.push(...levelData.features.map((f: any) => ({
            ...f,
            level: targetLevel,
            source: source.className || source.name || 'Character Source',
            type: 'feature'
          })));
        }
        
        // Add additional choices as selectable features
        if (levelData.additionalChoices && Array.isArray(levelData.additionalChoices)) {
          features.push(...levelData.additionalChoices.map((choice: any) => ({
            id: `choice_${choice.type}_${targetLevel}`,
            title: choice.description || choice.title || `${choice.type} Choice`,
            description: `Choose ${choice.count || 1} from: ${(choice.from || choice.options || []).join(', ')}`,
            level: targetLevel,
            source: source.className || source.name || 'Character Source',
            type: 'choice',
            choiceType: choice.type,
            options: choice.from || choice.options || [],
            count: choice.count || 1
          })));
        }
        
        // Add spell slot progression if available
        if (levelData.spellSlots && Object.keys(levelData.spellSlots).length > 0) {
          const slotsInfo = Object.entries(levelData.spellSlots)
            .map(([level, slots]) => `Level ${level}: ${slots} slots`)
            .join(', ');
          
          features.push({
            id: `spell_slots_${targetLevel}`,
            title: 'Spell Slot Progression',
            description: `You gain spell slots: ${slotsInfo}`,
            level: targetLevel,
            source: source.className || source.name || 'Character Source',
            type: 'spell_slots',
            spellSlots: levelData.spellSlots
          });
        }
        
        // Add hit dice progression
        if (levelData.hitDie) {
          features.push({
            id: `hit_die_${targetLevel}`,
            title: 'Hit Die Progression',
            description: `You gain ${levelData.hitDie.amount} d${levelData.hitDie.die} hit ${levelData.hitDie.amount === 1 ? 'die' : 'dice'}`,
            level: targetLevel,
            source: source.className || source.name || 'Character Source',
            type: 'hit_die',
            hitDie: levelData.hitDie
          });
        }
        
        // Add proficiency bonus if it increases
        if (levelData.proficiencyBonus) {
          features.push({
            id: `proficiency_${targetLevel}`,
            title: 'Proficiency Bonus',
            description: `Your proficiency bonus increases to +${levelData.proficiencyBonus}`,
            level: targetLevel,
            source: source.className || source.name || 'Character Source',
            type: 'proficiency_bonus',
            bonus: levelData.proficiencyBonus
          });
        }
      }
    }
    
    // Look for general progression data
    if (source.progression && Array.isArray(source.progression)) {
      const levelProgression = source.progression.find((p: any) => p.level === targetLevel);
      if (levelProgression && levelProgression.features) {
        features.push(...levelProgression.features.map((f: any) => ({
          ...f,
          level: targetLevel,
          source: source.className || source.name || 'Character Source',
          type: 'feature'
        })));
      }
    }
  }
  
  // Add default ASI feature for levels 4, 8, 12, 16, 19
  if ([4, 8, 12, 16, 19].includes(targetLevel)) {
    const hasASI = features.some(f => 
      f.title?.toLowerCase().includes('ability score') || 
      f.title?.toLowerCase().includes('asi') ||
      f.choiceType === 'abilityScore'
    );
    
    if (!hasASI) {
      features.push({
        id: `asi_${targetLevel}`,
        title: 'Ability Score Improvement',
        description: 'You can increase one ability score by 2, or increase two ability scores by 1 each. Alternatively, you can choose a feat instead.',
        level: targetLevel,
        source: 'D&D 5e Core Rules',
        type: 'asi',
        options: ['Ability Score Improvement', 'Feat Selection']
      });
    }
  }
  
  return features;
}

async function createFeatureCard(feature: any): Promise<string> {
  // Get an appropriate image for the feature
  const imageUrl = await getImageForFeature(feature);
  
  const typeIcon = getFeatureTypeIcon(feature.type);
  const sourceInfo = feature.source ? `*Source: ${feature.source}*` : '';
  
  let propertiesSection = '';
  
  // Add type-specific properties
  if (feature.type === 'spell_slots' && feature.spellSlots) {
    const slotsText = Object.entries(feature.spellSlots)
      .map(([level, slots]) => `• Level ${level}: ${slots} slots`)
      .join('\n');
    propertiesSection = `**Spell Slots:**\n${slotsText}`;
  } else if (feature.type === 'choice' && feature.options) {
    const optionsText = feature.options.slice(0, 5).join(', ');
    const remainingCount = feature.options.length - 5;
    propertiesSection = `**Options:** ${optionsText}${remainingCount > 0 ? ` (+${remainingCount} more)` : ''}\n**Choose:** ${feature.count || 1}`;
  } else if (feature.type === 'asi' && feature.options) {
    propertiesSection = `**Options:** ${feature.options.join(' or ')}`;
  } else if (feature.type === 'hit_die' && feature.hitDie) {
    propertiesSection = `**Hit Die:** ${feature.hitDie.amount}d${feature.hitDie.die}`;
  } else if (feature.type === 'proficiency_bonus' && feature.bonus) {
    propertiesSection = `**New Bonus:** +${feature.bonus}`;
  }
  
  return `<div class="card">

${typeIcon} **${feature.title}**
${sourceInfo}

**Description:** ${feature.description || 'No description available.'}

${propertiesSection ? `${propertiesSection}\n` : ''}
![${feature.title}](${imageUrl})

</div>`;
}

function getFeatureTypeIcon(type: string): string {
  const icons: { [key: string]: string } = {
    feature: '⭐',
    choice: '🎯',
    spell_slots: '🔮',
    hit_die: '🎲',
    proficiency_bonus: '📈',
    asi: '💪',
    feat: '🏆'
  };
  
  return icons[type] || '📜';
}

async function getImageForFeature(feature: any): Promise<string> {
  const cacheKey = `feature_${feature.id || feature.title}`;
  
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }
  
  // Try to fetch a thematic image based on feature type and title
  let searchTerm = 'dnd fantasy';
  
  if (feature.type === 'spell_slots') {
    searchTerm = 'magic spells fantasy';
  } else if (feature.type === 'choice') {
    searchTerm = 'dnd choices abilities';
  } else if (feature.type === 'asi') {
    searchTerm = 'strength improvement fantasy';
  } else if (feature.type === 'hit_die') {
    searchTerm = 'dice gaming fantasy';
  } else if (feature.title?.toLowerCase().includes('attack')) {
    searchTerm = 'sword combat fantasy';
  } else if (feature.title?.toLowerCase().includes('spell')) {
    searchTerm = 'magic wizard fantasy';
  } else if (feature.title?.toLowerCase().includes('sneak')) {
    searchTerm = 'rogue stealth fantasy';
  } else if (feature.title?.toLowerCase().includes('rage')) {
    searchTerm = 'barbarian warrior fantasy';
  } else {
    searchTerm = 'dnd character abilities';
  }
  
  const fetchedImage = await fetchDnDImage(searchTerm, 'item');
  
  if (fetchedImage) {
    imageCache.set(cacheKey, fetchedImage);
    return fetchedImage;
  }
  
  // Fallback to themed placeholder
  const fallbackUrl = `https://source.unsplash.com/featured/400x300/?${searchTerm}`;
  imageCache.set(cacheKey, fallbackUrl);
  return fallbackUrl;
}

// Undo/Redo and Level Management Functions
async function aiLevelDown(action: AiAction) {
  try {
    const targetLevel = action.args.level ? parseInt(action.args.level, 10) : null;
    
    if (!targetLevel || targetLevel < 1 || targetLevel > 19) {
      replicateStore.update(state => ([...state, {
        query: 'Level Down',
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Invalid Level**\n\nPlease specify a valid target level between 1 and 19.`,
        hidden: false
      }]));
      return;
    }
    
    const characterStore = getCharacterStore();
    let currentLevel: number = 1;
    
    const unsubscribe = characterStore.info.subscribe(info => {
      currentLevel = info.level || 1;
    });
    unsubscribe();
    
    if (targetLevel >= currentLevel) {
      replicateStore.update(state => ([...state, {
        query: 'Level Down',
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Cannot Level Down**\n\nTarget level ${targetLevel} is not lower than current level ${currentLevel}.`,
        hidden: false
      }]));
      return;
    }
    
    // Perform level reduction with change tracking
    updateCharacterWithChangeLog(
      'info',
      info => ({
        ...info,
        level: targetLevel
      }),
      ChangeActions.LEVEL_CHANGE,
      `Reduced level from ${currentLevel} to ${targetLevel}`,
      { fromLevel: currentLevel, toLevel: targetLevel, type: 'level_down' }
    );
    
    replicateStore.update(state => ([...state, {
      query: 'Level Down',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `📉 **Level Reduced**\n\nCharacter level reduced from ${currentLevel} to ${targetLevel}.\n\nThis change has been logged and can be undone with "undo last change".`,
      hidden: false
    }]));
    
  } catch (error) {
    console.error('Level down error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Level Down',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to reduce character level. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiUndoLastChange(action: AiAction) {
  try {
    const result = undoLastChange();
    
    if (result.success) {
      replicateStore.update(state => ([...state, {
        query: 'Undo Last Change',
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `↶ **Change Undone**\n\nReverted: ${result.description}\n\nPerformed at: ${result.timestamp?.toLocaleString()}\n\nUse "redo last change" to restore this change.`,
        hidden: false
      }]));
    } else {
      replicateStore.update(state => ([...state, {
        query: 'Undo Last Change',
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Nothing to Undo**\n\n${result.error || 'No revertible changes found in the change log.'}`,
        hidden: false
      }]));
    }
  } catch (error) {
    console.error('Undo error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Undo Last Change',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to undo last change. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiRedoLastChange(action: AiAction) {
  try {
    const result = redoLastChange();
    
    if (result.success) {
      replicateStore.update(state => ([...state, {
        query: 'Redo Last Change',
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `↷ **Change Redone**\n\nRestored: ${result.description}\n\nOriginally performed: ${result.timestamp?.toLocaleString()}\n\nUse "undo last change" to revert this again.`,
        hidden: false
      }]));
    } else {
      replicateStore.update(state => ([...state, {
        query: 'Redo Last Change',
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Nothing to Redo**\n\n${result.error || 'No undone changes found to restore.'}`,
        hidden: false
      }]));
    }
  } catch (error) {
    console.error('Redo error:', error);
    replicateStore.update(state => ([...state, {
      query: 'Redo Last Change',
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to redo last change. Please try again.`,
      hidden: false
    }]));
  }
}

// Condition Management Functions
async function aiAddCondition(action: AiAction) {
  try {
    const conditionName = action.args.condition || '';
    
    if (!conditionName) {
      replicateStore.update(state => ([...state, {
        query: `Add Condition`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Error:** Please specify a condition to add.\n\nExample: "add poisoned condition"`,
        hidden: false
      }]));
      return;
    }

    const store = getCharacterStore();
    
    // Check if condition already exists
    let conditionExists = false;
    const unsubscribe = store.info.subscribe((info) => {
      conditionExists = info.conditions.some(c => c.title.toLowerCase() === conditionName.toLowerCase());
    });
    unsubscribe();
    
    if (conditionExists) {
      replicateStore.update(state => ([...state, {
        query: `Add Condition: ${conditionName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `⚠️ **Condition Already Present**\n\nYou already have the **${conditionName}** condition.\n\nUse "remove ${conditionName}" to remove it.`,
        hidden: false
      }]));
      return;
    }

    // Add condition with change tracking
    updateCharacterWithChangeLog(
      'info',
      (currentInfo) => ({
        ...currentInfo,
        conditions: [
          ...currentInfo.conditions,
          {
            title: conditionName,
            effects: [`Affected by ${conditionName} condition`]
          }
        ]
      }),
      ChangeActions.CONDITION_ADD,
      `Added condition: ${conditionName}`,
      { condition: conditionName }
    );

    // Play sound effect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('playSpellCast'));
    }

    replicateStore.update(state => ([...state, {
      query: `Add Condition: ${conditionName}`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `✨ **Condition Applied**\n\nYou are now affected by **${conditionName}**.\n\nThis condition will remain until removed. Use "remove ${conditionName}" when the effect ends.`,
      hidden: false
    }]));

  } catch (error) {
    console.error('Add condition error:', error);
    replicateStore.update(state => ([...state, {
      query: `Add Condition`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to add condition. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiRemoveCondition(action: AiAction) {
  try {
    const conditionName = action.args.condition || '';
    
    if (!conditionName) {
      replicateStore.update(state => ([...state, {
        query: `Remove Condition`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Error:** Please specify a condition to remove.\n\nExample: "remove poisoned condition"`,
        hidden: false
      }]));
      return;
    }

    const store = getCharacterStore();
    
    // Check if condition exists and find it
    let conditionExists = false;
    let conditionIndex = -1;
    const unsubscribe = store.info.subscribe((info) => {
      conditionIndex = info.conditions.findIndex(c => c.title.toLowerCase() === conditionName.toLowerCase());
      conditionExists = conditionIndex !== -1;
    });
    unsubscribe();
    
    if (!conditionExists) {
      replicateStore.update(state => ([...state, {
        query: `Remove Condition: ${conditionName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `⚠️ **Condition Not Found**\n\nYou don't have the **${conditionName}** condition.\n\nUse "list conditions" to see all active conditions.`,
        hidden: false
      }]));
      return;
    }

    // Remove condition with change tracking
    updateCharacterWithChangeLog(
      'info',
      (currentInfo) => ({
        ...currentInfo,
        conditions: currentInfo.conditions.filter((_, index) => index !== conditionIndex)
      }),
      ChangeActions.CONDITION_REMOVE,
      `Removed condition: ${conditionName}`,
      { condition: conditionName }
    );

    // Play sound effect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('playHealSpell'));
    }

    replicateStore.update(state => ([...state, {
      query: `Remove Condition: ${conditionName}`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `✅ **Condition Removed**\n\nYou are no longer affected by **${conditionName}**.\n\nThe condition has been cleared from your character sheet.`,
      hidden: false
    }]));

  } catch (error) {
    console.error('Remove condition error:', error);
    replicateStore.update(state => ([...state, {
      query: `Remove Condition`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to remove condition. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiListConditions(action: AiAction) {
  try {
    const store = getCharacterStore();
    
    let conditions: any[] = [];
    const unsubscribe = store.info.subscribe((info) => {
      conditions = info.conditions;
    });
    unsubscribe();

    if (conditions.length === 0) {
      replicateStore.update(state => ([...state, {
        query: `List Conditions`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `🟢 **No Active Conditions**\n\nYou currently have no conditions affecting your character.\n\nConditions can be added with "add [condition name]" command.`,
        hidden: false
      }]));
      return;
    }

    const conditionList = conditions.map((condition, index) => 
      `${index + 1}. **${condition.title}**${condition.effects?.length ? `\n   - ${condition.effects.join('\n   - ')}` : ''}`
    ).join('\n\n');

    replicateStore.update(state => ([...state, {
      query: `List Conditions`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `🔮 **Active Conditions**\n\n${conditionList}\n\nUse "remove [condition name]" to remove any condition.`,
      hidden: false
    }]));

  } catch (error) {
    console.error('List conditions error:', error);
    replicateStore.update(state => ([...state, {
      query: `List Conditions`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to list conditions. Please try again.`,
      hidden: false
    }]));
  }
}

// Defense Management Functions
async function aiAddDefense(action: AiAction) {
  try {
    const defenseName = action.args.defense || '';
    
    if (!defenseName) {
      replicateStore.update(state => ([...state, {
        query: `Add Defense`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Error:** Please specify a defense to add.\n\nExample: "add fire resistance"`,
        hidden: false
      }]));
      return;
    }

    const store = getCharacterStore();
    
    // Check if defense already exists
    let defenseExists = false;
    const unsubscribe = store.info.subscribe((info) => {
      defenseExists = info.defences.some(d => d.title.toLowerCase() === defenseName.toLowerCase());
    });
    unsubscribe();
    
    if (defenseExists) {
      replicateStore.update(state => ([...state, {
        query: `Add Defense: ${defenseName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `⚠️ **Defense Already Present**\n\nYou already have **${defenseName}** defense.\n\nUse "remove ${defenseName}" to remove it.`,
        hidden: false
      }]));
      return;
    }

    // Add defense with change tracking
    updateCharacterWithChangeLog(
      'info',
      (currentInfo) => ({
        ...currentInfo,
        defences: [
          ...currentInfo.defences,
          {
            title: defenseName,
            effects: [`Protected against ${defenseName}`]
          }
        ]
      }),
      ChangeActions.DEFENSE_ADD,
      `Added defense: ${defenseName}`,
      { defense: defenseName }
    );

    // Play sound effect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('playSpellCast'));
    }

    replicateStore.update(state => ([...state, {
      query: `Add Defense: ${defenseName}`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `🛡️ **Defense Granted**\n\nYou now have **${defenseName}** defense.\n\nThis defense will remain until removed. Use "remove ${defenseName}" when the effect ends.`,
      hidden: false
    }]));

  } catch (error) {
    console.error('Add defense error:', error);
    replicateStore.update(state => ([...state, {
      query: `Add Defense`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to add defense. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiRemoveDefense(action: AiAction) {
  try {
    const defenseName = action.args.defense || '';
    
    if (!defenseName) {
      replicateStore.update(state => ([...state, {
        query: `Remove Defense`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Error:** Please specify a defense to remove.\n\nExample: "remove fire resistance"`,
        hidden: false
      }]));
      return;
    }

    const store = getCharacterStore();
    
    // Check if defense exists and find it
    let defenseExists = false;
    let defenseIndex = -1;
    const unsubscribe = store.info.subscribe((info) => {
      defenseIndex = info.defences.findIndex(d => d.title.toLowerCase() === defenseName.toLowerCase());
      defenseExists = defenseIndex !== -1;
    });
    unsubscribe();
    
    if (!defenseExists) {
      replicateStore.update(state => ([...state, {
        query: `Remove Defense: ${defenseName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `⚠️ **Defense Not Found**\n\nYou don't have **${defenseName}** defense.\n\nUse "list defenses" to see all active defenses.`,
        hidden: false
      }]));
      return;
    }

    // Remove defense with change tracking
    updateCharacterWithChangeLog(
      'info',
      (currentInfo) => ({
        ...currentInfo,
        defences: currentInfo.defences.filter((_, index) => index !== defenseIndex)
      }),
      ChangeActions.DEFENSE_REMOVE,
      `Removed defense: ${defenseName}`,
      { defense: defenseName }
    );

    // Play sound effect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('playButtonClick'));
    }

    replicateStore.update(state => ([...state, {
      query: `Remove Defense: ${defenseName}`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `⚠️ **Defense Removed**\n\nYou no longer have **${defenseName}** defense.\n\nThe defense has been removed from your character sheet.`,
      hidden: false
    }]));

  } catch (error) {
    console.error('Remove defense error:', error);
    replicateStore.update(state => ([...state, {
      query: `Remove Defense`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to remove defense. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiListDefenses(action: AiAction) {
  try {
    const store = getCharacterStore();
    
    let defenses: any[] = [];
    const unsubscribe = store.info.subscribe((info) => {
      defenses = info.defences;
    });
    unsubscribe();

    if (defenses.length === 0) {
      replicateStore.update(state => ([...state, {
        query: `List Defenses`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `🟢 **No Active Defenses**\n\nYou currently have no special defenses or resistances.\n\nDefenses can be added with "add [defense name] resistance" command.`,
        hidden: false
      }]));
      return;
    }

    const defenseList = defenses.map((defense, index) => 
      `${index + 1}. **${defense.title}**${defense.effects?.length ? `\n   - ${defense.effects.join('\n   - ')}` : ''}`
    ).join('\n\n');

    replicateStore.update(state => ([...state, {
      query: `List Defenses`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `🛡️ **Active Defenses**\n\n${defenseList}\n\nUse "remove [defense name]" to remove any defense.`,
      hidden: false
    }]));

  } catch (error) {
    console.error('List defenses error:', error);
    replicateStore.update(state => ([...state, {
      query: `List Defenses`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to list defenses. Please try again.`,
      hidden: false
    }]));
  }
}

// Inventory Management Functions
async function aiShowItems(action: AiAction) {
  try {
    const store = getCharacterStore();
    
    let inventory: any[] = [];
    const unsubscribe = store.inventory.subscribe((inv) => {
      inventory = inv;
    });
    unsubscribe();

    if (inventory.length === 0) {
      replicateStore.update(state => ([...state, {
        query: `Show Items`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `📦 **Empty Inventory**\n\nYour character has no items in their inventory.\n\nItems can be added via character updates or AI commands.`,
        hidden: false
      }]));
      return;
    }

    // Group items by type for better organization
    const groupedItems: {[key: string]: any[]} = {};
    inventory.forEach(item => {
      const type = item.type || 'misc';
      if (!groupedItems[type]) {
        groupedItems[type] = [];
      }
      groupedItems[type].push(item);
    });

    // Create item cards for each category
    let itemsDisplay = '';
    const typeIcons: {[key: string]: string} = {
      weapon: '⚔️',
      armor: '🛡️',
      consumable: '🧪',
      tool: '🔨',
      treasure: '💎',
      ammunition: '🏹',
      misc: '📦'
    };

    Object.entries(groupedItems).forEach(([type, items]) => {
      const icon = typeIcons[type] || '📦';
      itemsDisplay += `\n## ${icon} ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;
      
      items.forEach(item => {
        const rarity = item.rarity || 'common';
        const rarityIcon = rarity === 'legendary' ? '🟣' : 
                          rarity === 'very rare' ? '🟡' : 
                          rarity === 'rare' ? '🔵' : 
                          rarity === 'uncommon' ? '🟢' : '⚪';
        
        const equipped = item.equipped ? ' *(equipped)*' : '';
        const quantity = item.quantity > 1 ? ` (×${item.quantity})` : '';
        const weight = item.weight ? ` • ${item.weight} lb` : '';
        const value = item.value ? ` • ${item.value.amount} ${item.value.currency}` : '';
        
        // Add damage/AC info for weapons/armor
        let mechanics = '';
        if (item.properties?.damage) {
          const dmg = item.properties.damage;
          mechanics += ` • ${dmg.amount}d${dmg.dice}${dmg.bonus ? `+${dmg.bonus}` : ''} ${dmg.type}`;
        }
        if (item.properties?.ac) {
          const ac = item.properties.ac;
          mechanics += ` • AC ${ac.base}${ac.bonus ? `+${ac.bonus}` : ''}`;
        }
        
        itemsDisplay += `### ${rarityIcon} **${item.title}**${quantity}${equipped}\n`;
        if (item.description) {
          itemsDisplay += `*${item.description}*\n`;
        }
        itemsDisplay += `${weight}${value}${mechanics}\n\n`;
      });
    });

    // Count totals
    const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const totalWeight = inventory.reduce((sum, item) => sum + ((item.weight || 0) * (item.quantity || 1)), 0);
    const equippedCount = inventory.filter(item => item.equipped).length;

    replicateStore.update(state => ([...state, {
      query: `Show Items`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `🎒 **Character Inventory**\n\n*${totalItems} items • ${totalWeight} lbs total • ${equippedCount} equipped*\n${itemsDisplay}\n---\n💡 **Tips:** \n• "show my gun" - view specific items\n• "add 20 arrows" - add items/ammo\n• "remove 5 arrows" - remove items`,
      hidden: false
    }]));

  } catch (error) {
    console.error('Show items error:', error);
    replicateStore.update(state => ([...state, {
      query: `Show Items`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to display inventory. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiShowSpecificItem(action: AiAction) {
  try {
    const itemQuery = action.args.itemQuery || '';
    
    if (!itemQuery) {
      replicateStore.update(state => ([...state, {
        query: `Show Specific Item`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Error:** Please specify what item you're looking for.\n\nExample: "show me my gun" or "describe my sword"`,
        hidden: false
      }]));
      return;
    }

    const store = getCharacterStore();
    
    let inventory: any[] = [];
    const unsubscribe = store.inventory.subscribe((inv) => {
      inventory = inv;
    });
    unsubscribe();

    if (inventory.length === 0) {
      replicateStore.update(state => ([...state, {
        query: `Show Item: ${itemQuery}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `📦 **No Items Found**\n\nYour character has no items in their inventory.\n\nItems can be added via character updates or AI commands.`,
        hidden: false
      }]));
      return;
    }

    // Use AI to find the best matching item
    const apiKey = localStorage.getItem('replicate_api_key');
    if (!apiKey) {
      // Fallback to simple text matching if no API key
      const matchedItem = findItemBySimpleMatch(inventory, itemQuery);
      if (matchedItem) {
        await showItemCard(matchedItem, itemQuery);
      } else {
        await showNoItemFound(itemQuery, inventory);
      }
      return;
    }

    // Use AI to find the best match
    const matchedItem = await findItemWithAI(inventory, itemQuery, apiKey);
    if (matchedItem) {
      await showItemCard(matchedItem, itemQuery);
    } else {
      await showNoItemFound(itemQuery, inventory);
    }

  } catch (error) {
    console.error('Show specific item error:', error);
    replicateStore.update(state => ([...state, {
      query: `Show Item`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to find the specified item. Please try again.`,
      hidden: false
    }]));
  }
}

function findItemBySimpleMatch(inventory: any[], query: string): any | null {
  const lowerQuery = query.toLowerCase();
  
  // Direct title match
  let match = inventory.find(item => 
    item.title && item.title.toLowerCase().includes(lowerQuery)
  );
  if (match) return match;
  
  // Type match
  match = inventory.find(item => 
    item.type && item.type.toLowerCase().includes(lowerQuery)
  );
  if (match) return match;
  
  // Description match
  match = inventory.find(item => 
    item.description && item.description.toLowerCase().includes(lowerQuery)
  );
  if (match) return match;
  
  // Attributes match
  match = inventory.find(item => 
    item.attributes && item.attributes.some((attr: string) => 
      attr.toLowerCase().includes(lowerQuery)
    )
  );
  
  return match || null;
}

async function findItemWithAI(inventory: any[], query: string, apiKey: string): Promise<any | null> {
  try {
    const itemsList = inventory.map((item, index) => 
      `${index}: ${item.title} (${item.type}) - ${item.description || 'No description'}`
    ).join('\n');

    const prompt = `Find the best matching item for the query "${query}" from this inventory:

${itemsList}

Return only the index number of the best match, or -1 if no good match exists.`;

    const response = await fetch("/replicate/models/meta/meta-llama-3-8b-instruct/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        stream: false,
        input: {
          prompt,
          max_tokens: 50,
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error('AI matching failed');
    }

    const result = await response.json();
    let getUrl = result?.urls?.get?.replace('https://api.replicate.com/v1', '/replicate');
    
    if (!getUrl) {
      throw new Error('Invalid AI response');
    }

    // Poll for result
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const res = await fetch(getUrl, {
        headers: { "Authorization": "Bearer " + apiKey }
      });

      if (res.ok) {
        const body = await res.json();
        const output = typeof body.output === 'string' ? body.output : body.output?.join('');
        
        if (output) {
          const index = parseInt(output.trim());
          if (index >= 0 && index < inventory.length) {
            return inventory[index];
          }
        }
      }
    }
  } catch (error) {
    console.error('AI item matching error:', error);
  }
  
  // Fallback to simple matching
  return findItemBySimpleMatch(inventory, query);
}

async function generateItemImage(item: any): Promise<string> {
  const apiKey = localStorage.getItem('replicate_api_key');
  if (!apiKey) {
    return getDefaultItemImage(item.type);
  }

  try {
    const prompt = `A detailed fantasy ${item.type} called "${item.title}". ${item.description || ''}. High quality digital art, fantasy style, isolated on white background, D&D item illustration`;

    const response = await fetch("/replicate/models/black-forest-labs/flux-1.1-pro/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + apiKey
      },
      body: JSON.stringify({
        stream: false,
        input: {
          prompt,
          width: 512,
          height: 512,
          num_outputs: 1,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          seed: Math.floor(Math.random() * 1000000)
        }
      })
    });

    if (!response.ok) {
      throw new Error('Image generation failed');
    }

    const result = await response.json();
    let getUrl = result?.urls?.get?.replace('https://api.replicate.com/v1', '/replicate');
    
    if (!getUrl) {
      throw new Error('Invalid image generation response');
    }

    // Poll for result
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const res = await fetch(getUrl, {
        headers: { "Authorization": "Bearer " + apiKey }
      });

      if (res.ok) {
        const body = await res.json();
        const output = body.output;
        
        if (output && Array.isArray(output) && output.length > 0) {
          return output[0];
        }
      }
    }
  } catch (error) {
    console.error('Image generation error:', error);
  }
  
  return getDefaultItemImage(item.type);
}

function getDefaultItemImage(type: string): string {
  const typeIcons: {[key: string]: string} = {
    weapon: '⚔️',
    armor: '🛡️',
    consumable: '🧪',
    tool: '🔨',
    treasure: '💎',
    ammunition: '🏹',
    misc: '📦'
  };
  
  return typeIcons[type] || '📦';
}

async function showItemCard(item: any, query: string) {
  const rarity = item.rarity || 'common';
  const rarityIcon = rarity === 'legendary' ? '🟣' : 
                    rarity === 'very rare' ? '🟡' : 
                    rarity === 'rare' ? '🔵' : 
                    rarity === 'uncommon' ? '🟢' : '⚪';

  const equipped = item.equipped ? ' *(equipped)*' : '';
  const quantity = item.quantity > 1 ? ` (×${item.quantity})` : '';
  const weight = item.weight ? `\n**Weight:** ${item.weight} lb` : '';
  const value = item.value ? `\n**Value:** ${item.value.amount} ${item.value.currency}` : '';
  const attributes = item.attributes?.length ? `\n**Properties:** ${item.attributes.join(', ')}` : '';
  
  // Generate or get image
  const imageUrl = await generateItemImage(item);
  const imageDisplay = imageUrl.startsWith('http') ? `![${item.title}](${imageUrl})` : imageUrl;

  let propertiesDisplay = '';
  if (item.properties) {
    if (item.properties.damage) {
      const dmg = item.properties.damage;
      propertiesDisplay += `\n**Damage:** ${dmg.amount}d${dmg.dice}${dmg.bonus ? `+${dmg.bonus}` : ''} ${dmg.type}`;
    }
    if (item.properties.ac) {
      const ac = item.properties.ac;
      propertiesDisplay += `\n**AC:** ${ac.base}${ac.bonus ? `+${ac.bonus}` : ''}`;
    }
    if (item.properties.range) {
      const range = item.properties.range;
      propertiesDisplay += `\n**Range:** ${range.normal}/${range.max} ft`;
    }
  }

  replicateStore.update(state => ([...state, {
    query: `Show Item: ${query}`,
    sentAt: new Date(),
    returnedAt: new Date(),
    message: `🎯 **Item Found**\n\n${imageDisplay}\n\n## ${rarityIcon} **${item.title}**${quantity}${equipped}\n\n*${item.description || 'No description available'}*${weight}${value}${attributes}${propertiesDisplay}\n\n---\n💡 **Ask me about other items in your inventory!**`,
    hidden: false
  }]));
}

async function showNoItemFound(query: string, inventory: any[]) {
  const suggestions = inventory.slice(0, 3).map(item => `• ${item.title}`).join('\n');
  
  replicateStore.update(state => ([...state, {
    query: `Show Item: ${query}`,
    sentAt: new Date(),
    returnedAt: new Date(),
    message: `🔍 **Item Not Found**\n\nI couldn't find "${query}" in your inventory.\n\n**Similar items you have:**\n${suggestions}\n\nTry asking "show items" to see your full inventory.`,
    hidden: false
  }]));
}

// Item Management Functions
async function aiAddItem(action: AiAction) {
  try {
    const itemName = action.args.itemName || '';
    const quantity = action.args.quantity || 1;
    
    if (!itemName) {
      replicateStore.update(state => ([...state, {
        query: `Add Item`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Error:** Please specify what item to add.\n\nExample: "add 20 arrows" or "give me a sword"`,
        hidden: false
      }]));
      return;
    }

    const store = getCharacterStore();
    
    // Check if item already exists in inventory
    let existingItemIndex = -1;
    let inventory: any[] = [];
    const unsubscribe = store.inventory.subscribe((inv) => {
      inventory = inv;
      existingItemIndex = inv.findIndex(item => 
        item.title.toLowerCase().includes(itemName.toLowerCase())
      );
    });
    unsubscribe();

    if (existingItemIndex >= 0) {
      // Add to existing item quantity
      store.inventory.update(inv => {
        inv[existingItemIndex].quantity += quantity;
        return inv;
      });
      
      replicateStore.update(state => ([...state, {
        query: `Add Item: ${itemName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `📦 **Item Added**\n\nAdded **${quantity}x ${inventory[existingItemIndex].title}** to your inventory.\n\nNew quantity: **${inventory[existingItemIndex].quantity + quantity}**`,
        hidden: false
      }]));
    } else {
      // Create new item
      const newItem = createNewItem(itemName, quantity);
      
      store.inventory.update(inv => {
        inv.push(newItem);
        return inv;
      });
      
      replicateStore.update(state => ([...state, {
        query: `Add Item: ${itemName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `✨ **New Item Created**\n\nAdded **${quantity}x ${newItem.title}** to your inventory.\n\n*${newItem.description}*\n\n💡 **Tip:** Use the inventory tab to equip items!`,
        hidden: false
      }]));
    }

    // Play sound effect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showFunnyText', {
        detail: { text: `Obtained ${itemName}!`, category: 'treasure' }
      }));
    }

  } catch (error) {
    console.error('Add item error:', error);
    replicateStore.update(state => ([...state, {
      query: `Add Item`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to add item. Please try again.`,
      hidden: false
    }]));
  }
}

async function aiRemoveItem(action: AiAction) {
  try {
    const itemName = action.args.itemName || '';
    const quantity = action.args.quantity || 1;
    
    if (!itemName) {
      replicateStore.update(state => ([...state, {
        query: `Remove Item`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `❌ **Error:** Please specify what item to remove.\n\nExample: "remove 5 arrows" or "lose my sword"`,
        hidden: false
      }]));
      return;
    }

    const store = getCharacterStore();
    
    // Find item in inventory
    let itemIndex = -1;
    let inventory: any[] = [];
    const unsubscribe = store.inventory.subscribe((inv) => {
      inventory = inv;
      itemIndex = inv.findIndex(item => 
        item.title.toLowerCase().includes(itemName.toLowerCase())
      );
    });
    unsubscribe();

    if (itemIndex === -1) {
      replicateStore.update(state => ([...state, {
        query: `Remove Item: ${itemName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `🔍 **Item Not Found**\n\nI couldn't find "${itemName}" in your inventory.\n\nTry "show items" to see what you have.`,
        hidden: false
      }]));
      return;
    }

    const item = inventory[itemIndex];
    const oldQuantity = item.quantity;
    
    if (quantity >= item.quantity) {
      // Remove item completely
      store.inventory.update(inv => {
        inv.splice(itemIndex, 1);
        return inv;
      });
      
      replicateStore.update(state => ([...state, {
        query: `Remove Item: ${itemName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `🗑️ **Item Removed**\n\nRemoved **${item.title}** completely from your inventory.\n\nQuantity removed: **${oldQuantity}**`,
        hidden: false
      }]));
    } else {
      // Reduce quantity
      store.inventory.update(inv => {
        inv[itemIndex].quantity -= quantity;
        return inv;
      });
      
      replicateStore.update(state => ([...state, {
        query: `Remove Item: ${itemName}`,
        sentAt: new Date(),
        returnedAt: new Date(),
        message: `📦 **Item Quantity Reduced**\n\nRemoved **${quantity}x ${item.title}** from your inventory.\n\nRemaining quantity: **${item.quantity - quantity}**`,
        hidden: false
      }]));
    }

    // Play sound effect
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('showFunnyText', {
        detail: { text: `Lost ${itemName}!`, category: 'warning' }
      }));
    }

  } catch (error) {
    console.error('Remove item error:', error);
    replicateStore.update(state => ([...state, {
      query: `Remove Item`,
      sentAt: new Date(),
      returnedAt: new Date(),
      message: `❌ **Error:** Unable to remove item. Please try again.`,
      hidden: false
    }]));
  }
}

function createNewItem(itemName: string, quantity: number): any {
  const lowerName = itemName.toLowerCase();
  
  // Determine item type based on name
  let itemType: string = 'misc';
  let description = `A ${itemName}.`;
  
  if (lowerName.includes('arrow') || lowerName.includes('bolt') || lowerName.includes('bullet') || 
      lowerName.includes('shot') || lowerName.includes('ammo')) {
    itemType = 'ammunition';
    description = `${itemName} for ranged weapons.`;
  } else if (lowerName.includes('sword') || lowerName.includes('bow') || lowerName.includes('gun') || 
             lowerName.includes('axe') || lowerName.includes('hammer') || lowerName.includes('dagger') ||
             lowerName.includes('staff') || lowerName.includes('wand')) {
    itemType = 'weapon';
    description = `A ${itemName} weapon.`;
  } else if (lowerName.includes('armor') || lowerName.includes('shield') || lowerName.includes('helmet') ||
             lowerName.includes('boots') || lowerName.includes('gloves')) {
    itemType = 'armor';
    description = `${itemName} for protection.`;
  } else if (lowerName.includes('potion') || lowerName.includes('elixir') || lowerName.includes('scroll')) {
    itemType = 'consumable';
    description = `A consumable ${itemName}.`;
  } else if (lowerName.includes('tool') || lowerName.includes('kit')) {
    itemType = 'tool';
    description = `A useful ${itemName}.`;
  } else if (lowerName.includes('gem') || lowerName.includes('coin') || lowerName.includes('treasure')) {
    itemType = 'treasure';
    description = `Valuable ${itemName}.`;
  }

  return {
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: itemName.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
    type: itemType,
    description,
    weight: itemType === 'ammunition' ? 0.05 : 1,
    value: { amount: 1, currency: 'gp' },
    quantity,
    equippable: true, // All items are now equippable
    equipped: false,
    rarity: 'common',
    attributes: []
  };
}

