import { writable } from 'svelte/store';
import type { CharacterSourceData } from '../character.types';

export interface SourceImportState {
  isOpen: boolean;
  importedData?: CharacterSourceData;
  isProcessing: boolean;
  error?: string;
}

export function createSourceImportStore() {
  const state = writable<SourceImportState>({ 
    isOpen: false, 
    isProcessing: false 
  });

  return {
    ...state,
    
    open(data?: CharacterSourceData) {
      state.update(s => ({ ...s, isOpen: true, importedData: data, error: undefined }));
    },

    close() {
      state.update(s => ({ ...s, isOpen: false, importedData: undefined, error: undefined }));
    },

    setProcessing(processing: boolean) {
      state.update(s => ({ ...s, isProcessing: processing }));
    },

    setError(error: string) {
      state.update(s => ({ ...s, error, isProcessing: false }));
    }
  };
}

export const sourceImportLogic = {
  async handleFileUpload(file: File): Promise<CharacterSourceData> {
    const fileType = file.type;
    
    if (fileType === 'application/json') {
      const text = await file.text();
      return {
        type: 'json',
        content: text,
        extractedData: JSON.parse(text)
      };
    } else if (fileType === 'text/plain') {
      const text = await file.text();
      return {
        type: 'text',
        content: text
      };
    } else if (fileType === 'application/pdf') {
      return {
        type: 'pdf',
        content: file
      };
    } else if (fileType.startsWith('image/')) {
      return {
        type: 'image',
        content: file
      };
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  },

  async extractTextFromPDF(file: File): Promise<string> {
    // PDF extraction logic would go here
    // For now, return placeholder
    return "PDF text extraction not implemented yet";
  },

  async extractTextFromImage(file: File): Promise<string> {
    // OCR logic would go here
    // For now, return placeholder
    return "Image text extraction not implemented yet";
  },

  validateCharacterData(data: any): boolean {
    // Validate that the imported data has the expected structure
    if (!data || typeof data !== 'object') return false;
    
    // Check for common character data fields
    const hasCharacterInfo = data.character || data.info || data.name;
    const hasClassData = data.classes || data.class;
    const hasFeatureData = data.features || data.feats;
    
    return !!(hasCharacterInfo || hasClassData || hasFeatureData);
  },

  saveCharacterSources(sources: any[]) {
    localStorage.setItem('character_sources', JSON.stringify(sources));
  },

  getCharacterSources(): any[] {
    const sources = localStorage.getItem('character_sources');
    if (sources) {
      try {
        return JSON.parse(sources);
      } catch (error) {
        console.error('Error parsing character sources:', error);
      }
    }
    return [];
  },

  addCharacterSource(source: any) {
    const sources = this.getCharacterSources();
    sources.push({
      ...source,
      id: Date.now().toString(),
      imported: new Date().toISOString(),
      enabled: true
    });
    this.saveCharacterSources(sources);
  }
};