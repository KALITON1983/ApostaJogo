import React, { useMemo } from "react";
import { FootballMatch, MatchStatus } from "../types";
import { AlertTriangle, Crosshair, Shield, Zap, TrendingUp, Flag } from "lucide-react";

interface FieldHeatmapProps {
  match: FootballMatch;
}

interface ZoneData {
  id: string;
  label: string;
  x: number; // SVG x center
  y: number; // SVG y center
  w: number;
  h: number;
  homeIntensity: number; // 0-100 (home attacking pressure in this zone)
  awayIntensity: number; // 0-100 (away attacking pressure in this zone)
  riskLevel: "low" | "medium" | "high" | "critical";
  riskTeam: "home" | "away" | "both" | "none";
  description: string;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.clamp(t, 0, 1);
}

Math.clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function intensityToColor(intensity: number, team: "home" | "away", homeColor: string, awayColor: string): string {
  // Returns rgba
  const alpha = Math.clamp(intensity / 100, 0, 0.82);
  if (team === "home") {
    // Parse hex to rgb
    const r = parseInt(homeColor.slice(1, 3), 16);
    const g = parseInt(homeColor.slice(3, 5), 16);
    const b = parseInt(homeColor.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  } else {
    const r = parseInt(awayColor.slice(1, 3), 16);
    const g = parseInt(awayColor.slice(3, 5), 16);
    const b = parseInt(awayColor.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}

export function FieldHeatmap({ match }: FieldHeatmapProps) {
  const { homeTeam, awayTeam, stats, predictions, status, minute, homeScore, awayScore } = match;
  const homeColor = homeTeam.color || "#10b981";
  const awayColor = awayTeam.color || "#ef4444";

  // ── Compute stat-derived zone weights ──────────────────────────────────────
  const zones = useMemo((): ZoneData[] => {
    const xgHome = stats.xG[0] || 0;
    const xgAway = stats.xG[1] || 0;
    const cornersHome = stats.corners[0] || 0;
    const cornersAway = stats.corners[1] || 0;
    const shotsHome = stats.shotsOnTarget[0] || 0;
    const shotsAway = stats.shotsOnTarget[1] || 0;
    const possHome = stats.possession[0] || 50;
    const possAway = stats.possession[1] || 50;

    // Last momentum (positive = home dominates, negative = away dominates)
    const lastMom = stats.momentumHistory?.length
      ? stats.momentumHistory[stats.momentumHistory.length - 1]
      : 0;
    const avgMom = stats.momentumHistory?.length
      ? stats.momentumHistory.reduce((a, b) => a + b, 0) / stats.momentumHistory.length
      : 0;

    // Normalize xG per zone (corners → flanks, shots → central, possession → midfield)
    // Home attacks RIGHT → AWAY GOAL (right side of pitch)
    // Away attacks LEFT → HOME GOAL (left side of pitch)

    const homeFlankWeight = Math.clamp((cornersHome / Math.max(cornersHome + cornersAway, 1)) * 100 + (avgMom > 0 ? avgMom * 0.3 : 0), 0, 100);
    const awayFlankWeight = Math.clamp((cornersAway / Math.max(cornersHome + cornersAway, 1)) * 100 + (avgMom < 0 ? Math.abs(avgMom) * 0.3 : 0), 0, 100);
    const homeCentralWeight = Math.clamp((shotsHome / Math.max(shotsHome + shotsAway, 1)) * 100 + (xgHome * 15), 0, 100);
    const awayCentralWeight = Math.clamp((shotsAway / Math.max(shotsHome + shotsAway, 1)) * 100 + (xgAway * 15), 0, 100);
    const homePenaltyWeight = Math.clamp(xgHome * 22 + (lastMom > 30 ? lastMom * 0.5 : 0), 0, 100);
    const awayPenaltyWeight = Math.clamp(xgAway * 22 + (lastMom < -30 ? Math.abs(lastMom) * 0.5 : 0), 0, 100);
    const homeMidfieldWeight = Math.clamp(possHome * 0.8, 0, 80);
    const awayMidfieldWeight = Math.clamp(possAway * 0.8, 0, 80);

    // Pre-match: use prediction probs
    const factor = status === MatchStatus.PRE_MATCH ? 0.6 : 1.0;
    const preMomFactor = (predictions.winProbHome - predictions.winProbAway) / 100;

    const calcRisk = (homeI: number, awayI: number): { level: ZoneData["riskLevel"]; team: ZoneData["riskTeam"] } => {
      const max = Math.max(homeI, awayI);
      const team: ZoneData["riskTeam"] = homeI > awayI + 15 ? "home" : awayI > homeI + 15 ? "away" : homeI > 30 && awayI > 30 ? "both" : "none";
      const level: ZoneData["riskLevel"] = max >= 70 ? "critical" : max >= 50 ? "high" : max >= 30 ? "medium" : "low";
      return { level, team };
    };

    const pre = (v: number) => v * factor + (status === MatchStatus.PRE_MATCH ? preMomFactor * 20 : 0);

    // SVG viewBox is 200 x 130 (pitch proportions)
    const zoneList: Omit<ZoneData, "riskLevel" | "riskTeam">[] = [
      // ── AWAY GOAL AREA (right, home attacks here) ──
      {
        id: "home_penalty",
        label: "Área do Gol Adversário",
        x: 163, y: 47, w: 34, h: 36,
        homeIntensity: Math.clamp(pre(homePenaltyWeight), 0, 100),
        awayIntensity: Math.clamp(pre(awayPenaltyWeight * 0.25), 0, 100),
        description: `xG do ${homeTeam.shortName} na área: ${xgHome.toFixed(2)}. ${shotsHome} finalizações no alvo.`
      },
      // ── HOME GOAL AREA (left, away attacks here) ──
      {
        id: "away_penalty",
        label: "Área Defensiva",
        x: 3, y: 47, w: 34, h: 36,
        homeIntensity: Math.clamp(pre(homePenaltyWeight * 0.25), 0, 100),
        awayIntensity: Math.clamp(pre(awayPenaltyWeight), 0, 100),
        description: `xG do ${awayTeam.shortName} na área: ${xgAway.toFixed(2)}. ${shotsAway} finalizações no alvo.`
      },
      // ── HOME RIGHT FLANK (top-right) ──
      {
        id: "home_right_flank",
        label: "Flanco Direito (MEX)",
        x: 130, y: 8, w: 55, h: 32,
        homeIntensity: Math.clamp(pre(homeFlankWeight * 0.9), 0, 100),
        awayIntensity: Math.clamp(pre(awayFlankWeight * 0.3), 0, 100),
        description: `Escanteios ${homeTeam.shortName}: ${cornersHome}. Pressão ofensiva pelo flanco direito.`
      },
      // ── HOME LEFT FLANK (bottom-right) ──
      {
        id: "home_left_flank",
        label: "Flanco Esquerdo (MEX)",
        x: 130, y: 90, w: 55, h: 32,
        homeIntensity: Math.clamp(pre(homeFlankWeight * 0.75), 0, 100),
        awayIntensity: Math.clamp(pre(awayFlankWeight * 0.2), 0, 100),
        description: `Pressão pelo flanco esquerdo do ${homeTeam.shortName}. Cruzamentos para área.`
      },
      // ── AWAY LEFT FLANK (top-left) ──
      {
        id: "away_left_flank",
        label: "Flanco Esq (RSA)",
        x: 15, y: 8, w: 55, h: 32,
        homeIntensity: Math.clamp(pre(homeFlankWeight * 0.25), 0, 100),
        awayIntensity: Math.clamp(pre(awayFlankWeight * 0.85), 0, 100),
        description: `Escanteios ${awayTeam.shortName}: ${cornersAway}. Contra-ataques pelo flanco.`
      },
      // ── AWAY RIGHT FLANK (bottom-left) ──
      {
        id: "away_right_flank",
        label: "Flanco Dir (RSA)",
        x: 15, y: 90, w: 55, h: 32,
        homeIntensity: Math.clamp(pre(homeFlankWeight * 0.2), 0, 100),
        awayIntensity: Math.clamp(pre(awayFlankWeight * 0.7), 0, 100),
        description: `Flanco de contra-ataque do ${awayTeam.shortName}.`
      },
      // ── HOME CENTRAL ATTACK ──
      {
        id: "home_central_attack",
        label: "Meio Ofensivo",
        x: 118, y: 40, w: 44, h: 50,
        homeIntensity: Math.clamp(pre(homeCentralWeight * 0.85), 0, 100),
        awayIntensity: Math.clamp(pre(awayCentralWeight * 0.3), 0, 100),
        description: `Volume de jogo ofensivo do ${homeTeam.shortName} pela zona central.`
      },
      // ── AWAY CENTRAL ATTACK ──
      {
        id: "away_central_attack",
        label: "Meio Ofensivo",
        x: 38, y: 40, w: 44, h: 50,
        homeIntensity: Math.clamp(pre(homeCentralWeight * 0.3), 0, 100),
        awayIntensity: Math.clamp(pre(awayCentralWeight * 0.85), 0, 100),
        description: `Volume de transição ofensiva do ${awayTeam.shortName}.`
      },
      // ── MIDFIELD CENTER ──
      {
        id: "midfield",
        label: "Meio-Campo Central",
        x: 80, y: 35, w: 40, h: 60,
        homeIntensity: Math.clamp(pre(homeMidfieldWeight), 0, 100),
        awayIntensity: Math.clamp(pre(awayMidfieldWeight), 0, 100),
        description: `Posse: ${homeTeam.shortName} ${possHome}% / ${awayTeam.shortName} ${possAway}%.`
      },
    ];

    return zoneList.map(z => {
      const { level, team } = calcRisk(z.homeIntensity, z.awayIntensity);
      return { ...z, riskLevel: level, riskTeam: team };
    });
  }, [stats, predictions, status, homeTeam, awayTeam, minute]);

  // ── Weak point analysis ─────────────────────────────────────────────────────
  const weakPoints = useMemo(() => {
    const xgHome = stats.xG[0] || 0;
    const xgAway = stats.xG[1] || 0;
    const cornersHome = stats.corners[0] || 0;
    const cornersAway = stats.corners[1] || 0;
    const lastMom = stats.momentumHistory?.length
      ? stats.momentumHistory[stats.momentumHistory.length - 1] : 0;

    const points: { team: "home" | "away"; zone: string; risk: string; icon: string; detail: string }[] = [];

    // Home weak points (where away can score)
    if (xgAway > 0.8) points.push({ team: "away", zone: "Área Defensiva", risk: "Alto", icon: "⚠️", detail: `xG visitante alto (${xgAway.toFixed(2)}) — risco real na grande área` });
    if (cornersAway > 4) points.push({ team: "away", zone: "Bola Aérea Defensiva", risk: "Médio", icon: "🚩", detail: `${cornersAway} cantos do visitante — perigo em bolas paradas` });
    if (lastMom < -25) points.push({ team: "away", zone: "Contra-Ataque", risk: "Alto", icon: "⚡", detail: `Momentum atual negativo (${lastMom}) — visitante em pressão` });
    if (stats.possession[1] > 55) points.push({ team: "away", zone: "Meio-Campo Pressionado", risk: "Médio", icon: "🔄", detail: `Visitante com ${stats.possession[1]}% posse — domínio territorial` });

    // Away weak points (where home can score)
    if (xgHome > 0.8) points.push({ team: "home", zone: "Área Ofensiva", risk: "Alto", icon: "🎯", detail: `xG mandante alto (${xgHome.toFixed(2)}) — pressão constante na área` });
    if (cornersHome > 4) points.push({ team: "home", zone: "Bola Parada Ofensiva", risk: "Médio", icon: "🚩", detail: `${cornersHome} cantos do mandante — ameaça por bola parada` });
    if (lastMom > 25) points.push({ team: "home", zone: "Pressão Ofensiva", risk: "Alto", icon: "⚡", detail: `Momentum positivo (${lastMom}) — mandante empurrando` });
    if (stats.shotsOnTarget[0] > 4) points.push({ team: "home", zone: "Volume de Chutes", risk: "Alto", icon: "💥", detail: `${stats.shotsOnTarget[0]} finalizações no alvo — goleiro visitante trabalhado` });

    // Pre-match fallback
    if (status === MatchStatus.PRE_MATCH) {
      points.push({ team: "home", zone: "Ataque Central", risk: "Médio", icon: "🎯", detail: `Probabilidade de vitória mandante: ${predictions.winProbHome}%` });
      points.push({ team: "away", zone: "Contra-Ataque Rápido", risk: "Médio", icon: "⚡", detail: `Probabilidade de vitória visitante: ${predictions.winProbAway}%` });
    }

    return points.slice(0, 6);
  }, [stats, predictions, status]);

  const riskBorderColor = (level: ZoneData["riskLevel"]) => {
    if (level === "critical") return "#ef4444";
    if (level === "high") return "#f97316";
    if (level === "medium") return "#eab308";
    return "transparent";
  };

  const statusLabel = status === MatchStatus.PRE_MATCH
    ? "Projeção Pré-Jogo"
    : status === MatchStatus.LIVE
    ? (minute <= 45 ? `Análise 1º Tempo — ${minute}'` : `Análise 2º Tempo — ${minute}'`)
    : "Análise Final — Partida Completa";

  return (
    <div className="flex flex-col gap-4" id="field_heatmap_section">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-[#eab308]" />
          <h4 className="text-xs font-black text-white uppercase tracking-wider">
            Mapa de Calor — Movimentação & Pontos Fracos
          </h4>
        </div>
        <span className="text-[9px] font-mono text-[#10b981] bg-[#0c2415] px-2 py-0.5 rounded border border-[#1d4030] uppercase tracking-widest">
          {statusLabel}
        </span>
      </div>

      {/* SVG Football Pitch Heatmap */}
      <div className="relative rounded-2xl overflow-hidden border border-[#1a3028] shadow-2xl bg-[#081510]">
        <svg
          viewBox="0 0 200 130"
          className="w-full"
          style={{ display: "block" }}
        >
          <defs>
            {/* Pitch grass gradient */}
            <linearGradient id="pitch_grass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d2218" />
              <stop offset="50%" stopColor="#0a1c14" />
              <stop offset="100%" stopColor="#0d2218" />
            </linearGradient>
            {/* Alternating grass stripes */}
            <pattern id="grass_stripes" x="0" y="0" width="20" height="130" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="10" height="130" fill="#0a1a11" />
              <rect x="10" y="0" width="10" height="130" fill="#0c1e14" />
            </pattern>

            {/* Radial gradients for heat zones */}
            {zones.map(z => (
              <React.Fragment key={z.id}>
                <radialGradient id={`heat_home_${z.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={homeColor} stopOpacity={Math.clamp(z.homeIntensity / 100, 0, 0.85)} />
                  <stop offset="100%" stopColor={homeColor} stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`heat_away_${z.id}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={awayColor} stopOpacity={Math.clamp(z.awayIntensity / 100, 0, 0.85)} />
                  <stop offset="100%" stopColor={awayColor} stopOpacity="0" />
                </radialGradient>
              </React.Fragment>
            ))}
          </defs>

          {/* Base pitch */}
          <rect x="0" y="0" width="200" height="130" fill="url(#grass_stripes)" />

          {/* ── Pitch markings ── */}
          {/* Outline */}
          <rect x="3" y="5" width="194" height="120" fill="none" stroke="#1f4a30" strokeWidth="0.8" />
          {/* Center line */}
          <line x1="100" y1="5" x2="100" y2="125" stroke="#1f4a30" strokeWidth="0.6" strokeDasharray="3 2" />
          {/* Center circle */}
          <circle cx="100" cy="65" r="18" fill="none" stroke="#1f4a30" strokeWidth="0.6" />
          <circle cx="100" cy="65" r="1.2" fill="#1f4a30" />
          {/* Center spot */}
          <circle cx="100" cy="65" r="0.8" fill="#2a6040" />

          {/* HOME penalty area (right) */}
          <rect x="163" y="42" width="34" height="46" fill="none" stroke="#1f4a30" strokeWidth="0.6" />
          {/* HOME goal area (right) */}
          <rect x="180" y="53" width="17" height="24" fill="none" stroke="#1f4a30" strokeWidth="0.5" />
          {/* HOME goal posts (right) */}
          <rect x="197" y="57" width="3" height="16" fill="#0d2a1a" stroke="#2a6040" strokeWidth="0.5" />
          {/* HOME penalty spot (right) */}
          <circle cx="172" cy="65" r="0.8" fill="#2a6040" />
          {/* HOME penalty arc (right) */}
          <path d="M163,55 A15,15 0 0,0 163,75" fill="none" stroke="#1f4a30" strokeWidth="0.6" />

          {/* AWAY penalty area (left) */}
          <rect x="3" y="42" width="34" height="46" fill="none" stroke="#1f4a30" strokeWidth="0.6" />
          {/* AWAY goal area (left) */}
          <rect x="3" y="53" width="17" height="24" fill="none" stroke="#1f4a30" strokeWidth="0.5" />
          {/* AWAY goal posts (left) */}
          <rect x="0" y="57" width="3" height="16" fill="#0d2a1a" stroke="#2a6040" strokeWidth="0.5" />
          {/* AWAY penalty spot (left) */}
          <circle cx="28" cy="65" r="0.8" fill="#2a6040" />
          {/* AWAY penalty arc (left) */}
          <path d="M37,55 A15,15 0 0,1 37,75" fill="none" stroke="#1f4a30" strokeWidth="0.6" />

          {/* Corner circles */}
          {[[3, 5], [197, 5], [3, 125], [197, 125]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="3" fill="none" stroke="#1f4a30" strokeWidth="0.5" />
          ))}

          {/* ── Heat zones overlay ── */}
          {zones.map(z => {
            const dominant = z.homeIntensity >= z.awayIntensity ? "home" : "away";
            const maxI = Math.max(z.homeIntensity, z.awayIntensity);
            return (
              <g key={z.id}>
                {/* Home heat */}
                {z.homeIntensity > 5 && (
                  <ellipse
                    cx={z.x + z.w / 2}
                    cy={z.y + z.h / 2}
                    rx={z.w / 2}
                    ry={z.h / 2}
                    fill={`url(#heat_home_${z.id})`}
                  />
                )}
                {/* Away heat */}
                {z.awayIntensity > 5 && (
                  <ellipse
                    cx={z.x + z.w / 2}
                    cy={z.y + z.h / 2}
                    rx={z.w / 2}
                    ry={z.h / 2}
                    fill={`url(#heat_away_${z.id})`}
                  />
                )}
                {/* Risk border flash for critical zones */}
                {(z.riskLevel === "critical" || z.riskLevel === "high") && (
                  <ellipse
                    cx={z.x + z.w / 2}
                    cy={z.y + z.h / 2}
                    rx={z.w / 2 + 1}
                    ry={z.h / 2 + 1}
                    fill="none"
                    stroke={riskBorderColor(z.riskLevel)}
                    strokeWidth="0.6"
                    strokeDasharray="3 2"
                    opacity="0.6"
                  />
                )}
              </g>
            );
          })}

          {/* ── Team direction arrows ── */}
          {/* Home attacks right */}
          <g opacity="0.5">
            <line x1="108" y1="63" x2="125" y2="63" stroke={homeColor} strokeWidth="1" markerEnd="url(#arrow_home)" />
          </g>
          {/* Away attacks left */}
          <g opacity="0.5">
            <line x1="92" y1="67" x2="75" y2="67" stroke={awayColor} strokeWidth="1" markerEnd="url(#arrow_away)" />
          </g>

          <defs>
            <marker id="arrow_home" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
              <polygon points="0 0, 4 2, 0 4" fill={homeColor} opacity="0.7" />
            </marker>
            <marker id="arrow_away" markerWidth="4" markerHeight="4" refX="1" refY="2" orient="auto">
              <polygon points="4 0, 0 2, 4 4" fill={awayColor} opacity="0.7" />
            </marker>
          </defs>

          {/* ── Team labels ── */}
          <text x="162" y="136" textAnchor="middle" fontSize="5" fill={homeColor} fontFamily="monospace" fontWeight="bold" opacity="0.9">
            ▶ {homeTeam.shortName} ATACA
          </text>
          <text x="38" y="136" textAnchor="middle" fontSize="5" fill={awayColor} fontFamily="monospace" fontWeight="bold" opacity="0.9">
            {awayTeam.shortName} ATACA ◀
          </text>

          {/* Scoreboard overlay */}
          <rect x="80" y="1" width="40" height="11" rx="2" fill="#040a06" opacity="0.85" />
          <text x="100" y="9" textAnchor="middle" fontSize="6.5" fill="#eab308" fontFamily="monospace" fontWeight="bold">
            {homeTeam.shortName} {homeScore} - {awayScore} {awayTeam.shortName}
          </text>
        </svg>

        {/* Legend overlay bottom-right */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-1 bg-[#040a06]/80 rounded-lg px-2 py-1.5 border border-[#1a3028] backdrop-blur-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: homeColor, opacity: 0.8 }} />
            <span className="text-[8px] font-mono text-zinc-300">{homeTeam.shortName} pressão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: awayColor, opacity: 0.8 }} />
            <span className="text-[8px] font-mono text-zinc-300">{awayTeam.shortName} pressão</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 border border-red-500 rounded" style={{ borderStyle: "dashed" }} />
            <span className="text-[8px] font-mono text-zinc-400">zona crítica</span>
          </div>
        </div>
      </div>

      {/* ── Zones breakdown grid ── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          {
            label: `${homeTeam.shortName} — Intensidade por Zona`,
            color: homeColor,
            bars: [
              { name: "Área Adversária", val: zones.find(z => z.id === "home_penalty")?.homeIntensity ?? 0 },
              { name: "Ataque Central", val: zones.find(z => z.id === "home_central_attack")?.homeIntensity ?? 0 },
              { name: "Flanco Direito", val: zones.find(z => z.id === "home_right_flank")?.homeIntensity ?? 0 },
              { name: "Flanco Esquerdo", val: zones.find(z => z.id === "home_left_flank")?.homeIntensity ?? 0 },
              { name: "Meio-Campo", val: zones.find(z => z.id === "midfield")?.homeIntensity ?? 0 },
            ]
          },
          {
            label: `${awayTeam.shortName} — Intensidade por Zona`,
            color: awayColor,
            bars: [
              { name: "Área Adversária", val: zones.find(z => z.id === "away_penalty")?.awayIntensity ?? 0 },
              { name: "Ataque Central", val: zones.find(z => z.id === "away_central_attack")?.awayIntensity ?? 0 },
              { name: "Flanco Esquerdo", val: zones.find(z => z.id === "away_left_flank")?.awayIntensity ?? 0 },
              { name: "Flanco Direito", val: zones.find(z => z.id === "away_right_flank")?.awayIntensity ?? 0 },
              { name: "Meio-Campo", val: zones.find(z => z.id === "midfield")?.awayIntensity ?? 0 },
            ]
          }
        ].map((team, ti) => (
          <div key={ti} className="bg-[#0b1410] border border-[#16281f] rounded-xl p-3 flex flex-col gap-2">
            <span className="text-[9px] font-mono uppercase tracking-widest font-bold" style={{ color: team.color }}>
              {team.label}
            </span>
            {team.bars.map((bar, bi) => (
              <div key={bi} className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[8px] text-zinc-500 font-mono">
                  <span>{bar.name}</span>
                  <span className="font-bold" style={{ color: bar.val > 60 ? team.color : undefined }}>
                    {Math.round(bar.val)}%
                  </span>
                </div>
                <div className="h-1 bg-[#0e1a12] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${bar.val}%`, backgroundColor: team.color, opacity: 0.7 + bar.val / 300 }}
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Weak Points Analysis ── */}
      <div className="bg-[#0b1410] border border-[#16281f] rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-2 border-b border-[#14251a]">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs font-black text-white uppercase tracking-wider">Pontos Fracos Identificados</span>
        </div>

        {weakPoints.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {weakPoints.map((wp, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-[10px] ${
                  wp.team === "home"
                    ? "bg-emerald-950/20 border-emerald-900/40"
                    : "bg-rose-950/20 border-rose-900/40"
                }`}
              >
                <span className="text-sm leading-none mt-0.5 shrink-0">{wp.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="font-bold text-white truncate">{wp.zone}</span>
                    <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                      wp.risk === "Alto" ? "bg-red-900/50 text-red-300" :
                      wp.risk === "Médio" ? "bg-yellow-900/50 text-yellow-300" :
                      "bg-zinc-800 text-zinc-400"
                    }`}>
                      {wp.risk}
                    </span>
                  </div>
                  <p className="text-zinc-400 leading-snug">{wp.detail}</p>
                  <span className="text-[8px] font-mono mt-1 block" style={{ color: wp.team === "home" ? homeColor : awayColor }}>
                    {wp.team === "home" ? `↗ Perigo via ${homeTeam.name}` : `↙ Perigo via ${awayTeam.name}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-500 italic font-mono text-center py-2">
            Aguardando dados de jogo para identificar pontos fracos...
          </p>
        )}
      </div>

      {/* ── Tactical Summary ── */}
      <div className="flex items-start gap-2.5 p-3 bg-[#0d1a13] border border-[#1a3025] rounded-xl text-[10px] text-zinc-300 leading-relaxed">
        <Zap className="w-4 h-4 text-[#eab308] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#eab308] block mb-1">Leitura Tática do Campo:</strong>
          <p>
            {(() => {
              const xgH = stats.xG[0] || 0;
              const xgA = stats.xG[1] || 0;
              const mom = stats.momentumHistory?.length
                ? stats.momentumHistory[stats.momentumHistory.length - 1] : 0;
              const cornH = stats.corners[0] || 0;
              const cornA = stats.corners[1] || 0;

              if (status === MatchStatus.PRE_MATCH) {
                return `Análise pré-jogo projetada baseada nas probabilidades do modelo. ${homeTeam.name} com ${predictions.winProbHome}% de favoritismo, espera-se pressão central e pelos flancos como principais rotas de gol.`;
              }
              if (xgH > xgA * 1.5 && mom > 0) {
                return `${homeTeam.name} domina o campo de forma clara — xG superior (${xgH.toFixed(2)} vs ${xgA.toFixed(2)}) e momentum positivo (${mom}). A defesa do ${awayTeam.name} está comprimida, com os flancos como ponto mais vulnerável para a invasão mandante.`;
              }
              if (xgA > xgH * 1.5 && mom < 0) {
                return `${awayTeam.name} surpreende com pressão alta — xG elevado (${xgA.toFixed(2)}) e momentum favorável (${mom}). O ${homeTeam.name} cede espaço pelas costas da defesa, especialmente no corredor central.`;
              }
              if (cornH + cornA > 8) {
                return `Jogo com alto volume de bolas paradas — ${cornH + cornA} escanteios no total. Os flancos são os corredores de maior perigo para ambas as equipes, com escanteios criando oportunidades aéreas frequentes.`;
              }
              return `Partida equilibrada com as equipes se anulando no meio-campo. ${homeTeam.name} com ${stats.possession[0]}% de posse, ${awayTeam.name} apostando em transições rápidas. A decisão deve passar pelas bolas paradas e pelos flancos.`;
            })()}
          </p>
        </div>
      </div>
    </div>
  );
}
