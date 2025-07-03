import { get } from "svelte/store";
import { userProfile } from "./stores/auth.store";
import { userService } from "./firestore.service";

export interface AIRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

const DEFAULT_MODEL = "meta/meta-llama-3-70b-instruct";

export class AIService {
  private async getApiKey(): Promise<string> {
    const profile = get(userProfile);
    console.log('AI Service: User profile:', profile ? 'exists' : 'null');
    
    if (!profile?.uid) {
      throw new Error("User not authenticated");
    }
    
    const userDetails = await userService.getUserDetails(profile.uid);
    console.log('AI Service: User details:', userDetails ? 'exists' : 'null');
    
    const apiKey = userDetails?.replicate_api_key;
    console.log('AI Service: API key:', apiKey ? 'exists' : 'missing');
    
    if (!apiKey) {
      throw new Error("Replicate API key is missing. Please add your API key in the signup process.");
    }
    
    return apiKey;
  }

  async generateText(request: AIRequest): Promise<AIResponse> {
    console.log('AI Service: generateText called');
    const apiKey = await this.getApiKey();
    const model = request.model || DEFAULT_MODEL;
    console.log('AI Service: Using model:', model);

    const input = {
      top_k: 0,
      top_p: 0.9,
      prompt: request.prompt,
      max_tokens: request.maxTokens || 2048,
      min_tokens: 0,
      temperature: request.temperature || 0.7,
      length_penalty: 1,
      stop_sequences: "<|end_of_text|>,<|eot_id|>",
      prompt_template: `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

You are a helpful D&D assistant. Provide accurate, detailed responses about D&D 5e rules, character creation, and gameplay. Always respond with valid JSON when requested.

<|eot_id|><|start_header_id|>user<|end_header_id|>

{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`,
      presence_penalty: 1.15,
      log_performance_metrics: false
    };

    const url = "/replicate/models/" + model + "/predictions";
    console.log('AI Service: Making request to:', url);
    
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
    });

    console.log('AI Service: Request status:', req.status);

    if (!req.ok) {
      const errorText = await req.text();
      console.error('AI Service: Request failed:', errorText);
      throw new Error(`Replicate API error ${req.status}: ${req.statusText} - ${errorText}`);
    }

    const resp = await req.json();
    console.log('AI Service: Initial response:', resp);
    
    let getUrl: string | undefined = resp?.urls?.get;
    getUrl = getUrl?.replace('https://api.replicate.com/v1', 'replicate');

    if (!getUrl) {
      console.error('AI Service: No getUrl in response');
      throw new Error(`Invalid response - no polling URL`);
    }

    console.log('AI Service: Polling URL:', getUrl);
    const result = await this.pollForResult(apiKey, getUrl);
    
    return {
      text: Array.isArray(result.output) ? result.output.join('') : result.output,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0
      }
    };
  }

  private async pollForResult(apiKey: string, getUrl: string): Promise<any> {
    const maxRetries = 15;
    let retries = 1;

    while (retries <= maxRetries) {
      console.log(`AI Service: Polling attempt ${retries}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 2000 * retries));

      const res = await fetch(getUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
      });

      console.log('AI Service: Poll response status:', res.status);

      if (!res.ok) {
        console.log('AI Service: Poll request failed, retrying...');
        retries++;
        continue;
      }

      const body = await res.json();
      console.log('AI Service: Poll response body:', body);
      
      if (body.status === 'succeeded') {
        const output = body.output?.join('');
        console.log('AI Service: Succeeded, output length:', output?.length || 0);
        if (output) {
          return { output };
        } else {
          throw new Error('Empty output from Replicate');
        }
      } else if (body.status === 'failed') {
        console.error('AI Service: Prediction failed:', body.error);
        throw new Error(`Replicate prediction failed: ${body.error}`);
      }
      
      console.log('AI Service: Still processing, status:', body.status);
      retries++;
    }

    throw new Error('Replicate API timeout after 15 retries');
  }

  async analyzeCharacterSources(sources: string[], characterName: string, level: number, abilityScoreMethod: string): Promise<string> {
    console.log('AI Service: Starting character source analysis');
    console.log('Sources count:', sources.length);
    console.log('Character name:', characterName);
    console.log('Level:', level);
    
    const sourcesText = sources.join('\n\n');
    
    const prompt = `Analyze these D&D character sources and determine available classes and character information.

Sources:
${sourcesText}

Requirements:
- Character name: ${characterName}
- Starting level: ${level}
- Ability score method: ${abilityScoreMethod}
- Use D&D 5e rules strictly
- Extract any additional classes mentioned in the source materials
- Include race, background information if available

Return a JSON response with the following structure:
{
  "additionalClasses": [
    {
      "name": "Class Name",
      "description": "Brief description of the class",
      "hitDie": "d8",
      "primaryAbility": "Primary ability",
      "savingThrows": "Saving throw proficiencies"
    }
  ],
  "suggestedRace": "race name from sources or null",
  "suggestedBackground": "background from sources or null",
  "notes": "Any important character creation notes from the sources"
}

If no additional classes are found in the sources, return an empty additionalClasses array. Focus on extracting NEW classes not in the standard D&D 5e Player's Handbook.`;

    console.log('AI Service: Sending prompt to generateText');
    try {
      const response = await this.generateText({ prompt });
      console.log('AI Service: Received response:', response.text.substring(0, 200) + '...');
      return response.text;
    } catch (error) {
      console.error('AI Service: generateText failed:', error);
      throw error;
    }
  }

}

export const aiService = new AIService();