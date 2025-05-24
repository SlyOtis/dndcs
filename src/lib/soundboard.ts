import type { SoundClip, SoundBoard } from './character.types';


// Sound Board Functions
export async function createSoundClip(name: string, audioFile: File): Promise<SoundClip> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const audioData = reader.result as string;
      const clip: SoundClip = {
        id: `clip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: name || audioFile.name.replace(/\.[^/.]+$/, ""),
        audioData,
        volume: 1.0,
        created_at: new Date().toISOString()
      };
      
      // Try to get duration from audio file
      const audio = new Audio(audioData);
      audio.addEventListener('loadedmetadata', () => {
        clip.duration = audio.duration;
        resolve(clip);
      });
      audio.addEventListener('error', () => {
        // If we can't load metadata, just resolve without duration
        resolve(clip);
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioFile);
  });
}

export function playSoundClip(clip: SoundClip): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(clip.audioData);
    audio.volume = clip.volume;
    
    audio.addEventListener('ended', () => resolve());
    audio.addEventListener('error', () => reject(new Error('Failed to play sound')));
    
    audio.play().catch(reject);
  });
}

export function createDefaultSoundBoard(): SoundBoard {
  return {
    id: `soundboard_${Date.now()}`,
    name: 'My Sound Board',
    clips: []
  };
}

export function addClipToSoundBoard(soundBoard: SoundBoard, clip: SoundClip): SoundBoard {
  return {
    ...soundBoard,
    clips: [...soundBoard.clips, clip]
  };
}

export function removeClipFromSoundBoard(soundBoard: SoundBoard, clipId: string): SoundBoard {
  return {
    ...soundBoard,
    clips: soundBoard.clips.filter(clip => clip.id !== clipId)
  };
}

export function updateClipInSoundBoard(soundBoard: SoundBoard, clipId: string, updates: Partial<SoundClip>): SoundBoard {
  return {
    ...soundBoard,
    clips: soundBoard.clips.map(clip => 
      clip.id === clipId ? { ...clip, ...updates } : clip
    )
  };
}