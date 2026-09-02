<script lang="ts">
  import { navigate } from "sly-svelte-location-router";
  import { campaignService } from "../lib/firestore.service";
  import { authService } from "../lib/auth.service";
  
  interface CampaignConcept {
    name?: string;
    description?: string;
    setting?: string;
    genre?: string;
    tone?: string;
    theme?: string;
    startLevel?: number;
    mainQuest?: {
      title?: string;
      description?: string;
    };
    locations?: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    npcs?: Array<{
      name: string;
      role: string;
      description: string;
    }>;
    hooks?: string[];
  }

  let prompt = $state("");
  let isGenerating = $state(false);
  let generatedConcept: CampaignConcept | null = $state(null);
  let error: string | null = $state(null);
  let isCreating = $state(false);

  const examplePrompts = [
    "A dark fantasy campaign where heroes investigate mysterious disappearances in a haunted forest kingdom",
    "A high-seas adventure campaign featuring pirates, sea monsters, and lost treasure islands",
    "An urban fantasy campaign set in a modern city where magic has recently returned to the world", 
    "A post-apocalyptic campaign where survivors explore the ruins of an ancient magical civilization",
    "A court intrigue campaign where noble houses compete for the throne in a medieval kingdom"
  ];

  function useExamplePrompt(example: string) {
    prompt = example;
  }

  async function generateCampaign() {
    if (!prompt.trim()) {
      error = "Please enter a campaign concept";
      return;
    }

    isGenerating = true;
    error = null;

    try {
      // Simulate AI generation for now
      // In a real implementation, this would call an AI service
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock generated campaign concept
      generatedConcept = {
        name: "The Shadow of Blackwood",
        description: "A dark fantasy campaign set in the mysterious Blackwood region, where ancient evils stir and heroes must uncover long-buried secrets.",
        setting: "Blackwood Kingdom",
        genre: "Dark Fantasy",
        tone: "Mysterious and Foreboding",
        theme: "Ancient Secrets and Redemption",
        startLevel: 1,
        mainQuest: {
          title: "The Curse of Blackwood",
          description: "Investigate the mysterious disappearances plaguing the kingdom and uncover the ancient curse that threatens to consume the land."
        },
        locations: [
          {
            name: "Ravenshollow Village",
            type: "Village",
            description: "A small village on the edge of Blackwood Forest where the disappearances began."
          },
          {
            name: "Blackwood Forest",
            type: "Wilderness",
            description: "An ancient forest filled with twisted trees and dark magic."
          },
          {
            name: "Thornwick Castle",
            type: "Castle",
            description: "The seat of power in the region, ruled by the mysterious Lord Thornwick."
          }
        ],
        npcs: [
          {
            name: "Lord Aldric Thornwick",
            role: "Ruler",
            description: "The enigmatic lord of Thornwick Castle who seems to know more than he reveals."
          },
          {
            name: "Marta the Herbalist",
            role: "Quest Giver",
            description: "An elderly herbalist in Ravenshollow who first noticed the disappearances."
          },
          {
            name: "Captain Gareth",
            role: "Ally",
            description: "Captain of the guard who seeks help investigating the mysterious events."
          }
        ],
        hooks: [
          "Strange lights have been seen in Blackwood Forest at night",
          "Ancient runes have appeared on trees throughout the region",
          "Wildlife has begun fleeing the forest in unprecedented numbers",
          "Local crops are failing despite perfect growing conditions"
        ]
      };
    } catch (err) {
      error = "Failed to generate campaign. Please try again.";
      generatedConcept = null;
    } finally {
      isGenerating = false;
    }
  }

  async function createCampaign() {
    if (!generatedConcept) return;
    
    isCreating = true;
    error = null;
    
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      // Convert CampaignConcept to Campaign format for Firebase
      const campaignData = {
        name: generatedConcept.name || "Unnamed Campaign",
        description: generatedConcept.description || "An AI-generated campaign",
        dm_id: currentUser.uid,
        player_ids: [],
        character_ids: [],
        is_active: true,
        settings: {
          allow_character_editing: true,
          share_character_sheets: true,
          private_notes: true,
          experience_mode: 'milestone' as const
        }
      };
      
      // Save campaign to Firebase
      const campaignId = await campaignService.createCampaign(campaignData);
      
      console.log("Campaign created successfully with ID:", campaignId);
      
      // Navigate to campaign view with the new campaign ID
      navigate(`/main/campaign/${campaignId}`);
    } catch (err) {
      console.error("Failed to create campaign:", err);
      error = "Failed to create campaign. Please try again.";
    } finally {
      isCreating = false;
    }
  }

  function regenerateCampaign() {
    generateCampaign();
  }

  function editPrompt() {
    generatedConcept = null;
    error = null;
  }
</script>

