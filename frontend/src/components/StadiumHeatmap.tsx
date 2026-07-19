import React, { useRef, useEffect, useCallback } from 'react';
import { Zone } from '../types/aegis';

interface Props {
  zones: Zone[];
  stadiumName: string;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string | null) => void;
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

function drawArrow(ctx: CanvasRenderingContext2D, fromx: number, fromy: number, tox: number, toy: number, color: string, glow: boolean = false) {
  const headlen = 8;
  const dx = tox - fromx;
  const dy = toy - fromy;
  const angle = Math.atan2(dy, dx);

  ctx.save();
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = glow ? 2.5 : 1.5;
  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export default function StadiumHeatmap({ zones, stadiumName, selectedZoneId, onSelectZone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const glowPhaseRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);

  // Initialize flow particles if needed
  const updateParticles = useCallback((cx: number, cy: number, W: number, H: number, gateBRedirect: boolean) => {
    while (particlesRef.current.length < 60) {
      const gateType = Math.floor(Math.random() * 4);
      let sx = cx;
      let sy = cy;
      let pColor = 'rgba(0, 212, 255, 0.4)';

      if (gateType === 0) {
        sx = cx; sy = H * 0.15;
      } else if (gateType === 1) {
        sx = cx; sy = H * 0.85;
        if (gateBRedirect) pColor = 'rgba(255, 51, 102, 0.5)';
      } else if (gateType === 2) {
        sx = W * 0.85; sy = cy;
      } else {
        sx = W * 0.15; sy = cy;
        if (gateBRedirect) pColor = 'rgba(16, 185, 129, 0.6)';
      }

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

    particlesRef.current.forEach((p, idx) => {
      p.progress += p.speed;
      if (p.progress >= 1.0) {
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

    const gateB = zones.find(z => z.id === 'south_gate_b');
    const isGateBRedirectionActive = gateB ? gateB.density > 0.6 : false;

    updateParticles(cx, cy, W, H, isGateBRedirectionActive);

    // Clear
    ctx.fillStyle = '#03040a';
    ctx.fillRect(0, 0, W, H);

    const isAnySelected = selectedZoneId !== null;

    // Apply global dim layer if any zone is focused
    ctx.save();
    ctx.globalAlpha = isAnySelected ? 0.25 : 1.0;

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
    ctx.beginPath(); ctx.roundRect(shellX - 18, cy - 60, 14, 120, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.font = "8px 'Space Mono'";
    ctx.textAlign = 'center';
    ctx.fillText("P1", shellX - 11, cy);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    ctx.beginPath(); ctx.roundRect(shellX + shellW + 4, cy - 60, 14, 120, 4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.fillText("P2", shellX + shellW + 11, cy);

    // Outer Stadium Shell
    ctx.beginPath();
    const r = 24;
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

    // Seating block sectors (Level 300, 200)
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(cx, cy, shellW * 0.38, shellH * 0.38, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.ellipse(cx, cy, shellW * 0.30, shellH * 0.30, 0, 0, Math.PI * 2); ctx.stroke();

    // Emergency Evacuation / Exit signs
    ctx.fillStyle = 'rgba(16, 185, 129, 0.1)';
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    const exitPoints = [
      { x: shellX + 30, y: shellY + 30 },
      { x: shellX + shellW - 30, y: shellY + 30 },
      { x: shellX + 30, y: shellY + shellH - 30 },
      { x: shellX + shellW - 30, y: shellY + shellH - 30 }
    ];
    exitPoints.forEach(pt => {
      ctx.beginPath(); ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });

    // FIELD Line Markings
    const fieldW = W * 0.32;
    const fieldH = H * 0.28;
    const fieldX = cx - fieldW / 2;
    const fieldY = cy - fieldH / 2;

    ctx.fillStyle = '#143c16';
    ctx.beginPath(); ctx.roundRect(fieldX, fieldY, fieldW, fieldH, 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, fieldY); ctx.lineTo(cx, fieldY + fieldH); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, fieldH * 0.22, 0, Math.PI * 2); ctx.stroke();

    // Flow particles
    particlesRef.current.forEach(p => {
      const px = p.x + (p.targetX - p.x) * p.progress;
      const py = p.y + (p.targetY - p.y) * p.progress;
      ctx.beginPath(); ctx.arc(px, py, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    });
    ctx.restore(); // Restore opacity for focused elements

    // DRAW DYNAMIC FLOW ARROWS FOR THE SELECTED ZONE
    if (isAnySelected) {
      const activeColor = 'var(--accent-cyan)';

      if (selectedZoneId === 'north_gate_a') {
        drawArrow(ctx, cx, 15, cx, cy - 80, activeColor, true);
        drawArrow(ctx, cx, cy - 80, cx, cy - 30, 'rgba(0, 212, 255, 0.6)');
      } else if (selectedZoneId === 'south_gate_b') {
        if (isGateBRedirectionActive) {
          drawArrow(ctx, cx, H - 15, cx - 80, H - 40, 'var(--accent-red)', true);
          drawArrow(ctx, cx - 80, H - 40, shellX + 24, cy + 40, 'var(--accent-green)', true);
        } else {
          drawArrow(ctx, cx, H - 15, cx, cy + 80, activeColor, true);
          drawArrow(ctx, cx, cy + 80, cx, cy + 30, 'rgba(0, 212, 255, 0.6)');
        }
      } else if (selectedZoneId === 'east_gate_c') {
        drawArrow(ctx, W - 25, cy, cx + 80, cy, activeColor, true);
        drawArrow(ctx, cx + 80, cy, cx + 30, cy, 'rgba(0, 212, 255, 0.6)');
      } else if (selectedZoneId === 'west_gate_d') {
        drawArrow(ctx, 25, cy, cx - 80, cy, activeColor, true);
        drawArrow(ctx, cx - 80, cy, cx - 30, cy, 'rgba(0, 212, 255, 0.6)');
      } else if (selectedZoneId === 'concourse_main') {
        drawArrow(ctx, cx, shellY + 30, cx, shellY + 80, activeColor, true);
        drawArrow(ctx, cx, shellY + shellH - 30, cx, shellY + shellH - 80, activeColor, true);
        drawArrow(ctx, shellX + 40, cy, shellX + 100, cy, activeColor, true);
        drawArrow(ctx, shellX + shellW - 40, cy, shellX + shellW - 100, cy, activeColor, true);
      } else if (selectedZoneId === 'lower_bowl' || selectedZoneId === 'upper_bowl') {
        drawArrow(ctx, cx - 60, cy + 60, cx - 40, cy + 30, activeColor, true);
        drawArrow(ctx, cx + 60, cy - 60, cx + 40, cy - 30, activeColor, true);
      } else if (selectedZoneId === 'field_level') {
        drawArrow(ctx, shellX + 35, cy, cx - 60, cy, 'var(--accent-amber)', true);
        drawArrow(ctx, shellX + shellW - 35, cy, cx + 60, cy, 'var(--accent-amber)', true);
      }
    }

    // Draw redirect guidelines
    if (isGateBRedirectionActive && !isAnySelected) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.ellipse(cx, cy, shellW * 0.36, shellH * 0.36, 0, Math.PI * 0.5, Math.PI, false);
      ctx.stroke();
      ctx.setLineDash([]);
      
      const arrowX = cx - shellW * 0.25;
      const arrowY = cy + shellH * 0.25;
      ctx.beginPath(); ctx.arc(arrowX, arrowY, 6 + glowPulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; ctx.fill();
      ctx.strokeStyle = 'var(--accent-green)'; ctx.stroke();
      ctx.fillStyle = 'var(--accent-green)'; ctx.font = "bold 8px 'Space Mono'";
      ctx.fillText("DIVERT", arrowX, arrowY + 2.5);
    }

    // Draw zone overlays
    zones.forEach(zone => {
      const zx = zone.x * W;
      const zy = zone.y * H;
      const baseRadius = 18 + (zone.capacity / 600) * 14;
      const rc = RISK_COLORS[zone.risk];
      const isSelected = selectedZoneId === zone.id;

      ctx.save();
      // Highlight selection or dim others
      if (isAnySelected) {
        ctx.globalAlpha = isSelected ? 1.0 : 0.2;
      } else {
        ctx.globalAlpha = 1.0;
      }

      // Draw selector pulse ring if selected
      if (isSelected) {
        ctx.strokeStyle = 'var(--accent-cyan)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(zx, zy, baseRadius + 6 + glowPulse * 6, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
        ctx.beginPath();
        ctx.arc(zx, zy, baseRadius + 6 + glowPulse * 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Pulsing outer glow for warnings
      if (zone.risk === 'critical') {
        const glowRadius = baseRadius + 12 + glowPulse * 8;
        const grad = ctx.createRadialGradient(zx, zy, baseRadius * 0.5, zx, zy, glowRadius);
        grad.addColorStop(0, `rgba(255,51,102,${0.35 + glowPulse * 0.2})`);
        grad.addColorStop(1, 'rgba(255,51,102,0)');
        ctx.beginPath(); ctx.arc(zx, zy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      } else if (zone.risk === 'high') {
        const glowRadius = baseRadius + 7 + glowPulse * 4;
        const grad = ctx.createRadialGradient(zx, zy, baseRadius * 0.3, zx, zy, glowRadius);
        grad.addColorStop(0, `rgba(255,107,53,${0.25 + glowPulse * 0.1})`);
        grad.addColorStop(1, 'rgba(255,107,53,0)');
        ctx.beginPath(); ctx.arc(zx, zy, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
      }

      // Main circle
      ctx.beginPath();
      ctx.arc(zx, zy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = rc.fill;
      ctx.fill();
      ctx.strokeStyle = isSelected ? 'var(--accent-cyan)' : rc.stroke;
      ctx.lineWidth = isSelected ? 2.5 : (zone.risk === 'critical' ? 2.5 + glowPulse * 0.5 : 1.5);
      ctx.stroke();

      // Zone texts
      const shortName = zone.name.split(' ').map((w: string) => w[0]).join('');
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = `bold 9px 'Space Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shortName, zx, zy - 5);
      
      ctx.font = `bold 8px 'Space Mono', monospace`;
      ctx.fillStyle = isSelected ? 'var(--accent-cyan)' : rc.stroke;
      ctx.fillText(`${Math.round(zone.density * 100)}%`, zx, zy + 6);

      ctx.restore();
    });

    // Compass gate boxes
    const gates = [
      { id: 'north_gate_a', label: 'GATE A', x: cx, y: shellY + 12 },
      { id: 'south_gate_b', label: 'GATE B', x: cx, y: shellY + shellH - 12 },
      { id: 'east_gate_c', label: 'GATE C', x: shellX + shellW - 24, y: cy },
      { id: 'west_gate_d', label: 'GATE D', x: shellX + 24, y: cy },
    ];
    gates.forEach(gate => {
      const isSelected = selectedZoneId === gate.id;
      ctx.save();
      if (isAnySelected) {
        ctx.globalAlpha = isSelected ? 1.0 : 0.2;
      }
      
      const tw = 48;
      const th = 14;
      ctx.fillStyle = 'rgba(3,4,10,0.95)';
      ctx.strokeStyle = isSelected ? 'var(--accent-cyan)' : ((gate.id === 'south_gate_b' && isGateBRedirectionActive) ? 'var(--accent-red)' : 'rgba(0,212,255,0.4)');
      ctx.lineWidth = isSelected ? 2.0 : ((gate.id === 'south_gate_b' && isGateBRedirectionActive) ? 1.5 : 1);
      ctx.beginPath();
      ctx.roundRect(gate.x - tw / 2, gate.y - th / 2, tw, th, 3);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isSelected ? 'var(--accent-cyan)' : ((gate.id === 'south_gate_b' && isGateBRedirectionActive) ? 'var(--accent-red)' : '#00d4ff');
      ctx.font = `bold 7px 'Space Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gate.label, gate.x, gate.y);
      ctx.restore();
    });

    // Draw Legend
    ctx.save();
    if (isAnySelected) ctx.globalAlpha = 0.35;
    const legendItems = [
      { label: 'Safe', color: '#00d4ff' },
      { label: 'Moderate', color: '#ffb300' },
      { label: 'High', color: '#ff6b35' },
      { label: 'Critical', color: '#ff3366' },
    ];
    let lx = shellX + 12;
    const ly = shellY + shellH - 24;
    ctx.fillStyle = 'rgba(3,4,10,0.85)';
    ctx.beginPath(); ctx.roundRect(lx - 6, ly - 4, 184, 18, 4); ctx.fill();
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
    ctx.restore();

    // Stadium title
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `bold 10px 'Orbitron', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(stadiumName.toUpperCase(), cx, shellY + 5);

    animFrameRef.current = requestAnimationFrame(draw);
  }, [zones, stadiumName, updateParticles, selectedZoneId]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [draw]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const W = canvas.width;
    const H = canvas.height;
    
    let clickedZoneId: string | null = null;
    for (const zone of zones) {
      const zx = zone.x * W;
      const zy = zone.y * H;
      const baseRadius = 18 + (zone.capacity / 600) * 14;
      const dist = Math.sqrt((clickX - zx) ** 2 + (clickY - zy) ** 2);
      if (dist <= baseRadius + 6) {
        clickedZoneId = zone.id;
        break;
      }
    }
    
    onSelectZone(clickedZoneId === selectedZoneId ? null : clickedZoneId);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const W = canvas.width;
    const H = canvas.height;
    
    let hovering = false;
    for (const zone of zones) {
      const zx = zone.x * W;
      const zy = zone.y * H;
      const baseRadius = 18 + (zone.capacity / 600) * 14;
      const dist = Math.sqrt((x - zx) ** 2 + (y - zy) ** 2);
      if (dist <= baseRadius + 6) {
        hovering = true;
        break;
      }
    }
    canvas.style.cursor = hovering ? 'pointer' : 'default';
  };

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
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
