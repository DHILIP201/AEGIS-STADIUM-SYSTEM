import React, { useRef, useEffect, useCallback, useState } from 'react';
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

  // Selected Zone timer ticks up to animate mitigation steps sequentially
  const [selectedZoneTimer, setSelectedZoneTimer] = useState(0);

  useEffect(() => {
    setSelectedZoneTimer(0);
    if (selectedZoneId) {
      const interval = setInterval(() => {
        setSelectedZoneTimer(prev => Math.min(prev + 1, 8));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [selectedZoneId]);

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

    // Apply dim layer if focused
    ctx.save();
    ctx.globalAlpha = isAnySelected ? 0.25 : 1.0;

    // Subtle Grid
    ctx.strokeStyle = 'rgba(0,212,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Parking Zones
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

    // Seating arcs
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.ellipse(cx, cy, shellW * 0.38, shellH * 0.38, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.015)';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.ellipse(cx, cy, shellW * 0.30, shellH * 0.30, 0, 0, Math.PI * 2); ctx.stroke();

    // Exits
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

    // Pitch
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
    ctx.restore();

    // Draw flow arrows for focused zone
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

    // Default Gate B divert corridor
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

    // Draw stadium zones
    zones.forEach(zone => {
      const zx = zone.x * W;
      const zy = zone.y * H;
      const baseRadius = 18 + (zone.capacity / 600) * 14;
      const rc = RISK_COLORS[zone.risk];
      const isSelected = selectedZoneId === zone.id;

      ctx.save();
      if (isAnySelected) {
        ctx.globalAlpha = isSelected ? 1.0 : 0.2;
      }

      if (isSelected) {
        ctx.strokeStyle = 'var(--accent-cyan)';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(zx, zy, baseRadius + 6 + glowPulse * 6, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(0, 212, 255, 0.08)';
        ctx.beginPath(); ctx.arc(zx, zy, baseRadius + 6 + glowPulse * 6, 0, Math.PI * 2); ctx.fill();
      }

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

      ctx.beginPath();
      ctx.arc(zx, zy, baseRadius, 0, Math.PI * 2);
      ctx.fillStyle = rc.fill;
      ctx.fill();
      ctx.strokeStyle = isSelected ? 'var(--accent-cyan)' : rc.stroke;
      ctx.lineWidth = isSelected ? 2.5 : (zone.risk === 'critical' ? 2.5 + glowPulse * 0.5 : 1.5);
      ctx.stroke();

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

    // Compass gates
    const gates = [
      { id: 'north_gate_a', label: 'GATE A', x: cx, y: shellY + 12 },
      { id: 'south_gate_b', label: 'GATE B', x: cx, y: shellY + shellH - 12 },
      { id: 'east_gate_c', label: 'GATE C', x: shellX + shellW - 24, y: cy },
      { id: 'west_gate_d', label: 'GATE D', x: shellX + 24, y: cy },
    ];
    gates.forEach(gate => {
      const isSelected = selectedZoneId === gate.id;
      ctx.save();
      if (isAnySelected) ctx.globalAlpha = isSelected ? 1.0 : 0.2;
      
      const tw = 48;
      const th = 14;
      ctx.fillStyle = 'rgba(3,4,10,0.95)';
      ctx.strokeStyle = isSelected ? 'var(--accent-cyan)' : ((gate.id === 'south_gate_b' && isGateBRedirectionActive) ? 'var(--accent-red)' : 'rgba(0,212,255,0.4)');
      ctx.lineWidth = isSelected ? 2.0 : ((gate.id === 'south_gate_b' && isGateBRedirectionActive) ? 1.5 : 1);
      ctx.beginPath(); ctx.roundRect(gate.x - tw / 2, gate.y - th / 2, tw, th, 3); ctx.fill(); ctx.stroke();

      ctx.fillStyle = isSelected ? 'var(--accent-cyan)' : ((gate.id === 'south_gate_b' && isGateBRedirectionActive) ? 'var(--accent-red)' : '#00d4ff');
      ctx.font = `bold 7px 'Space Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(gate.label, gate.x, gate.y);
      ctx.restore();
    });

    // Legend
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

    // Title
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `bold 10px 'Orbitron', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(stadiumName.toUpperCase(), cx, shellY + 5);

    // DRAW THE DYNAMIC HUD OVERLAY BOX FOR LIVE OPERATIONS INSIDE VISUALIZATION
    if (selectedZoneId) {
      const zone = zones.find(z => z.id === selectedZoneId);
      if (zone) {
        const zx = zone.x * W;
        const zy = zone.y * H;
        const baseRadius = 18 + (zone.capacity / 600) * 14;

        // Box parameters
        const boxW = 260;
        const boxH = 230;

        // Smart position relative to zone to prevent overlay clipping
        let boxX = zx + baseRadius + 15;
        let boxY = zy - boxH / 2;

        if (zone.id.includes('gate_a')) {
          boxX = zx - boxW / 2;
          boxY = zy + baseRadius + 15;
        } else if (zone.id.includes('gate_b')) {
          boxX = zx - boxW / 2;
          boxY = zy - baseRadius - boxH - 15;
        } else if (zone.id.includes('gate_c')) {
          boxX = zx - baseRadius - boxW - 15;
          boxY = zy - boxH / 2;
        } else if (zone.id.includes('gate_d')) {
          boxX = zx + baseRadius + 15;
          boxY = zy - boxH / 2;
        } else {
          boxX = cx + 25;
          boxY = cy - boxH - 10;
        }

        // Adjust constraints
        boxX = Math.max(10, Math.min(W - boxW - 10, boxX));
        boxY = Math.max(10, Math.min(H - boxH - 10, boxY));

        // Connect zone with box via indicator line
        ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(zx, zy);
        ctx.lineTo(boxX + (zx > boxX + boxW ? boxW : 0), boxY + boxH / 2);
        ctx.stroke();

        // Box border and shadow glow
        ctx.save();
        ctx.shadowColor = '#00d4ff';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(5, 7, 18, 0.95)';
        ctx.strokeStyle = 'var(--accent-cyan)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // Header Background
        ctx.fillStyle = 'rgba(0, 212, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, 24, [6, 6, 0, 0]);
        ctx.fill();

        // Header Text
        ctx.fillStyle = 'white';
        ctx.font = "bold 9px 'Orbitron', sans-serif";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`📍 ${zone.name.toUpperCase()} — LIVE OPS`, boxX + 10, boxY + 12);

        // Status Badge
        const mitigationActive = zone.risk === 'critical' || zone.risk === 'high';
        ctx.fillStyle = selectedZoneTimer >= 5 ? 'var(--accent-green)' : (mitigationActive ? 'var(--accent-amber)' : 'var(--accent-green)');
        ctx.font = "bold 7px 'Space Mono', monospace";
        ctx.textAlign = 'right';
        ctx.fillText(selectedZoneTimer >= 5 ? 'MISSION STABLE' : (mitigationActive ? 'MITIGATION IN PROGRESS' : 'MISSION ACTIVE'), boxX + boxW - 10, boxY + 12);

        // Live Action Steps with Rationale
        const isCongested = zone.id === 'south_gate_b' && zone.density > 0.75;
        const isStorm = (zone.id === 'concourse_main' || zone.id.includes('bowl')) && zone.risk !== 'safe';

        const defaultItems = [
          { name: "CCTV AI feed telemetry", reason: "Cross-reference crowd density" },
          { name: "Turnstile log verification", reason: "Verify validator status" },
          { name: "GPS density profile scan", reason: "Model bottleneck probability" },
          { name: "Strategic readiness check", reason: "Standby agents check-in" }
        ];
        
        const congestedItems = [
          { name: "Deploy 14 corridor guides", reason: "Preempts Gate B queue in 3 min" },
          { name: "Open Gate D overflow lanes", reason: "Gate D spare capacity 59%" },
          { name: "Update dynamic signage", reason: "Redirect 18% of arrivals" },
          { name: "Notify Fan Companion app", reason: "Push GPS detour route feeds" }
        ];

        const stormItems = [
          { name: "Boost concourse HVAC (+35%)", reason: "Mitigates hypothermia risk" },
          { name: "Position 8 emergency medics", reason: "Treat 3 active slip-fall alerts" },
          { name: "Dispatch extra Metro trains", reason: "Clear +340% exit demand spike" },
          { name: "Deploy guides to shelters", reason: "Manage Concourse 91% bottleneck" }
        ];

        const items = isCongested ? congestedItems : (isStorm ? stormItems : defaultItems);

        if (selectedZoneTimer >= 5) {
          // Render Mission Success Summary card
          ctx.fillStyle = 'rgba(16, 185, 129, 0.05)';
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
          ctx.beginPath();
          ctx.roundRect(boxX + 10, boxY + 30, boxW - 20, 102, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = 'var(--accent-green)';
          ctx.font = "bold 9px 'Orbitron', monospace";
          ctx.textBaseline = 'top';
          ctx.fillText("🏆 MISSION STABLE & RESOLVED", boxX + 20, boxY + 38);

          ctx.fillStyle = 'white';
          ctx.font = "7.5px 'Space Mono', monospace";
          ctx.fillText(`• Incident: ${isCongested ? "Gate B Bottleneck" : isStorm ? "Concourse Storm Crush" : "Diagnostic Check"}`, boxX + 20, boxY + 54);
          ctx.fillText(`• Density decay: ${isCongested ? "91% ➔ 58% (Resolved)" : isStorm ? "91% ➔ 72% (Sheltered)" : "Normal limits"}`, boxX + 20, boxY + 66);
          ctx.fillText(`• Resolution time: ${isCongested ? "8 minutes" : isStorm ? "11 minutes" : "0s"}`, boxX + 20, boxY + 78);
          ctx.fillText(`• Safety outcome: 100% stable, 0 serious injuries`, boxX + 20, boxY + 90);
          ctx.fillText(`• Mitigation accuracy: 94.2% (Consensus match)`, boxX + 20, boxY + 102);
        } else {
          // Render animated checklist items with Rationale
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          let itemY = boxY + 30;
          items.forEach((item, index) => {
            let symbol = "⏳";
            let color = 'var(--text-muted)';
            
            if (selectedZoneTimer > index + 1) {
              symbol = "✓";
              color = 'var(--accent-green)';
            } else if (selectedZoneTimer === index + 1) {
              symbol = "●";
              color = 'var(--accent-amber)';
            }
            
            ctx.fillStyle = color;
            ctx.font = "bold 8px 'Space Mono', monospace";
            ctx.fillText(symbol, boxX + 10, itemY);
            
            ctx.fillStyle = selectedZoneTimer >= index + 1 ? 'white' : 'var(--text-muted)';
            ctx.font = "bold 8px 'Space Mono', monospace";
            ctx.fillText(item.name, boxX + 24, itemY);
            
            ctx.fillStyle = 'var(--text-muted)';
            ctx.font = "7px 'Space Mono', monospace";
            ctx.fillText(`Reason: ${item.reason}`, boxX + 24, itemY + 11);
            
            itemY += 26;
          });
        }

        // Timeline drawing
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = "bold 7px 'Space Mono', monospace";
        ctx.fillText("OPERATIONAL EVENT TIMELINE", boxX + 10, boxY + 138);

        const times = isCongested ? ["11:02:14 Crowd Spike", "11:02:17 Analysis", "11:02:33 Resolved"] : 
                      isStorm ? ["11:14:02 Storm Hit", "11:14:06 Emergency", "11:14:18 Stable"] :
                      ["12:00:00 Booting", "12:00:04 Monitoring", "12:00:15 Standby"];
                      
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.font = "6.5px 'Space Mono', monospace";
        
        let timelineText = `${times[0]}  ➔  ${times[1]}`;
        if (selectedZoneTimer >= 5) {
          timelineText += `  ➔  ${times[2]}`;
        }
        ctx.fillText(timelineText, boxX + 10, boxY + 148);

        // Evidence sources drawing
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = "bold 7px 'Space Mono', monospace";
        ctx.fillText("DECISION EVIDENCE SOURCES", boxX + 10, boxY + 160);
        
        const evidenceStr = isCongested ? "CCTV | TURNSTILES | TICKETS | TRANSPORT" :
                            isStorm ? "CCTV | WEATHER | MEDICAL | ENERGY | METRO" :
                            "CCTV | TURNSTILES | ENVIRONMENTAL";
        ctx.fillStyle = 'var(--accent-cyan)';
        ctx.font = "bold 7px 'Space Mono', monospace";
        ctx.fillText(evidenceStr, boxX + 10, boxY + 170);

        // Bottom Metrics separator
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(boxX + 10, boxY + boxH - 34);
        ctx.lineTo(boxX + boxW - 10, boxY + boxH - 34);
        ctx.stroke();

        // Calculate dynamic crowd density decay values over time
        const initialDensity = Math.round(zone.density * 100);
        let currentDensity = initialDensity;
        if (mitigationActive && selectedZoneTimer > 0) {
          currentDensity = Math.max(58, initialDensity - selectedZoneTimer * 4);
        }

        let eta = "Nominal";
        if (isCongested) {
          eta = selectedZoneTimer >= 5 ? "Resolved" : "4m 12s";
        } else if (isStorm) {
          eta = selectedZoneTimer >= 5 ? "Resolved" : "2m 18s";
        }

        const confidence = zone.risk === 'critical' ? 97 : (zone.risk === 'high' ? 91 : 95);

        // Render bottom row KPIs
        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = "7px 'Space Mono', monospace";
        ctx.fillText("DENSITY", boxX + 10, boxY + boxH - 24);
        ctx.fillStyle = zone.risk === 'critical' ? 'var(--accent-red)' : 'var(--accent-cyan)';
        ctx.font = "bold 10px 'Space Mono', monospace";
        ctx.fillText(`${currentDensity}%`, boxX + 10, boxY + boxH - 14);

        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = "7px 'Space Mono', monospace";
        ctx.fillText("RESOLUTION ETA", boxX + 80, boxY + boxH - 24);
        ctx.fillStyle = 'white';
        ctx.font = "bold 10px 'Space Mono', monospace";
        ctx.fillText(eta, boxX + 80, boxY + boxH - 14);

        ctx.fillStyle = 'var(--text-muted)';
        ctx.font = "7px 'Space Mono', monospace";
        ctx.fillText("DECISION CONF", boxX + 170, boxY + boxH - 24);
        ctx.fillStyle = 'var(--accent-green)';
        ctx.font = "bold 10px 'Space Mono', monospace";
        ctx.fillText(`${confidence}%`, boxX + 170, boxY + boxH - 14);
      }
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [zones, stadiumName, updateParticles, selectedZoneId, selectedZoneTimer]);

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
