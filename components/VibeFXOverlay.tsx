import React, { useEffect, useState } from 'react';
import { FXRequest } from '../lib/VibeFXEngine';

interface VibeFXOverlayProps {
  requests: FXRequest[];
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

/**
 * VibeFXOverlay
 * 
 * A dumb rendering component that takes FXRequests and draws them.
 * It manages the animation loop for particles and applies global CSS classes for screen effects.
 */
const VibeFXOverlay: React.FC<VibeFXOverlayProps> = ({ requests }) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [shake, setShake] = useState<{active: boolean, intensity: number}>({ active: false, intensity: 0 });
  const [flash, setFlash] = useState<{active: boolean, color: string}>({ active: false, color: '' });

  // Process Incoming Requests
  useEffect(() => {
    if (requests.length === 0) return;

    const newParticles: Particle[] = [];
    let shakeIntensity = 0;
    let flashColor = '';

    requests.forEach(req => {
      // 1. Particle Logic
      if (req.type === 'PARTICLE_EXPLOSION') {
        const count = req.count || 10;
        const centerX = window.innerWidth / 2; // Default to center if not specified
        const centerY = window.innerHeight / 2;
        
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 10 + 2;
          newParticles.push({
            id: req.id + '-' + i,
            x: centerX,
            y: centerY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: req.color,
            size: Math.random() * 8 + 2
          });
        }
      }

      // 2. Shake Logic
      if (req.type === 'SCREEN_SHAKE') {
        shakeIntensity = req.intensity || 0.5;
      }

      // 3. Flash Logic
      if (req.type === 'FLASH') {
        flashColor = req.color;
      }
    });

    if (newParticles.length > 0) {
      setParticles(prev => [...prev, ...newParticles]);
    }

    if (shakeIntensity > 0) {
      setShake({ active: true, intensity: shakeIntensity });
      setTimeout(() => setShake({ active: false, intensity: 0 }), 500);
    }

    if (flashColor) {
      setFlash({ active: true, color: flashColor });
      setTimeout(() => setFlash({ active: false, color: '' }), 150);
    }

  }, [requests]);

  // Animation Loop for Particles
  useEffect(() => {
    let animationFrameId: number;

    const loop = () => {
      setParticles(prevParticles => {
        if (prevParticles.length === 0) return [];
        
        return prevParticles
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.5, // Gravity
            life: p.life - 0.02
          }))
          .filter(p => p.life > 0);
      });
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Apply Shake via CSS transform on BODY (simplified approach) or a wrapper
  // For this component, we will shake the "root" element by accessing it directly or returning a style
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    if (shake.active) {
      const x = (Math.random() - 0.5) * 20 * shake.intensity;
      const y = (Math.random() - 0.5) * 20 * shake.intensity;
      root.style.transform = `translate(${x}px, ${y}px)`;
    } else {
      root.style.transform = 'none';
    }
  }, [shake]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Flash Layer */}
      <div 
        className="absolute inset-0 transition-opacity duration-300 ease-out"
        style={{ 
          backgroundColor: flash.color, 
          opacity: flash.active ? 0.3 : 0 
        }}
      />

      {/* Particles Layer */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.life,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
            transform: `scale(${p.life})`
          }}
        />
      ))}
    </div>
  );
};

export default VibeFXOverlay;