<div class="create-campaign">
  <div class="header">
    <h1>Create New Campaign</h1>
    <p>Describe your campaign idea and let AI help you build a complete adventure</p>
  </div>

  {#if !generatedConcept}
    <div class="input-section">
      <div class="prompt-input">
        <label for="campaign-prompt">Campaign Concept</label>
        <textarea
          id="campaign-prompt"
          bind:value={prompt}
          placeholder="Describe your campaign setting and theme... (e.g., 'A mysterious fantasy campaign about investigating disappearances in a haunted forest' or 'A space opera adventure exploring ancient alien ruins')"
          rows="4"
          disabled={isGenerating}
        ></textarea>
      </div>

      <div class="examples">
        <h3>Need inspiration? Try these examples:</h3>
        <div class="example-grid">
          {#each examplePrompts as example}
            <button 
              class="example-btn" 
              onclick={() => useExamplePrompt(example)}
              disabled={isGenerating}
            >
              {example}
            </button>
          {/each}
        </div>
      </div>

      {#if error}
        <div class="error">{error}</div>
      {/if}

      <div class="actions">
        <button 
          class="btn-primary" 
          onclick={generateCampaign}
          disabled={isGenerating || !prompt.trim()}
        >
          {#if isGenerating}
            <span class="spinner"></span>
            Generating Campaign...
          {:else}
            Generate Campaign
          {/if}
        </button>
        <button class="btn-secondary" onclick={() => navigate('/main/campaign')}>
          Cancel
        </button>
      </div>
    </div>
  {:else}
    <div class="concept-display">
      <div class="concept-header">
        <h2>Generated Campaign</h2>
        <div class="concept-actions">
          <button class="btn-secondary" onclick={editPrompt}>Edit Prompt</button>
          <button class="btn-secondary" onclick={regenerateCampaign} disabled={isGenerating}>
            {#if isGenerating}
              <span class="spinner"></span>
              Regenerating...
            {:else}
              Regenerate
            {/if}
          </button>
        </div>
      </div>

      <div class="concept-overview">
        <div class="title-section">
          <h3>{generatedConcept.name}</h3>
          <p class="description">{generatedConcept.description}</p>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Setting:</span>
            <span>{generatedConcept.setting || "Not specified"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Genre:</span>
            <span>{generatedConcept.genre || "Not specified"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tone:</span>
            <span>{generatedConcept.tone || "Not specified"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Theme:</span>
            <span>{generatedConcept.theme || "Not specified"}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Starting Level:</span>
            <span>{generatedConcept.startLevel || 1}</span>
          </div>
        </div>
      </div>

      <div class="concept-grid">
        {#if generatedConcept.mainQuest}
          <div class="concept-section">
            <h3>Main Quest</h3>
            <div class="quest-content">
              <h4>{generatedConcept.mainQuest.title}</h4>
              <p>{generatedConcept.mainQuest.description}</p>
            </div>
          </div>
        {/if}

        {#if generatedConcept.locations && generatedConcept.locations.length > 0}
          <div class="concept-section">
            <h3>Key Locations</h3>
            <div class="locations-list">
              {#each generatedConcept.locations as location}
                <div class="location-item">
                  <div class="location-header">
                    <span class="location-name">{location.name}</span>
                    <span class="location-type">({location.type})</span>
                  </div>
                  <p class="location-description">{location.description}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if generatedConcept.npcs && generatedConcept.npcs.length > 0}
          <div class="concept-section">
            <h3>Important NPCs</h3>
            <div class="npcs-list">
              {#each generatedConcept.npcs as npc}
                <div class="npc-item">
                  <div class="npc-header">
                    <span class="npc-name">{npc.name}</span>
                    <span class="npc-role">({npc.role})</span>
                  </div>
                  <p class="npc-description">{npc.description}</p>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if generatedConcept.hooks && generatedConcept.hooks.length > 0}
          <div class="concept-section">
            <h3>Adventure Hooks</h3>
            <ul class="hooks-list">
              {#each generatedConcept.hooks as hook}
                <li>{hook}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </div>

      <div class="original-prompt">
        <h4>Original Prompt:</h4>
        <p>"{prompt}"</p>
      </div>

      <div class="final-actions">
        <button class="btn-primary" onclick={createCampaign} disabled={isCreating}>
          {#if isCreating}
            <span class="spinner"></span>
            Creating Campaign...
          {:else}
            Create This Campaign
          {/if}
        </button>
        <button class="btn-secondary" onclick={editPrompt} disabled={isCreating}>
          Start Over
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .create-campaign {
    height: 100%;
    overflow-y: auto;
    padding: 2rem 2rem 3rem 2rem;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    text-align: center;
    margin-bottom: 3rem;
  }

  .header h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary-main);
    font-size: 2.5rem;
  }

  .header p {
    margin: 0;
    color: var(--color-secondary-text);
    font-size: 1.1rem;
  }

  .input-section {
    max-width: 800px;
    margin: 0 auto;
  }

  .prompt-input {
    margin-bottom: 2rem;
  }

  .prompt-input label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
    color: var(--color-primary-text);
  }

  .prompt-input textarea {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--color-primary-main);
    border-radius: 0.5rem;
    background: var(--color-content-main);
    color: var(--color-primary-text);
    font-size: 1rem;
    line-height: 1.5;
    resize: vertical;
    min-height: 120px;
  }

  .prompt-input textarea:focus {
    outline: none;
    border-color: var(--color-accent);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }

  .prompt-input textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .examples {
    margin-bottom: 2rem;
  }

  .examples h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-text);
    font-size: 1.2rem;
  }

  .example-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .example-btn {
    padding: 1rem;
    background: var(--color-content-dark);
    border: 1px solid var(--color-primary-main);
    border-radius: 0.375rem;
    color: var(--color-primary-text);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .example-btn:hover:not(:disabled) {
    background: var(--color-primary-main);
    transform: translateY(-1px);
  }

  .example-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .error {
    background: rgba(220, 53, 69, 0.1);
    border: 1px solid #dc3545;
    border-radius: 0.375rem;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #dc3545;
    text-align: center;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  .btn-primary, .btn-secondary {
    padding: 0.875rem 1.75rem;
    border: none;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .btn-primary {
    background: var(--color-primary-main);
    color: var(--color-primary-text);
  }

  .btn-primary:hover:not(:disabled) {
    background: var(--color-primary-light);
    transform: translateY(-2px);
  }

  .btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-secondary {
    background: var(--color-content-dark);
    color: var(--color-primary-text);
    border: 1px solid var(--color-primary-main);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--color-content-light);
    transform: translateY(-1px);
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .concept-display {
    max-width: 1200px;
    margin: 0 auto;
  }

  .concept-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .concept-header h2 {
    margin: 0;
    color: var(--color-primary-main);
    font-size: 2rem;
  }

  .concept-actions {
    display: flex;
    gap: 0.75rem;
  }

  .concept-overview {
    background: var(--color-content-main);
    border: 1px solid var(--color-primary-main);
    border-radius: 0.5rem;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .title-section {
    margin-bottom: 1.5rem;
  }

  .title-section h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary-main);
    font-size: 1.8rem;
  }

  .description {
    margin: 0;
    color: var(--color-primary-text);
    font-size: 1.1rem;
    line-height: 1.6;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .info-item {
    display: flex;
    gap: 0.5rem;
  }

  .info-item .info-label {
    font-weight: bold;
    color: var(--color-secondary-text);
    min-width: 100px;
  }

  .info-item span {
    color: var(--color-primary-text);
  }

  .concept-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
  }

  .concept-section {
    background: var(--color-content-main);
    border: 1px solid var(--color-primary-main);
    border-radius: 0.5rem;
    padding: 1.5rem;
  }

  .concept-section h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 1.3rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    padding-bottom: 0.5rem;
  }

  .quest-content h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary-text);
    font-size: 1.1rem;
  }

  .quest-content p {
    margin: 0;
    color: var(--color-secondary-text);
    line-height: 1.5;
  }

  .location-item, .npc-item {
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .location-item:last-child, .npc-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }

  .location-header, .npc-header {
    margin-bottom: 0.5rem;
  }

  .location-name, .npc-name {
    font-weight: bold;
    color: var(--color-primary-text);
  }

  .location-type, .npc-role {
    color: var(--color-secondary-text);
    font-style: italic;
    margin-left: 0.5rem;
  }

  .location-description, .npc-description {
    margin: 0;
    color: var(--color-secondary-text);
    line-height: 1.5;
    font-size: 0.95rem;
  }

  .hooks-list {
    margin: 0;
    padding-left: 1.5rem;
    color: var(--color-primary-text);
  }

  .hooks-list li {
    margin-bottom: 0.5rem;
    line-height: 1.5;
  }

  .original-prompt {
    background: var(--color-content-dark);
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .original-prompt h4 {
    margin: 0 0 0.5rem 0;
    color: var(--color-secondary-text);
    font-size: 1rem;
  }

  .original-prompt p {
    margin: 0;
    color: var(--color-primary-text);
    font-style: italic;
    line-height: 1.5;
  }

  .final-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    padding-top: 1rem;
  }

  @media (max-width: 768px) {
    .create-campaign {
      padding: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .concept-header {
      flex-direction: column;
      align-items: stretch;
    }

    .concept-actions {
      justify-content: center;
    }

    .actions, .final-actions {
      flex-direction: column;
    }

    .info-grid {
      grid-template-columns: 1fr;
    }

    .concept-grid {
      grid-template-columns: 1fr;
    }
  }
</style>