<script lang="ts">
  import { onMount } from 'svelte';
  
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let damageTexts: DamageText[] = [];
  let confetti: ConfettiParticle[] = [];
  let levelUpParticles: LevelUpParticle[] = [];
  let animationId: number;
  
  interface DamageText {
    id: string;
    text: string;
    x: number;
    y: number;
    startY: number;
    opacity: number;
    scale: number;
    color: string;
    type: 'damage' | 'heal' | 'critical' | 'miss';
    startTime: number;
    duration: number;
  }
  
  interface ConfettiParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rotation: number;
    rotationSpeed: number;
    color: string;
    size: number;
    shape: 'square' | 'circle' | 'triangle';
    gravity: number;
    life: number;
    maxLife: number;
  }
  
  interface LevelUpParticle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    type: 'star' | 'spark' | 'ring' | 'burst';
    life: number;
    maxLife: number;
    rotation: number;
    rotationSpeed: number;
    scale: number;
    pulse: number;
  }
  
  function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  function createConfetti(x: number, y: number, count: number = 50) {
    // Get theme colors from CSS variables
    const getThemeColor = (varName: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    };
    
    const primaryColor = getThemeColor('--color-primary-main') || '#FFD700';
    const secondaryColor = getThemeColor('--color-secondary-main') || '#FF6B6B';
    const accentColor = getThemeColor('--color-accent') || '#8b5a2b';
    
    // Mix theme colors with some additional vibrant ones
    const colors = [
      primaryColor,
      secondaryColor, 
      accentColor,
      '#4ECDC4', 
      '#45B7D1', 
      '#96CEB4', 
      '#FFEAA7', 
      '#DDA0DD', 
      '#98D8C8'
    ];
    
    for (let i = 0; i < count; i++) {
      confetti.push({
        x: x + (Math.random() - 0.5) * 100,
        y: y + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 10,
        vy: Math.random() * -8 - 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        shape: ['square', 'circle', 'triangle'][Math.floor(Math.random() * 3)] as 'square' | 'circle' | 'triangle',
        gravity: 0.3,
        life: 1,
        maxLife: Math.random() * 60 + 60
      });
    }
  }
  
  function createLevelUpAnimation(level: number) {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Get theme colors
    const getThemeColor = (varName: string, fallback: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
    };
    
    const primaryColor = getThemeColor('--color-primary-main', '#FFD700');
    const secondaryColor = getThemeColor('--color-secondary-main', '#FF6B35');
    
    // Create multiple waves of different particle types
    const colors = [primaryColor, secondaryColor, '#00ff88', '#ff69b4', '#aa44ff', '#4ECDC4'];
    
    // Wave 1: Ring explosion from center
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const speed = 4 + Math.random() * 3;
      levelUpParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 8 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'ring',
        life: 180,
        maxLife: 180,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 8,
        scale: 1,
        pulse: 0
      });
    }
    
    // Wave 2: Upward burst 
    for (let i = 0; i < 80; i++) {
      const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI/3; // Upward cone
      const speed = 6 + Math.random() * 8;
      levelUpParticles.push({
        x: centerX + (Math.random() - 0.5) * 200,
        y: centerY + 100,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'star',
        life: 220,
        maxLife: 220,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 12,
        scale: 0.5 + Math.random() * 0.5,
        pulse: Math.random() * Math.PI * 2
      });
    }
    
    // Wave 3: Sparks from edges
    for (let i = 0; i < 60; i++) {
      const side = Math.floor(Math.random() * 4);
      let startX, startY, targetX, targetY;
      
      switch(side) {
        case 0: // Top
          startX = Math.random() * window.innerWidth;
          startY = 0;
          break;
        case 1: // Right  
          startX = window.innerWidth;
          startY = Math.random() * window.innerHeight;
          break;
        case 2: // Bottom
          startX = Math.random() * window.innerWidth;
          startY = window.innerHeight;
          break;
        case 3: // Left
          startX = 0;
          startY = Math.random() * window.innerHeight;
          break;
      }
      
      const dx = centerX - startX;
      const dy = centerY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const speed = 3 + Math.random() * 4;
      
      levelUpParticles.push({
        x: startX,
        y: startY,
        vx: (dx / distance) * speed,
        vy: (dy / distance) * speed,
        size: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'spark',
        life: Math.floor(distance / speed) + 60,
        maxLife: Math.floor(distance / speed) + 60,
        rotation: Math.atan2(dy, dx),
        rotationSpeed: 0,
        scale: 1,
        pulse: 0
      });
    }
    
    // Wave 4: Massive central burst with delay
    setTimeout(() => {
      for (let i = 0; i < 100; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 8 + Math.random() * 12;
        levelUpParticles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 10 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          type: 'burst',
          life: 300,
          maxLife: 300,
          rotation: 0,
          rotationSpeed: (Math.random() - 0.5) * 15,
          scale: 1.5,
          pulse: 0
        });
      }
    }, 500);
    
    // Add massive confetti explosion
    setTimeout(() => {
      createConfetti(centerX, centerY, 200);
    }, 200);
    
    // Add level up damage text
    addDamageText(level, 'critical', centerX, centerY - 100);
  }
  
  function addDamageText(damage: number, type: 'damage' | 'heal' | 'critical' | 'miss', x?: number, y?: number) {
    // Get theme colors from CSS variables
    const getThemeColor = (varName: string, fallback: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || fallback;
    };
    
    const colors = {
      damage: getThemeColor('--color-secondary-main', '#FF4444'),
      heal: '#44FF44', // Keep heal green regardless of theme
      critical: getThemeColor('--color-primary-main', '#FFD700'),
      miss: '#CCCCCC'
    };
    
    const targetX = x ?? window.innerWidth / 2 + (Math.random() - 0.5) * 200;
    const targetY = y ?? window.innerHeight / 2 + (Math.random() - 0.5) * 100;
    
    const damageText: DamageText = {
      id: crypto.randomUUID(),
      text: type === 'miss' ? 'MISS' : type === 'critical' ? `${damage}!` : damage.toString(),
      x: targetX,
      y: targetY,
      startY: targetY,
      opacity: 1,
      scale: type === 'critical' ? 1.5 : 1,
      color: colors[type],
      type,
      startTime: Date.now(),
      duration: type === 'critical' ? 3000 : 2000
    };
    
    damageTexts.push(damageText);
    
    // Create confetti based on roll type
    if (type === 'critical') {
      createConfetti(targetX, targetY, 25); // Big confetti for crits
    } else if (type === 'damage') {
      createConfetti(targetX, targetY, 8); // Small confetti for regular rolls
    } else if (type === 'heal') {
      createConfetti(targetX, targetY, 12); // Medium confetti for healing
    }
    // No confetti for misses
  }
  
  function drawDamageText(text: DamageText) {
    if (!ctx) return;
    
    const elapsed = Date.now() - text.startTime;
    const progress = elapsed / text.duration;
    
    if (progress >= 1) {
      damageTexts = damageTexts.filter(t => t.id !== text.id);
      return;
    }
    
    // WoW-style animation: start big, float up, fade out
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    text.y = text.startY - (easeOut * 100);
    text.opacity = 1 - Math.pow(progress, 2);
    text.scale = text.type === 'critical' 
      ? 1.5 + Math.sin(elapsed * 0.01) * 0.2 
      : 1 + (1 - progress) * 0.3;
    
    ctx.save();
    ctx.globalAlpha = text.opacity;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Font styling like WoW
    const fontSize = (text.type === 'critical' ? 48 : 36) * text.scale;
    ctx.font = `bold ${fontSize}px 'Cinzel', serif`;
    
    // Text stroke for visibility
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.strokeText(text.text, text.x, text.y);
    
    // Main text color
    ctx.fillStyle = text.color;
    ctx.fillText(text.text, text.x, text.y);
    
    // Critical hit effects
    if (text.type === 'critical') {
      ctx.shadowColor = text.color;
      ctx.shadowBlur = 20;
      ctx.fillText(text.text, text.x, text.y);
      ctx.shadowBlur = 0;
    }
    
    ctx.restore();
  }
  
  function drawConfettiParticle(particle: ConfettiParticle) {
    if (!ctx) return;
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.vy += particle.gravity;
    particle.rotation += particle.rotationSpeed;
    particle.life--;
    
    if (particle.life <= 0) {
      confetti = confetti.filter(p => p !== particle);
      return;
    }
    
    const alpha = particle.life / particle.maxLife;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation * Math.PI / 180);
    ctx.fillStyle = particle.color;
    
    switch (particle.shape) {
      case 'square':
        ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, particle.size/2, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -particle.size/2);
        ctx.lineTo(-particle.size/2, particle.size/2);
        ctx.lineTo(particle.size/2, particle.size/2);
        ctx.closePath();
        ctx.fill();
        break;
    }
    
    ctx.restore();
  }
  
  function drawLevelUpParticle(particle: LevelUpParticle) {
    if (!ctx) return;
    
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.rotation += particle.rotationSpeed;
    particle.pulse += 0.2;
    particle.life--;
    
    if (particle.life <= 0) {
      levelUpParticles = levelUpParticles.filter(p => p !== particle);
      return;
    }
    
    const alpha = particle.life / particle.maxLife;
    const pulseScale = 1 + Math.sin(particle.pulse) * 0.3;
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation * Math.PI / 180);
    ctx.scale(particle.scale * pulseScale, particle.scale * pulseScale);
    
    // Add glow effect
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = particle.size;
    ctx.fillStyle = particle.color;
    
    switch (particle.type) {
      case 'star':
        // Draw 5-pointed star
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = particle.size;
        const innerRadius = particle.size * 0.4;
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i / (spikes * 2)) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'ring':
        ctx.beginPath();
        ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
        ctx.lineWidth = 3;
        ctx.strokeStyle = particle.color;
        ctx.stroke();
        break;
        
      case 'spark':
        // Draw diamond shape
        ctx.beginPath();
        ctx.moveTo(0, -particle.size);
        ctx.lineTo(particle.size/2, 0);
        ctx.lineTo(0, particle.size);
        ctx.lineTo(-particle.size/2, 0);
        ctx.closePath();
        ctx.fill();
        break;
        
      case 'burst':
        // Draw explosive burst
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const length = particle.size + Math.sin(particle.pulse * 2) * particle.size * 0.5;
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = particle.color;
        ctx.stroke();
        break;
    }
    
    ctx.restore();
  }
  
  function animate() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw damage texts
    damageTexts.forEach(drawDamageText);
    
    // Draw confetti
    confetti.forEach(drawConfettiParticle);
    
    // Draw level up particles
    levelUpParticles.forEach(drawLevelUpParticle);
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Test function to demo the system
  function testDamageDisplay() {
    const damages = [15, 23, 8, 35, 1];
    const types: ('damage' | 'critical' | 'heal' | 'miss')[] = ['damage', 'critical', 'damage', 'critical', 'miss'];
    
    damages.forEach((damage, i) => {
      setTimeout(() => {
        addDamageText(damage, types[i]);
      }, i * 500);
    });
  }
  
  onMount(() => {
    if (!canvas) return;
    
    ctx = canvas.getContext('2d')!;
    resizeCanvas();
    animate();
    
    // Listen for damage events
    const handleDamageEvent = (event: CustomEvent) => {
      const { damage, type, x, y } = event.detail;
      addDamageText(damage, type, x, y);
    };
    
    // Listen for test events (for demo purposes)
    const handleTestEvent = () => {
      testDamageDisplay();
    };
    
    // Listen for level up animation events
    const handleLevelUpEvent = (event: CustomEvent) => {
      const { level } = event.detail;
      createLevelUpAnimation(level);
    };
    
    window.addEventListener('showDamage', handleDamageEvent as EventListener);
    window.addEventListener('testDamageDisplay', handleTestEvent);
    window.addEventListener('showLevelUpAnimation', handleLevelUpEvent as EventListener);
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('showDamage', handleDamageEvent as EventListener);
      window.removeEventListener('testDamageDisplay', handleTestEvent);
      window.removeEventListener('showLevelUpAnimation', handleLevelUpEvent as EventListener);
      window.removeEventListener('resize', resizeCanvas);
    };
  });
</script>

<canvas 
  bind:this={canvas}
  class="damage-canvas"
></canvas>

<style>
  .damage-canvas {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  }
</style>