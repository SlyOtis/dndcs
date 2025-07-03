<script lang="ts">
  import type { CharacterSourceData } from '../lib/character.types';
  import * as pdfjsLib from 'pdfjs-dist';
  import { userProfile } from '../lib/stores/auth.store';
  
  // Configure PDF.js worker - use local copy
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

  let { isOpen = $bindable(false) } = $props();

  let sources = $state<any[]>([]);
  let dragActive = $state(false);
  let processing = $state(false);
  let processingMessage = $state('Processing character source with AI...');
  let errorMessage = $state<string | undefined>(undefined);
  let successMessage = $state<string | undefined>(undefined);
  let showImportDialog = $state(false);

  // Load sources from localStorage when dialog opens
  $effect(() => {
    if (isOpen) {
      loadSources();
    }
  });

  function loadSources() {
    try {
      const storedSources = localStorage.getItem('character_sources');
      if (storedSources) {
        const parsedSources = JSON.parse(storedSources);
        sources = parsedSources.map((source: any) => ({
          ...source,
          enabled: source.enabled !== false // Default to enabled
        }));
      } else {
        sources = [];
      }
    } catch (error) {
      console.error('Failed to load sources:', error);
      sources = [];
    }
  }

  function saveSources() {
    try {
      localStorage.setItem('character_sources', JSON.stringify(sources));
      // Build and save extracted data as structured JSONs
      buildAndSaveStructuredData();
    } catch (error) {
      console.error('Failed to save sources:', error);
    }
  }

  function buildAndSaveStructuredData() {
    try {
      // Instead of extracting filled content, build schemas for AI processing
      const itemsSchema = buildItemsSchema();
      const characterSchema = buildCharacterSchema();
      
      // Save schemas to localStorage for AI consumption
      localStorage.setItem('dnd_items_schema', JSON.stringify(itemsSchema));
      localStorage.setItem('dnd_character_schema', JSON.stringify(characterSchema));
      
      console.log('Built AI schemas:', { itemsSchema, characterSchema });
    } catch (error) {
      console.error('Failed to build schemas:', error);
    }
  }

  function buildItemsSchema() {
    return {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "D&D Items Database Schema",
      description: "Schema for AI to extract and organize D&D items from source materials",
      type: "object",
      properties: {
        metadata: {
          type: "object",
          properties: {
            generatedAt: { type: "string", format: "date-time" },
            version: { type: "string" },
            sourceCount: { type: "integer" },
            totalItems: { type: "integer" }
          },
          required: ["generatedAt", "version", "totalItems"]
        },
        weapons: {
          type: "array",
          items: { $ref: "#/$defs/weapon" }
        },
        armor: {
          type: "array", 
          items: { $ref: "#/$defs/armor" }
        },
        equipment: {
          type: "array",
          items: { $ref: "#/$defs/item" }
        },
        magicItems: {
          type: "array",
          items: { $ref: "#/$defs/magicItem" }
        },
        consumables: {
          type: "array",
          items: { $ref: "#/$defs/consumable" }
        },
        treasures: {
          type: "array",
          items: { $ref: "#/$defs/treasure" }
        }
      },
      $defs: {
        item: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            type: { type: "string" },
            description: { type: "string" },
            weight: { type: "number" },
            cost: {
              type: "object",
              properties: {
                amount: { type: "number" },
                currency: { type: "string", enum: ["cp", "sp", "gp", "pp"] }
              }
            },
            rarity: { type: "string", enum: ["common", "uncommon", "rare", "very rare", "legendary", "artifact"] },
            source: { type: "string" }
          },
          required: ["id", "name", "type", "description"]
        },
        weapon: {
          allOf: [
            { $ref: "#/$defs/item" },
            {
              properties: {
                damage: {
                  type: "object",
                  properties: {
                    amount: { type: "integer" },
                    dice: { type: "integer" },
                    type: { type: "string" },
                    bonus: { type: "integer" }
                  }
                },
                properties: { type: "array", items: { type: "string" } },
                range: {
                  type: "object",
                  properties: {
                    normal: { type: "integer" },
                    max: { type: "integer" }
                  }
                }
              }
            }
          ]
        },
        armor: {
          allOf: [
            { $ref: "#/$defs/item" },
            {
              properties: {
                ac: {
                  type: "object",
                  properties: {
                    base: { type: "integer" },
                    bonus: { type: "integer" },
                    dexModifier: { type: "boolean" },
                    maxDexBonus: { type: "integer" }
                  }
                },
                armorType: { type: "string", enum: ["light", "medium", "heavy", "shield"] }
              }
            }
          ]
        },
        magicItem: {
          allOf: [
            { $ref: "#/$defs/item" },
            {
              properties: {
                attunement: { type: "boolean" },
                charges: { type: "integer" },
                effects: { type: "array", items: { type: "string" } }
              }
            }
          ]
        },
        consumable: {
          allOf: [
            { $ref: "#/$defs/item" },
            {
              properties: {
                uses: { type: "integer" },
                effect: { type: "string" }
              }
            }
          ]
        },
        treasure: {
          allOf: [
            { $ref: "#/$defs/item" },
            {
              properties: {
                value: { type: "number" }
              }
            }
          ]
        }
      },
      required: ["metadata", "weapons", "armor", "equipment", "magicItems", "consumables", "treasures"]
    };
  }


  function buildCharacterSchema() {
    return {
      $schema: "https://json-schema.org/draft/2020-12/schema",
      title: "D&D Character Database Schema", 
      description: "Schema for AI to extract and organize D&D character data from source materials",
      type: "object",
      properties: {
        metadata: {
          type: "object",
          properties: {
            generatedAt: { type: "string", format: "date-time" },
            version: { type: "string" },
            sourceCount: { type: "integer" },
            totalClasses: { type: "integer" },
            totalRaces: { type: "integer" },
            totalFeatures: { type: "integer" }
          },
          required: ["generatedAt", "version"]
        },
        classes: {
          type: "array",
          items: { $ref: "#/$defs/class" }
        },
        races: {
          type: "array",
          items: { $ref: "#/$defs/race" }
        },
        backgrounds: {
          type: "array", 
          items: { $ref: "#/$defs/background" }
        },
        features: {
          type: "array",
          items: { $ref: "#/$defs/feature" }
        },
        spells: {
          type: "array",
          items: { $ref: "#/$defs/spell" }
        },
        subclasses: {
          type: "array",
          items: { $ref: "#/$defs/subclass" }
        }
      },
      $defs: {
        class: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            hitDie: { type: "integer", minimum: 6, maximum: 12 },
            primaryAbility: { type: "array", items: { type: "string" } },
            savingThrowProficiencies: { type: "array", items: { type: "string" } },
            skillProficiencies: { type: "array", items: { type: "string" } },
            equipment: { type: "array", items: { type: "string" } },
            levels: {
              type: "array",
              items: { $ref: "#/$defs/classLevel" }
            },
            description: { type: "string" },
            source: { type: "string" }
          },
          required: ["id", "name", "hitDie", "levels"]
        },
        classLevel: {
          type: "object",
          properties: {
            level: { type: "integer", minimum: 1, maximum: 20 },
            proficiencyBonus: { type: "integer" },
            features: { type: "array", items: { $ref: "#/$defs/feature" } },
            hitDie: {
              type: "object",
              properties: {
                amount: { type: "integer" },
                die: { type: "integer" }
              }
            },
            abilityScoreImprovement: { type: "boolean" },
            featChoice: { type: "boolean" },
            subclassChoice: { type: "boolean" },
            additionalChoices: { type: "array", items: { $ref: "#/$defs/choice" } }
          },
          required: ["level", "proficiencyBonus", "features"]
        },
        race: {
          type: "object", 
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            abilityScoreIncrease: { type: "object" },
            size: { type: "string", enum: ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"] },
            speed: { type: "integer" },
            languages: { type: "array", items: { type: "string" } },
            traits: { type: "array", items: { $ref: "#/$defs/feature" } },
            description: { type: "string" },
            source: { type: "string" }
          },
          required: ["id", "name", "size", "speed"]
        },
        background: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            skillProficiencies: { type: "array", items: { type: "string" } },
            languages: { type: "array", items: { type: "string" } },
            equipment: { type: "array", items: { type: "string" } },
            feature: { $ref: "#/$defs/feature" },
            description: { type: "string" },
            source: { type: "string" }
          },
          required: ["id", "name"]
        },
        feature: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            level: { type: "integer", minimum: 1, maximum: 20 },
            source: { type: "string" },
            type: { type: "string", enum: ["class", "race", "background", "feat", "optional"] },
            prerequisite: { type: "string" }
          },
          required: ["id", "name", "description"]
        },
        spell: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            level: { type: "integer", minimum: 0, maximum: 9 },
            school: { type: "string", enum: ["abjuration", "conjuration", "divination", "enchantment", "evocation", "illusion", "necromancy", "transmutation"] },
            castingTime: { type: "string" },
            range: { type: "string" },
            components: { type: "array", items: { type: "string" } },
            duration: { type: "string" },
            description: { type: "string" },
            source: { type: "string" }
          },
          required: ["id", "name", "level", "school", "description"]
        },
        subclass: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            parentClass: { type: "string" },
            description: { type: "string" },
            features: { type: "array", items: { $ref: "#/$defs/feature" } },
            source: { type: "string" }
          },
          required: ["id", "name", "parentClass"]
        },
        choice: {
          type: "object",
          properties: {
            type: { type: "string" },
            title: { type: "string" },
            description: { type: "string" },
            options: { type: "array", items: { type: "string" } },
            maxSelections: { type: "integer", minimum: 1 }
          },
          required: ["type", "title", "options", "maxSelections"]
        }
      },
      required: ["metadata", "classes", "races", "backgrounds", "features", "spells", "subclasses"]
    };
  }









  function exportStructuredData() {
    try {
      // Get current schemas from localStorage
      const itemsSchemaData = localStorage.getItem('dnd_items_schema');
      const characterSchemaData = localStorage.getItem('dnd_character_schema');
      
      if (!itemsSchemaData || !characterSchemaData) {
        // Build the schemas first if they don't exist
        buildAndSaveStructuredData();
        setTimeout(() => exportStructuredData(), 100);
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      
      // Export items schema
      const itemsBlob = new Blob([itemsSchemaData], {type: 'application/json'});
      const itemsLink = document.createElement('a');
      itemsLink.href = URL.createObjectURL(itemsBlob);
      itemsLink.download = `dnd_items_schema_${timestamp}.json`;
      itemsLink.click();
      URL.revokeObjectURL(itemsLink.href);
      
      // Export character schema
      const characterBlob = new Blob([characterSchemaData], {type: 'application/json'});
      const characterLink = document.createElement('a');
      characterLink.href = URL.createObjectURL(characterBlob);
      characterLink.download = `dnd_character_schema_${timestamp}.json`;
      characterLink.click();
      URL.revokeObjectURL(characterLink.href);

      // Show success message
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('showFunnyText', {
          detail: { text: 'AI schemas exported successfully!', category: 'treasure' }
        }));
        window.dispatchEvent(new CustomEvent('playButtonClick'));
      }
      
      successMessage = 'AI schema files exported successfully!';
      setTimeout(() => successMessage = undefined, 3000);
      
    } catch (error) {
      console.error('Export failed:', error);
      errorMessage = 'Failed to export schema files.';
      setTimeout(() => errorMessage = undefined, 3000);
    }
  }

  function toggleSource(index: number) {
    sources[index].enabled = !sources[index].enabled;
    saveSources();
  }

  function removeSource(index: number) {
    sources.splice(index, 1);
    saveSources();
  }

  function getFileIcon(type: string): string {
    switch (type) {
      case 'pdf': return '📄';
      case 'image': return '🖼️';
      case 'json': return '📊';
      case 'text': return '📝';
      default: return '📄';
    }
  }

  function getFileName(source: any): string {
    return source.fileName || source.extractedData?.className || 'Unknown Source';
  }

  function getSourceDescription(source: any): string {
    const className = source.extractedData?.className;
    const processedAt = new Date(source.processedAt).toLocaleDateString();
    
    if (className) {
      return `${className} - imported ${processedAt}`;
    }
    return `Imported ${processedAt}`;
  }

  function closeDialog() {
    isOpen = false;
    showImportDialog = false;
    errorMessage = undefined;
    successMessage = undefined;
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeDialog();
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeDialog();
    }
  }

  function openImportDialog() {
    showImportDialog = true;
    errorMessage = undefined;
    successMessage = undefined;
  }

  function closeImportDialog() {
    showImportDialog = false;
    errorMessage = undefined;
    successMessage = undefined;
  }
  
  function handleImportBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeImportDialog();
    }
  }

  function handleImportKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeImportDialog();
    }
  }

  // Import dialog functions
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    dragActive = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    dragActive = false;
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }

  function handleFileInput(e: Event) {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  }

  async function handleFileUpload(file: File) {
    processing = true;
    errorMessage = undefined;
    successMessage = undefined;

    try {
      // Validate file size early
      const fileType = getFileType(file);
      if (fileType === 'pdf' && file.size > 10 * 1024 * 1024) {
        throw new Error('PDF file too large. Please use files smaller than 10MB.');
      }
      if (fileType === 'image' && file.size > 5 * 1024 * 1024) {
        throw new Error('Image file too large. Please use files smaller than 5MB.');
      }

      const sourceData: CharacterSourceData = {
        type: fileType,
        content: file
      };

      // Update processing message based on file type
      if (fileType === 'pdf') {
        processingMessage = `Extracting text from PDF with Claude AI... (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
      } else if (fileType === 'image') {
        processingMessage = `Analyzing image content with Claude AI... (${(file.size / 1024 / 1024).toFixed(1)}MB)`;
      } else {
        processingMessage = 'Processing character source with AI...';
      }

      const extractedData = await processCharacterSource(sourceData);
      
      if (extractedData) {
        // Store the extracted data for level-up system
        storeCharacterSource(sourceData, extractedData);
        
        successMessage = `Character source processed successfully! Extracted ${extractedData.className || 'Unknown Class'} level progression data.`;
        console.log('Extracted progression data:', extractedData);
        
        // Reload sources to show the new one
        loadSources();
      }
    } catch (error: any) {
      errorMessage = `Failed to process character source: ${error.message}`;
      console.error('Processing error:', error);
    } finally {
      processing = false;
    }
  }

  function getFileType(file: File): 'json' | 'text' | 'pdf' | 'image' {
    if (file.type.includes('json')) return 'json';
    if (file.type.includes('pdf')) return 'pdf';
    if (file.type.includes('image')) return 'image';
    return 'text';
  }

  function storeCharacterSource(sourceData: CharacterSourceData, extractedData: any) {
    try {
      // Get existing sources from localStorage
      const existingSources = localStorage.getItem('character_sources');
      let sources = [];
      
      if (existingSources) {
        sources = JSON.parse(existingSources);
      }
      
      // Create new source entry
      const newSource = {
        type: sourceData.type,
        fileName: sourceData.content instanceof File ? sourceData.content.name : 'unknown',
        extractedData: extractedData,
        processedAt: new Date().toISOString(),
        content: sourceData.content instanceof File ? '' : sourceData.content, // Don't store file content
        enabled: true // Default to enabled
      };
      
      // Add to sources array (limit to last 10 sources)
      sources.push(newSource);
      if (sources.length > 10) {
        sources = sources.slice(-10);
      }
      
      // Save back to localStorage
      localStorage.setItem('character_sources', JSON.stringify(sources));
      
      console.log('Character source stored successfully:', newSource);
    } catch (error) {
      console.error('Failed to store character source:', error);
    }
  }

  async function processCharacterSource(sourceData: CharacterSourceData) {
    let content: string;
    
    if (sourceData.content instanceof File) {
      if (sourceData.type === 'json') {
        // Handle JSON files locally
        content = await sourceData.content.text();
        try {
          const parsedJson = JSON.parse(content);
          return validateAndNormalizeSchema(parsedJson);
        } catch (error) {
          throw new Error('Invalid JSON format in uploaded file');
        }
      } else if (sourceData.type === 'text') {
        // Handle text files locally with basic parsing
        content = await sourceData.content.text();
        return parseTextToClassData(content, sourceData.content.name);
      } else if (sourceData.type === 'pdf') {
        // Process PDF directly in browser
        content = await extractTextFromPDF(sourceData.content);
        return await processWithReplicate(content, sourceData.content.name, 'pdf');
      } else if (sourceData.type === 'image') {
        // Process image by converting to base64 and sending to Replicate
        const base64 = await fileToBase64(sourceData.content);
        return await processWithReplicate(base64, sourceData.content.name, 'image');
      } else {
        content = await sourceData.content.text();
        return parseTextToClassData(content, 'Unknown');
      }
    } else {
      content = sourceData.content;
      return parseTextToClassData(content, 'Text Input');
    }
  }

  function validateAndNormalizeSchema(data: any) {
    // Validate that the JSON has the required structure
    if (!data.className || typeof data.className !== 'string') {
      throw new Error('JSON must include a "className" field');
    }
    
    if (!data.levels || !Array.isArray(data.levels)) {
      throw new Error('JSON must include a "levels" array');
    }

    // Normalize the schema to match our expected format
    const normalized = {
      className: data.className,
      hitDie: data.hitDie || 8,
      primaryAbility: data.primaryAbility || [],
      savingThrowProficiencies: data.savingThrowProficiencies || [],
      levels: data.levels.map((level: any) => ({
        level: level.level,
        proficiencyBonus: level.proficiencyBonus || Math.ceil(level.level / 4) + 1,
        features: level.features || [],
        hitDie: level.hitDie || { amount: level.level, die: data.hitDie || 8 },
        abilityScoreImprovement: level.abilityScoreImprovement || level.level % 4 === 0,
        featChoice: level.featChoice || level.level % 4 === 0,
        subclassChoice: level.subclassChoice || level.level === 3,
        additionalChoices: level.additionalChoices || level.choices || []
      }))
    };

    return normalized;
  }

  function parseTextToClassData(content: string, fileName: string) {
    // Extract class name from filename or content
    const className = fileName.replace(/\.(txt|json)$/i, '').replace(/[-_]/g, ' ').trim() || 'Custom Class';
    
    // Basic text parsing - look for level-based content
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const levels: any[] = [];
    
    // Try to find level information
    let currentLevel = 1;
    let currentFeatures: any[] = [];
    
    for (const line of lines) {
      // Look for level indicators
      const levelMatch = line.match(/(?:level|lvl)\s*(\d+)/i);
      if (levelMatch) {
        // Save previous level if we have features
        if (currentFeatures.length > 0 && currentLevel <= 20) {
          levels.push({
            level: currentLevel,
            proficiencyBonus: Math.ceil(currentLevel / 4) + 1,
            features: currentFeatures.map((feature, index) => ({
              id: `text_feature_${currentLevel}_${index}`,
              level: currentLevel,
              source: "class",
              title: feature.split('.')[0].trim(),
              description: feature
            })),
            hitDie: { amount: currentLevel, die: 8 },
            abilityScoreImprovement: currentLevel % 4 === 0,
            featChoice: currentLevel % 4 === 0
          });
        }
        
        currentLevel = parseInt(levelMatch[1]);
        currentFeatures = [];
      } else if (line.length > 10) {
        // Collect potential features
        currentFeatures.push(line);
      }
    }
    
    // Add the last level
    if (currentFeatures.length > 0 && currentLevel <= 20) {
      levels.push({
        level: currentLevel,
        proficiencyBonus: Math.ceil(currentLevel / 4) + 1,
        features: currentFeatures.map((feature, index) => ({
          id: `text_feature_${currentLevel}_${index}`,
          level: currentLevel,
          source: "class",
          title: feature.split('.')[0].trim(),
          description: feature
        })),
        hitDie: { amount: currentLevel, die: 8 },
        abilityScoreImprovement: currentLevel % 4 === 0,
        featChoice: currentLevel % 4 === 0
      });
    }
    
    // If we couldn't parse any levels, create a basic structure
    if (levels.length === 0) {
      levels.push({
        level: 1,
        proficiencyBonus: 2,
        features: [{
          id: 'imported_text',
          level: 1,
          source: "class",
          title: 'Imported Text Content',
          description: content.substring(0, 500) + (content.length > 500 ? '...' : '')
        }],
        hitDie: { amount: 1, die: 8 },
        abilityScoreImprovement: false,
        featChoice: false
      });
    }

    return {
      className,
      hitDie: 8,
      levels
    };
  }

  async function extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error) {
      console.error('PDF extraction error:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }
  
  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  
  async function processWithReplicate(content: string, fileName: string, type: 'pdf' | 'image'): Promise<any> {
    const apiKey = $userProfile?.replicateApiKey;
    if (!apiKey) {
      throw new Error('Replicate API key is required. Please set your API key in the login page.');
    }

    try {
      let input;
      
      if (type === 'image') {
        // For images, use Claude 4 Sonnet with vision capabilities
        input = {
          prompt: "Analyze this D&D character sheet or sourcebook page and extract character class progression data including level features, abilities, and any level-up choices. Return structured JSON with className, hitDie, and levels array with level-by-level features and choices.",
          image: content,
          max_tokens: 4000,
          temperature: 0.3,
          top_p: 0.9
        };
      } else {
        // For text/PDF content, also use Claude 4 Sonnet
        input = {
          prompt: `Parse this D&D character class text and extract level progression data. Return structured JSON with className, hitDie, and levels array with level-by-level features and choices.

Text content:
${content}`,
          max_tokens: 4000,
          temperature: 0.3,
          top_p: 0.9
        };
      }

      const req = await fetch("/replicate/models/anthropic/claude-4-sonnet/predictions", {
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

      if (!req.ok) {
        throw new Error(`Replicate API error: ${req.status} ${req.statusText}`);
      }

      const resp = await req.json();
      let getUrl: string | undefined = resp?.urls?.get;
      getUrl = getUrl?.replace('https://api.replicate.com/v1', '/replicate');

      if (!getUrl) {
        throw new Error('Invalid response from Replicate API');
      }

      // Poll for result
      let attempts = 0;
      while (attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const res = await fetch(getUrl, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + apiKey
          },
        });

        if (res.ok) {
          const body = await res.json();
          // Claude 4 Sonnet returns output as a string, not an array
          const output = typeof body.output === 'string' ? body.output : body.output?.join('');
          
          if (output) {
            // Try to parse JSON from the response
            const jsonMatch = output.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                const parsedData = JSON.parse(jsonMatch[0]);
                return validateAndNormalizeSchema(parsedData);
              } catch (parseError) {
                console.warn('Failed to parse Claude 4 Sonnet JSON response, falling back to text parsing');
              }
            }
            
            // Fallback to text parsing
            return parseTextToClassData(output, fileName);
          }
        }
        
        attempts++;
      }
      
      throw new Error('Processing timeout - please try again');
      
    } catch (error) {
      console.error('Replicate processing error:', error);
      throw error;
    }
  }
</script>

{#if isOpen && !showImportDialog}
  <div class="backdrop" onclick={handleBackdropClick} onkeydown={handleKeydown} role="dialog" aria-modal="true" tabindex="-1">
    <div class="dialog" onclick={e => e.stopPropagation()}>
      <div class="header">
        <h2>Character Sources</h2>
        <button class="close-btn" onclick={closeDialog} aria-label="Close dialog">×</button>
      </div>
      
      <div class="content">
        <div class="sources-header">
          <p class="description">Manage character progression sources for level-up capabilities</p>
          <div class="header-actions">
            <button class="import-btn" onclick={openImportDialog}>
              <span class="btn-icon">📁</span>
              Import New Source
            </button>
            <button class="rebuild-btn" onclick={buildAndSaveStructuredData}>
              <span class="btn-icon">🔄</span>
              Rebuild Database
            </button>
            <button class="export-btn" onclick={exportStructuredData}>
              <span class="btn-icon">📤</span>
              Export Database
            </button>
          </div>
        </div>

        {#if sources.length === 0}
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>No Sources Imported</h3>
            <p>Import D&D sourcebooks, class descriptions, or character sheets to unlock level-up capabilities.</p>
            <button class="import-empty-btn" onclick={openImportDialog}>Import Your First Source</button>
          </div>
        {:else}
          <div class="sources-list">
            {#each sources as source, index}
              <div class="source-item" class:disabled={!source.enabled}>
                <div class="source-main">
                  <div class="source-checkbox">
                    <input 
                      type="checkbox" 
                      checked={source.enabled} 
                      onchange={() => toggleSource(index)}
                      id="source-{index}"
                    />
                    <label for="source-{index}"></label>
                  </div>
                  
                  <div class="source-icon">
                    {getFileIcon(source.type)}
                  </div>
                  
                  <div class="source-info">
                    <h4 class="source-name">{getFileName(source)}</h4>
                    <p class="source-description">{getSourceDescription(source)}</p>
                    {#if source.extractedData?.levels}
                      <span class="source-levels">
                        {source.extractedData.levels.length} levels available
                      </span>
                    {/if}
                  </div>
                </div>
                
                <div class="source-actions">
                  <button 
                    class="remove-btn" 
                    onclick={() => removeSource(index)}
                    title="Remove source"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}

        <div class="footer-info">
          <small>
            <strong>Enabled sources:</strong> {sources.filter(s => s.enabled).length} / {sources.length}
            • Only enabled sources are used for level-up calculations
          </small>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Import Dialog -->
{#if showImportDialog}
  <div class="backdrop" onclick={handleImportBackdropClick} onkeydown={handleImportKeydown} role="dialog" aria-modal="true" tabindex="-1">
    <div class="dialog import-dialog" onclick={e => e.stopPropagation()}>
      <div class="header">
        <h2>Import Character Source</h2>
        <button class="close-btn" onclick={closeImportDialog} aria-label="Close dialog">×</button>
      </div>
      
      <div class="content">
        <p class="description">Upload character class descriptions, PDFs, or images to extract level progression data</p>
        
        {#if processing}
          <div class="processing">
            <div class="spinner"></div>
            <p>{processingMessage}</p>
          </div>
        {:else}
          <div 
            class="drop-zone" 
            class:active={dragActive}
            ondragover={handleDragOver}
            ondragleave={handleDragLeave}
            ondrop={handleDrop}
            role="button"
            tabindex="0"
          >
            <div class="drop-content">
              <span class="upload-icon">📄</span>
              <h3>Drop files here or click to browse</h3>
              <p>Supports JSON, TXT, PDF, and images</p>
              <input 
                type="file" 
                class="file-input" 
                accept=".json,.txt,.pdf,.png,.jpg,.jpeg"
                onchange={handleFileInput}
              />
            </div>
          </div>
        {/if}

        {#if errorMessage}
          <div class="message error">
            <span class="icon">❌</span>
            <p>{errorMessage}</p>
          </div>
        {/if}

        {#if successMessage}
          <div class="message success">
            <span class="icon">✅</span>
            <p>{successMessage}</p>
            <button class="close-success-btn" onclick={closeImportDialog}>Done</button>
          </div>
        {/if}

        <div class="supported-formats">
          <h4>Supported Formats:</h4>
          <ul>
            <li><strong>JSON:</strong> ✅ Structured character class data (recommended)</li>
            <li><strong>Text:</strong> ✅ Plain text class descriptions with level info</li>
            <li><strong>PDF:</strong> ✅ Extract text and process with Claude 4 Sonnet</li>
            <li><strong>Images:</strong> ✅ Analyze character sheets with Claude 4 Sonnet</li>
          </ul>
          <div class="format-note">
            <h5>📋 JSON Schema Example:</h5>
            <small>Your JSON should include: <code>className</code>, <code>hitDie</code>, and <code>levels[]</code> array with level progression data.</small>
          </div>
          <div class="file-size-note">
            <small>💡 <strong>Tip:</strong> For best results, use the JSON format with structured level progression data.</small>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(5px);
    padding: 1rem;
    box-sizing: border-box;
  }

  .dialog {
    background: linear-gradient(145deg, rgba(30, 30, 50, 0.95), rgba(20, 20, 35, 0.98));
    border: 2px solid var(--color-primary-main);
    border-radius: 20px;
    max-width: 800px;
    max-height: calc(100vh - 2rem);
    width: 100%;
    display: flex;
    flex-direction: column;
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  .import-dialog {
    max-width: 600px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
    border-bottom: 1px solid rgba(255, 215, 0, 0.3);
    background: linear-gradient(90deg, rgba(255, 215, 0, 0.1), transparent);
  }

  .header h2 {
    margin: 0;
    color: var(--color-primary-main);
    font-size: 1.8rem;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-primary-main);
    font-size: 2rem;
    cursor: pointer;
    padding: 0;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: rgba(255, 215, 0, 0.2);
    transform: scale(1.1);
  }

  .content {
    padding: 2rem;
    overflow-y: auto;
    flex: 1;
    min-height: 0;
  }

  .sources-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
  }

  .description {
    margin: 0;
    color: #b8b5b2;
    flex: 1;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }

  .import-btn, .rebuild-btn, .export-btn {
    border: none;
    padding: 0.75rem 1.25rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s ease;
    white-space: nowrap;
    font-size: 0.9rem;
    color: white;
  }

  .import-btn {
    background: linear-gradient(45deg, #ff6b35, #f7931e);
  }

  .import-btn:hover {
    background: linear-gradient(45deg, #ff7b45, #f8a32e);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
  }

  .rebuild-btn {
    background: linear-gradient(45deg, #4CAF50, #45a049);
  }

  .rebuild-btn:hover {
    background: linear-gradient(45deg, #5CBF60, #4CAF50);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.4);
  }

  .export-btn {
    background: linear-gradient(45deg, #2196F3, #1976D2);
  }

  .export-btn:hover {
    background: linear-gradient(45deg, #42A5F5, #2196F3);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(33, 150, 243, 0.4);
  }

  .btn-icon {
    font-size: 1.1rem;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 2rem;
    color: #b8b5b2;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.7;
  }

  .empty-state h3 {
    margin: 0 0 1rem 0;
    color: var(--color-primary-main);
    font-size: 1.5rem;
  }

  .empty-state p {
    margin: 0 0 2rem 0;
    font-size: 1.1rem;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  .import-empty-btn {
    background: linear-gradient(45deg, #ff6b35, #f7931e);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .import-empty-btn:hover {
    background: linear-gradient(45deg, #ff7b45, #f8a32e);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
  }

  .sources-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .source-item {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;
  }

  .source-item:hover {
    background: rgba(0, 0, 0, 0.4);
    border-color: rgba(255, 215, 0, 0.3);
  }

  .source-item.disabled {
    opacity: 0.5;
  }

  .source-main {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }

  .source-checkbox {
    position: relative;
  }

  .source-checkbox input[type="checkbox"] {
    appearance: none;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 215, 0, 0.5);
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
  }

  .source-checkbox input[type="checkbox"]:checked {
    background: var(--color-primary-main);
    border-color: var(--color-primary-main);
  }

  .source-checkbox input[type="checkbox"]:checked::after {
    content: '✓';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: black;
    font-weight: bold;
    font-size: 14px;
  }

  .source-checkbox label {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
  }

  .source-icon {
    font-size: 2rem;
    opacity: 0.8;
  }

  .source-info {
    flex: 1;
  }

  .source-name {
    margin: 0 0 0.25rem 0;
    color: var(--color-primary-text);
    font-size: 1.1rem;
    font-weight: 600;
  }

  .source-description {
    margin: 0 0 0.5rem 0;
    color: #b8b5b2;
    font-size: 0.9rem;
  }

  .source-levels {
    background: rgba(255, 215, 0, 0.2);
    color: var(--color-primary-main);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .source-actions {
    display: flex;
    gap: 0.5rem;
  }

  .remove-btn {
    background: none;
    border: none;
    color: #ff6b6b;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .remove-btn:hover {
    background: rgba(255, 107, 107, 0.2);
    transform: scale(1.1);
  }

  .footer-info {
    margin-top: 2rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    color: #b8b5b2;
  }

  /* Import dialog styles */
  .processing {
    text-align: center;
    padding: 3rem 2rem;
  }

  .spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 215, 0, 0.3);
    border-top: 4px solid var(--color-primary-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .processing p {
    color: var(--color-primary-main);
    font-weight: 600;
  }

  .drop-zone {
    border: 2px dashed rgba(255, 215, 0, 0.5);
    border-radius: 12px;
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    background: rgba(0, 0, 0, 0.2);
  }

  .drop-zone:hover,
  .drop-zone.active {
    border-color: var(--color-primary-main);
    background: rgba(255, 215, 0, 0.05);
    transform: scale(1.02);
  }

  .drop-content {
    pointer-events: none;
  }

  .upload-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
    display: block;
    opacity: 0.8;
  }

  .drop-zone h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-primary-text);
    font-size: 1.3rem;
  }

  .drop-zone p {
    margin: 0;
    color: #b8b5b2;
  }

  .file-input {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    pointer-events: all;
  }

  .message {
    margin: 1.5rem 0;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .message.error {
    background: rgba(255, 107, 107, 0.1);
    border: 1px solid rgba(255, 107, 107, 0.3);
  }

  .message.success {
    background: rgba(76, 175, 80, 0.1);
    border: 1px solid rgba(76, 175, 80, 0.3);
    flex-direction: column;
    align-items: flex-start;
  }

  .message .icon {
    font-size: 1.5rem;
  }

  .message p {
    margin: 0;
    flex: 1;
  }

  .close-success-btn {
    background: rgba(76, 175, 80, 0.2);
    color: #4caf50;
    border: 1px solid rgba(76, 175, 80, 0.5);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    margin-top: 0.5rem;
    transition: all 0.2s ease;
  }

  .close-success-btn:hover {
    background: rgba(76, 175, 80, 0.3);
  }

  .supported-formats {
    margin-top: 2rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .supported-formats h4 {
    margin: 0 0 0.75rem 0;
    color: var(--color-primary-main);
    font-size: 1rem;
  }

  .supported-formats ul {
    margin: 0;
    padding-left: 1.5rem;
    color: #b8b5b2;
  }

  .supported-formats li {
    margin-bottom: 0.5rem;
  }

  .file-size-note {
    margin-top: 1rem;
    padding: 0.75rem;
    background: rgba(255, 193, 7, 0.1);
    border: 1px solid rgba(255, 193, 7, 0.3);
    border-radius: 6px;
    text-align: center;
  }

  .file-size-note small {
    color: #ffc107;
    font-weight: 500;
  }

  .format-note {
    margin: 1rem 0;
    padding: 0.75rem;
    background: rgba(0, 150, 255, 0.1);
    border: 1px solid rgba(0, 150, 255, 0.3);
    border-radius: 6px;
  }

  .format-note h5 {
    margin: 0 0 0.5rem 0;
    color: #00aaff;
    font-size: 0.9rem;
  }

  .format-note small {
    color: #b8b5b2;
  }

  .format-note code {
    background: rgba(255, 255, 255, 0.1);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    color: var(--color-primary-main);
    font-family: 'Courier New', monospace;
  }

  @media (max-width: 640px) {
    .backdrop {
      padding: 0.5rem;
    }

    .dialog {
      max-height: calc(100vh - 1rem);
    }

    .content {
      padding: 1rem;
    }

    .sources-header {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }

    .source-main {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .source-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }

    .source-actions {
      align-self: flex-end;
    }
  }
</style>