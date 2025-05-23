# Sound System Documentation

## Overview
The D&D Character Sheet now includes an immersive sound system with funny text displays that respond to various game actions.

## Components Added

### SoundManager.svelte
- Global sound management system
- Handles all sound events through window event listeners
- Sound toggle now integrated in top bar (CharacterInfo.svelte)
- Supports volume control and sound enable/disable
- Preloads audio files for smooth playback

### FunnyTextDisplay.svelte
- Displays animated text messages at random screen positions
- White text with colored glows instead of backgrounds
- Dynamic animations with scaling, rotation, and floating effects
- Category-specific colors and enhanced visual effects
- Auto-removes messages after 3 seconds with fade-out animation

## Sound Events Integrated

### Dice Rolling
- `playDiceRoll` - Standard dice roll sound
- `playCriticalHit` - Natural 20 or critical success
- `playCriticalFail` - Natural 1 or critical failure

### UI Interactions
- `playButtonClick` - All button clicks
- `playPageFlip` - Tab navigation (can be added)
- `playQuillWrite` - Text input (can be added)

### Character Actions
- `playHealSpell` - HP increases
- `playLevelUp` - Character level up
- `playCoinDrop` - Currency changes
- `playSpellCast` - Spell actions
- `playSwordHit` - Combat actions
- `playInspiration` - Inspiration gained

## Sound File Structure
The system expects sound files in `/public/sounds/` or path specified by `VITE_SOUND_PATH`:

```
/public/sounds/
├── dice-roll.wav
├── critical-hit.wav
├── critical-fail.wav
├── button-click.wav
├── heal-spell.wav
├── level-up.wav
├── coin-drop.wav
├── sword-hit.wav
├── inspiration.wav
└── ... (other sound files)
```

## Environment Variables
- `VITE_SOUND_PATH` - Custom path for sound files (default: '/sounds')

## Usage Examples

### Triggering Sounds from Components
```javascript
// Play a dice roll sound
window.dispatchEvent(new CustomEvent('playDiceRoll'));

// Play sound with funny text
window.dispatchEvent(new CustomEvent('playCriticalHit'));
window.dispatchEvent(new CustomEvent('showFunnyText', {
  detail: { text: 'Epic critical hit!', category: 'criticalHit' }
}));
```

### Adding New Sounds
1. Add sound file to `/public/sounds/`
2. Add entry to `soundFiles` object in SoundManager.svelte
3. Add event listener in the `soundEvents` array
4. Trigger with `window.dispatchEvent(new CustomEvent('playYourSound'))`

## Integration Status

### ✅ Completed
- All dice rolling functions (engine.ts)
- Ability checks (Ability.svelte)
- Skill checks (Skills.svelte)
- Saving throws (SavingThrow.svelte)
- Initiative rolls (Initiative.svelte)
- HP healing detection (HitPoints.svelte)
- Level up celebrations (LevelUpDialog.svelte)
- Attack and damage rolls
- Inspiration activation (Inspiration.svelte)

### 🔲 Future Enhancements
- Spell casting sounds from spell lists
- Inventory item interactions
- Character creation/import sounds
- Chat message sounds
- Combat turn notifications
- Rest/sleep sounds
- Equipment equip/unequip sounds

## UI Integration

### Top Bar Controls
- **Sound Button**: Toggle sound on/off with 🔊/🔇 icon in top action bar
- **Chat Theme Button**: Switch between modern chat 💬 and scroll theme 📜 in top action bar

## Customization
Users can:
- Toggle sound on/off with the Sound button in the top bar
- Switch chat themes with the Theme button in the top bar
- Adjust volume (future: in sound panel)
- Disable specific sound categories (future enhancement)

The system gracefully handles missing sound files and provides console warnings for debugging.