import React, { useRef, useEffect, useCallback } from 'react';
import { Zone } from '../types/aegis';

interface Props {
  zones: Zone[];
  stadiumName: string;
}

const RISK_COLORS: Record<Zone['risk'], { fill: string; stroke: string; alpha: number }> = {
  safe: { fill: 'rgba(0,212,255,0.18)', stroke: '#00d4ff', alpha: 0.18 },
  moderate: { fill: 'rgba(255,179,0,0.22)', stroke: '#ffb300', alpha: 0.22 },
  high: { fill: 'rgba(255,107,53,0.30)', stroke: '#ff6b35', alpha: 0.30 },
  critical: { fill: 'rgba(255,51,102,0.45)', stroke: '#ff3366', alpha: 0.45 },
};

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  progress: number;
  speed: number;
  color: string;
}

export default function StadiumHeatmap({ zones, stadiumName }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const glowPhaseRef = useRef(0);
  
  // Keep persistent particles for flow animations
  const particlesRef = useRef<Particle[]>([]);

  // Initialize flow particles if needed
  const updateParticles = useCallback((cx: number, cy: number, W: number, H: number, gateBRedirect: boolean) => {
    // Maintain ~60 particles
    while (particlesRef.current.length < 60) {
      // Pick a random source gate (A, B, C, D)
      const gateType = Math.floor(Math.random() * 4);
      let sx = cx;
      let sy = cy;
      let pColor = 'rgba(0, 212, 255, 0.4)'; // Safe blue flow

      if (gateType === 0) { // Gate A (top)
        sx = cx; sy = H * 0.15;
      } else if (gateType === 1) { // Gate B (bottom)
        sx = cx; sy = H * 0.85;
        // If redirecting, Gate B flows get color-coded as amber/red warning flow
        if (gateBRedirect) pColor = 'rgba(255, 51, 102, 0.5)';
      } else if (gateType === 2) { // Gate C (right)
        sx = W * 0.85; sy = cy;
      } else { // Gate D (left)
        sx = W * 0.15; sy = cy;
        if (gateBRedirect) pColor = 'rgba(16, 185, 129, 0.6)'; // redirected flow is green
      }

      // Pick a target seat zone or concourse
      const targetZone = zones[Math.floor(Math.random() * zones.length)];
      const tx = targetZone ? targetZone.x * W : cx;
      const ty = targetZone ? targetZone.y * H : cy;

      particlesRef.current.push({
        x: sx,
        y: sy,
        targetX: tx,
        targetY: ty,
        progress: 0,
        speed: 0.005 + Math.random() * 0.008,
        color: pColor
      });
    }

    // Move particles
    particlesRef.current.forEach((p, idx) => {
      p.progress += p.speed;
      if (p.progress >= 1.0) {
        // Recycle particle
        particlesRef.current.splice(idx, 1);
      }
    });
  }, [zones]);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const W = container.clientWidth;
    const H = canvas.height;
    if (canvas.width !== W) canvas.width = W;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    glowPhaseRef.current = timestamp * 0.002;
    const glowPulse = Math.sin(glowPhaseRef.current) * 0.5 + 0.5;

    const cx = W / 2;
    const cy = H / 2;

    const shellW = W * 0.9;
    const shellH = H * 0.85;
    const shellX = cx - shellW / 2;
    const shellY = cy - shellH / 2;

    // Detect Gate B Congested state for dynamic flow adjustments
    const gateB = zones.find(z => z.id === 'south_gate_b');
    const isGateBRedirectionActive = gateB ? gateB.density > 0.6 : false;

    // Update crowd particles
    updateParticles(cx, cy, W, H, isGateBRedirectionActive);

    // Clear
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, W, H);

    // Subtle space grid background
    ctx.strokeStyle = 'rgba(0,212,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Parking Zones (Exterior)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 1;
    // Parking Left (P1)
    ctx.beginPath(); ctx.roundRect(shellX - 18, cy - 60, 14, 120, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.font = "8px 'Space Mono'";
    ctx.fillText("P1", shellX - 11, cy);
    
    // Parking Right (P2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.beginPath(); ctx.roundRect(shellX + shellW + 4, cy - 60, 14, 120, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.fillText("P2", shellX + shellW + 11, cy);

    // Outer Stadium Shell (Microsoft/NASA style layout)
    const r = 24;
    ctx.beginPath();
    ctx.moveTo(shellX + r, shellY);
    ctx.lineTo(shellX + shellW - r, shellY);
    ctx.quadraticCurveTo(shellX + shellW, shellY, shellX + shellW, shellY + r);
    ctx.lineTo(shellX + shellW, shellY + shellH - r);
    ctx.quadraticCurveTo(shellX + shellW, shellY + shellH, shellX + shellW - r, shellY + shellH);
    ctx.lineTo(shellX + r, shellY + shellH);
    ctx.quadraticCurveTo(shellX, shellY + shellH, shellX, shellY + shellH - r);
    ctx.lineTo(shellX, shellY + r);
    ctx.quadraticCurveTo(shellX, shellY, shellX + r, shellY);
    ctx.closePath();
    ctx.fillStyle = '#06070f';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,212,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Draw realistic seating block sectors (Level 300, 200, 100)
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 6;
    // Level 300 Outer Arc
    ctx.beginPath();
    ctx.ellipse(cx, cy, shellW * 0.38, shellH * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Level 200 Middle Arc
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, shellW * 0.30, shellH * 0.30, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Emergency Evacuation Arrows / Exit Signs (Exit gates)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.strokeStyle = 'var(--accent-green)';
    ctx.lineWidth = 0.8;
    // Draw 4 emergency egress indicators
    const exitPoints = [
      { x: shellX + 30, y: shellY + 30 },
      { x: shellX + shellW - 30, y: shellY + 30 },
      { x: shellX + 30, y: shellY + shellH - 30 },
      { x: shellX + shellW - 30, y: shellY + shellH - 30 }
    ];
    exitPoints.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'var(--accent-green)';
      ctx.font = "bold 6px 'Space Mono'";
      ctx.fillText("EXIT", pt.x, pt.y + 1);
    });

    // Draw Concourse, Food Courts & Medics Stations
    // Food Court (Zone C / Zone D boundary)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(cx - shellW * 0.35, cy - 40, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'black'; ctx.font = "bold 6px 'Inter'"; ctx.fillText("F", cx - shellW * 0.35, cy - 38);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(cx + shellW * 0.35, cy + 40, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'black'; ctx.font = "bold 6px 'Inter'"; ctx.fillText("F", cx + shellW * 0.35, cy + 42);

    // Medical First Aid Stations (+)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(cx - shellW * 0.2, cy + shellH * 0.28, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = "bold 7px 'Inter'"; ctx.fillText("+", cx - shellW * 0.2, cy + shellH * 0.28 + 2.5);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(cx + shellW * 0.2, cy - shellH * 0.28, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = "bold 7px 'Inter'"; ctx.fillText("+", cx + shellW * 0.2, cy - shellH * 0.28 + 2.5);

    // FIELD Line Markings
    const fieldW = W * 0.32;
    const fieldH = H * 0.28;
    const fieldX = cx - fieldW / 2;
    const fieldY = cy - fieldH / 2;

    ctx.fillStyle = '#143c16';
    ctx.beginPath();
    ctx.roundRect(fieldX, fieldY, fieldW, fieldH, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center line
    ctx.beginPath(); ctx.moveTo(cx, fieldY); ctx.lineTo(cx, fieldY + fieldH); ctx.stroke();
    // Center circle
    ctx.beginPath(); ctx.arc(cx, cy, fieldH * 0.22, 0, Math.PI * 2); ctx.stroke();

    // Animate flow particles moving
    particlesRef.current.forEach(p => {
      const px = p.x + (p.targetX - p.x) * p.progress;
      const py = p.y + (p.targetY - p.y) * p.progress;
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });

    // Dynamic Rerouting Guideline overlay during gate redirection
    if (isGateBRedirectionActive) {
      // Draw redirection path arrow from Gate B (bottom) around to Gate D (left)
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, shellW * 0.36, shellH * 0.36, 0, Math.PI * 0.5, Math.PI, false);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulsing green arrow indicator
      const arrowX = cx - shellW * 0.25;
      const arrowY = cy + shellH * 0.25;
      ctx.beginPath();
      ctx.arc(arrowX, arrowY, 6 + glowPulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fill();
      ctx.strokeStyle = 'var(--accent-green)';
      ctx.stroke();
      ctx.fillStyle = 'var(--accent-green)';
      ctx.font = "bold 8px 'Space Mono'";
      ctx.fillText("DIVERT", arrowX, arrowY + 2.5);
    }

    // Draw zone overlays
    zones.forEach(zone => {
      const zx = zone.x * W;
      const zy = zone.y * H;
      const baseRadius = 18 + (zone.capacity / 600) * 14;
      const rc = RISK_COLORS[zone.risk];

      // Glow for critical zones
      if (zone.risk === 'critical') {
        const glowRadius = baseRadius + 12 + glowPulse * 8;
        const grad = ctx.createRadialGradient(zx, zy, baseRadius * 0.5, zx, zy, glowRadius);
        grad.addColorStop(0, `rgba(255,51,102,${0.35 + glowPulse * 0.2})`);
        grad.addColorStop(1, 'rgba(255,51,102,0)');
        ctx.beginPath();
        ctx.arc(zx, zy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      } else if (zone.risk === 'high') {
        const glowRadius = baseRadius + 7 + glowPulse * 4;
        const grad = ctx.createRadialGradient(zx, zy, baseRadius * 0.3, zx, zy, glowRadius);
        grad.addColorStop(0, `rgba(255,107,53,${0.25 + glowPulse * 0.1})`);
        grad.addColorStop(1, 'rgba(255,107,53,0)');
        ctx.beginPath();
        ctx.arc(zx, zy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      // Main zone circle
      ctx.beginPath();
      ctx.arc(zx, zy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = rc.fill;
      ctx.fill();
      ctx.strokeStyle = rc.stroke;
      ctx.lineWidth = zone.risk === 'critical' ? 2.5 + glowPulse * 0.5 : 1.5;
      ctx.stroke();

      // Zone text properties
      const shortName = zone.name.split(' ').map((w: string) => w[0]).join('');
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `bold 9px 'Space Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortName, zx, zy - 5);
      
      ctx.font = `bold 8px 'Space Mono', monospace`;
      ctx.fillStyle = rc.stroke;
      ctx.fillText(`${Math.round(zone.density * 100)}%`, zx, zy + 6);
    });

    // Gate labels at 4 compass positions
    const gates = [
      { label: 'GATE A', x: cx, y: shellY + 12 },
      { label: 'GATE B', x: cx, y: shellY + shellH - 12 },
      { label: 'GATE C', x: shellX + shellW - 24, y: cy },
      { label: 'GATE D', x: shellX + 24, y: cy },
    ];
    gates.forEach(gate => {
      const tw = 48;
      const th = 14;
      ctx.fillStyle = 'rgba(3,4,10,0.95)';
      ctx.strokeStyle = (gate.label === 'GATE B' && isGateBRedirectionActive) ? 'var(--accent-red)' : 'rgba(0,212,255,0.4)';
      ctx.lineWidth = (gate.label === 'GATE B' && isGateBRedirectionActive) ? 1.5 : 1;
      ctx.beginPath();
      ctx.roundRect(gate.x - tw / 2, gate.y - th / 2, tw, th, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = (gate.label === 'GATE B' && isGateBRedirectionActive) ? 'var(--accent-red)' : '#00d4ff';
      ctx.font = `bold 7px 'Space Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gate.label, gate.x, gate.y);
    });

    // Legend at bottom-left
    const legendItems = [
      { label: 'Safe', color: '#00d4ff' },
      { label: 'Moderate', color: '#ffb300' },
      { label: 'High', color: '#ff6b35' },
      { label: 'Critical', color: '#ff3366' },
    ];
    let lx = shellX + 12;
    const ly = shellY + shellH - 24;
    ctx.fillStyle = 'rgba(3,4,10,0.85)';
    ctx.beginPath();
    ctx.roundRect(lx - 6, ly - 4, 184, 18, 4);
    ctx.fill();
    legendItems.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(lx, ly + 1, 7, 7);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `7px 'Space Mono', monospace`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(item.label, lx + 10, ly + 1);
      lx += item.label.length * 5.2 + 16;
    });

    // Stadium name at top
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `bold 10px 'Orbitron', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(stadiumName.toUpperCase(), cx, shellY + 5);

    animFrameRef.current = requestAnimationFrame(draw);
  }, [zones, stadiumName, updateParticles]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 380,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 8,
      }}
    >
      <canvas
        ref={canvasRef}
        height={380}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
