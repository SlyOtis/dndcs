import {type Unsubscriber, type Writable, writable} from "svelte/store";
import type {RollLog, RollLogItem} from "./types";
import {rollDie, writeRollLog} from "./engine";

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

const decisionModel = "meta/meta-llama-3-70b-instruct/predictions"

async function callReplicate(input: ReplicateInput) {

  const req = await fetch("/replicate/models/" + decisionModel, {
    method: "POST",
    headers: {
      "Authorization": "Bearer REDACTED",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      stream: false,
      input
    })
  })

  if (!req.ok) {
    throw new Error(`${req.status}: ${req.statusText}`)
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
  const pullResult = (retries?: number) => new Promise((resolve, reject) => {
    clearTimeout(timeout)
    timeout = setTimeout(async () => {
      const res = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Authorization": "Bearer REDACTED",
          "Content-Type": "application/json"
        }
      })

      if (!res.ok) {
        return pullResult((retries || 1) + 1).then(resolve)
      }

      try {

        const body = await res.json()
        const output = body.output?.join('')

        console.log('Output: ', output)

        resolve(JSON.parse(output))

      } catch (e) {
        console.error(e)
        return pullResult((retries || 1) + 1).then(resolve)
      }
    }, 2000 * (retries || 1))
  })

  const res = await pullResult() as any
  return {
    ...res,
    sentAt,
    returnedAt: new Date(),
  } as ActionResponse
}

export async function detectAction(query: string) {
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
      what data is most likely required, and what functions to call among the below options (include arguments if described):
      
      Data sources: 
      1. info: All character general info
      2. feats: All character traits and feats 
      3. abilities: All character abilities
      4. savingThrows: All character saving throws
      5. skills: All character skills 
      6. senses: All character senses
      7. actions: All actions the character can take 
      8. spells: All player spells
      9. proficients: All character proficiencies
      10. inventory: All character inventory
      11. currency: All character currency, 
      12. background: All character background and lore
      13. dnd_handbook: Dungeons & dragons 5th edition sources
      14. external: External source
      
      Functions:
      1. rollDie: rolls a specific set of dies [args; die: 4 | 6 | 8 | 10 | 12 | 20 | 100, amount: number]
      2. lookupCharacterSource: Looks up details about the character [args; query: string]
      3. lookupSource: Look up a dungeons and dragons related query [args; query: string]  
      
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
     
      <|eot_id|><|start_header_id|>user<|end_header_id|>\n\n{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\n
    `,
    presence_penalty: 1.15,
    log_performance_metrics: false
  };

  const {sentAt, returnedAt, ...rest} = await callReplicate(input) as ActionResponse

  console.log(rest)

  replicateStore.update(state => ([...state, {
    query,
    sentAt,
    returnedAt,
    response: JSON.stringify(rest),
    data: rest,
    hidden: true
  }]))

  switch (rest.func) {
    case 'rollDie': {
      return await aiRollDie(rest)
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

