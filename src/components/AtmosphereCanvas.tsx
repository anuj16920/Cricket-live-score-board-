import React from 'react';

interface ParticleSpec {
  id: number;
  left: string;
  top: string;
  size: number;
  baseOpacity: number;
  peakOpacity: number;
  dx: string;
  dy: string;
  dur: string;
  twinkle: string;
  delay: string;
}

// Restrained deterministic background dust (very subtle so UI stays clean and simple)
const PARTICLES: ParticleSpec[] = Array.from({ length: 14 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const seed2 = (i * 5413 + 19391) % 233280;
  const left = ((seed / 233280) * 94 + 3).toFixed(2);
  const top = ((seed2 / 233280) * 86 + 4).toFixed(2);
  const size = i % 5 === 0 ? 2 : 1.3;
  const baseOpacity = 0.06;
  const peakOpacity = 0.22;
  const dx = `${((i % 5) - 2) * 5}px`;
  const dy = `${-8 - (i % 3) * 4}px`;
  const dur = `${22 + (i % 5) * 4}s`;
  const twinkle = `${7 + (i % 4) * 2}s`;
  const delay = `${-(i * 1.6).toFixed(1)}s`;
  return {
    id: i,
    left: `${left}%`,
    top: `${top}%`,
    size,
    baseOpacity,
    peakOpacity,
    dx,
    dy,
    dur,
    twinkle,
    delay,
  };
});

export type AmbientTone = 'default' | 'live' | 'boundary' | 'wicket';

interface AtmosphereCanvasProps {
  tone?: AmbientTone;
}

export const AtmosphereCanvas: React.FC<AtmosphereCanvasProps> = ({ tone = 'default' }) => {
  const radialColor =
    tone === 'boundary'
      ? 'rgba(245, 158, 11, 0.13)'
      : tone === 'wicket'
        ? 'rgba(251, 113, 133, 0.13)'
        : tone === 'live'
          ? 'rgba(52, 211, 153, 0.10)'
          : 'rgba(56, 189, 248, 0.08)';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Clean carbon-obsidian top gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 45% at 50% -8%, rgba(30, 41, 59, 0.34) 0%, rgba(9, 9, 11, 0.88) 52%, #09090B 100%)',
        }}
      />

      {/* Soft overhead reactive light */}
      <div
        className="bl-ambient-orb absolute -top-36 left-1/2 h-[520px] w-[960px] transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse 50% 48% at 50% 42%, ${radialColor} 0%, transparent 72%)`,
        }}
      />

      {/* Minimal subtle ambient dust */}
      <div className="absolute inset-0">
        {PARTICLES.map((p) => (
          <span
            key={p.id}
            className="bl-particle absolute rounded-full bg-white"
            style={
              {
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                animationDelay: p.delay,
                '--base-op': p.baseOpacity,
                '--peak-op': p.peakOpacity,
                '--dx': p.dx,
                '--dy': p.dy,
                '--dur': p.dur,
                '--twinkle': p.twinkle,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
};
