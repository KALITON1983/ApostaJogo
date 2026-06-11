import React, { useState } from "react";
import { FootballMatch, MatchStatus, H2HMatch } from "../types";
import { 
  TrendingUp, Activity, BarChart2, ShieldAlert, BadgeInfo, Zap, 
  HelpCircle, Calendar, Sparkles, MessageSquare, AlertCircle, FileText, Map
} from "lucide-react";
import { FieldHeatmap } from "./FieldHeatmap";

interface AIPredictionDetailsProps {
  match: FootballMatch;
  logs: string[];
  onGoLive?: (matchId: string) => void;
}

export function AIPredictionDetails({ match, logs, onGoLive }: AIPredictionDetailsProps) {
  const [activeTab, setActiveTab] = useState<"predictions" | "live_stats" | "pre_match" | "field_map">("predictions");

  const { homeTeam, awayTeam, stats, predictions, h2h, status, minute, homeScore, awayScore } = match;

  // Set default tab on match change
  React.useEffect(() => {
    if (status === MatchStatus.PRE_MATCH) {
      setActiveTab("predictions");
    }
  }, [match.id, status]);

  // Helper colors
  const homeColor = homeTeam.color || "#ef4444";
  const awayColor = awayTeam.color || "#22c55e";

  // Quick formatter
  const formatProb = (val: number) => `${Math.round(val)}`;

  // Form bubbles helper
  const renderForm = (form: string[]) => {
    return (
      <div className="flex gap-1.5">
        {form.map((f, i) => {
          let bg = "bg-gray-700 text-gray-200";
          if (f === "W") bg = "bg-emerald-600 text-white font-black";
          if (f === "L") bg = "bg-red-600 text-white font-black";
          if (f === "D") bg = "bg-yellow-600 text-white font-black";
          return (
            <span
              key={i}
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono shadow-md shadow-black/30`}
              style={{ backgroundColor: f === "W" ? "#10b981" : f === "L" ? "#ef4444" : f === "D" ? "#d97706" : undefined }}
            >
              {f}
            </span>
          );
        })}
      </div>
    );
  };

  // Safe division for comparative bars
  const getPct = (val1: number, val2: number) => {
    const total = val1 + val2;
    if (total === 0) return 50;
    return (val1 / total) * 100;
  };

  return (
    <div className="bg-[#070b09] rounded-3xl border border-[#14231b] overflow-hidden shadow-2xl flex flex-col h-full" id={`details_match_${match.id}`}>
      
      {/* Match Scoreboard Hero */}
      <div className="p-6 bg-gradient-to-b from-[#0b1410] to-[#070b09] border-b border-[#122119] relative">
        {/* League Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono text-[#10b981] font-bold tracking-wider uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#eab308] animate-pulse"></span>
            {match.leagueName}
          </span>
          
          {/* Status Badge */}
          {status === MatchStatus.LIVE ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 font-mono text-[10px] font-extrabold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
              {status} • {minute}'
            </div>
          ) : status === MatchStatus.FINISHED ? (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-gray-900 border border-gray-700 text-gray-400 font-mono text-[10px] font-medium tracking-wide uppercase">
              {status}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-950/20 border border-amber-500/40 text-amber-500 font-mono text-[10px] font-bold tracking-wide uppercase">
              {match.startTime || status}
            </div>
          )}
        </div>

        {/* Dynamic Teams vs Display */}
        <div className="grid grid-cols-5 items-center gap-2 my-2">
          {/* Home Team */}
          <div className="col-span-2 text-right flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-white text-base md:text-lg tracking-tight hover:text-[#10b981] transition-colors">
                {homeTeam.name}
              </span>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: homeColor }}></div>
            </div>
            <span className="text-xs text-gray-400 font-mono text-zinc-400">Position: {homeTeam.leaguePosition}º</span>
          </div>

          {/* Core Score Display */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            {status !== MatchStatus.PRE_MATCH ? (
              <div className="flex items-center gap-2 bg-[#0d1612] px-4 py-2.5 rounded-xl border border-[#1b2f24] font-mono text-white text-2xl font-black shadow-inner shadow-black/80">
                <span style={{ color: homeColor }}>{homeScore}</span>
                <span className="text-gray-600 text-lg">:</span>
                <span style={{ color: awayColor }}>{awayScore}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="font-mono text-xs font-bold text-[#eab308] bg-[#1a2d24] px-2.5 py-1 rounded border border-[#233d30] shadow-inner">
                  VS
                </div>
                <span className="text-[9px] text-gray-500 mt-1 font-mono">MODELO PRONTO</span>
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="col-span-2 text-left flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: awayColor }}></div>
              <span className="font-extrabold text-white text-base md:text-lg tracking-tight hover:text-[#ebd008] transition-colors">
                {awayTeam.name}
              </span>
            </div>
            <span className="text-xs text-gray-400 font-mono text-zinc-400">Position: {awayTeam.leaguePosition}º</span>
          </div>
        </div>
      </div>

      {/* Tabs Custom selector */}
      <div className="flex border-b border-[#122119] bg-[#090f0c] p-1 gap-1">
        <button
          onClick={() => setActiveTab("predictions")}
          className={`flex-1 py-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "predictions"
              ? "bg-[#10b981] text-[#070b09] shadow-md shadow-emerald-900/10"
              : "text-gray-400 hover:text-white hover:bg-[#0c1410]"
          }`}
          id="tab_opt_predictions"
        >
          <Sparkles className="w-3.8 h-3.8" />
          <span>Previsões da IA</span>
        </button>

        {status !== MatchStatus.PRE_MATCH && (
          <button
            onClick={() => setActiveTab("live_stats")}
            className={`flex-1 py-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "live_stats"
                ? "bg-[#10b981] text-[#070b09] shadow-md shadow-emerald-900/10"
                : "text-gray-400 hover:text-white hover:bg-[#0c1410]"
            }`}
            id="tab_opt_live_stats"
          >
            <Activity className="w-3.8 h-3.8" />
            <span>Dados em Tempo Real</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab("field_map")}
          className={`flex-1 py-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "field_map"
              ? "bg-[#10b981] text-[#070b09] shadow-md shadow-emerald-900/10"
              : "text-gray-400 hover:text-white hover:bg-[#0c1410]"
          }`}
          id="tab_opt_field_map"
        >
          <Map className="w-3.8 h-3.8" />
          <span>Mapa Tático</span>
        </button>

        <button
          onClick={() => setActiveTab("pre_match")}
          className={`flex-1 py-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === "pre_match"
              ? "bg-[#10b981] text-[#070b09] shadow-md shadow-emerald-900/10"
              : "text-gray-400 hover:text-white hover:bg-[#0c1410]"
          }`}
          id="tab_opt_pre_match"
        >
          <BarChart2 className="w-3.8 h-3.8" />
          <span>Ficha Pré-Jogo</span>
        </button>
      </div>

      {/* Scrollable Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-emerald-900 select-none">
        
        {/* TAB: FIELD HEATMAP */}
        {activeTab === "field_map" && (
          <FieldHeatmap match={match} />
        )}

        {/* TAB 1: PREDICTIONS */}
        {activeTab === "predictions" && (
          <div className="flex flex-col gap-6">
            
            {status === MatchStatus.PRE_MATCH && onGoLive && (
              <div className="bg-[#0b1b14] border-2 border-dashed border-[#10b981]/40 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl select-none" id="activation_live_banner">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 bg-[#092b1b] rounded-xl text-[#10b981] animate-pulse">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Ativar Placar em Tempo Real</h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed max-w-sm">Esta partida de estreia está agendada como Pré-Jogo. Clique ao lado para iniciar a simulação tática e acompanhar lances em tempo real instantaneamente!</p>
                  </div>
                </div>
                <button
                  onClick={() => onGoLive(match.id)}
                  className="px-4 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:scale-[1.03] text-[#070b09] font-black text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-950/40 shrink-0"
                >
                  📡 Começar Tempo Real
                </button>
              </div>
            )}

            {/* Confidence & Win/Draw/Away Prob Stacked Slide */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-[#0d1612] border border-[#14261d] rounded-2xl p-5">
              <div className="col-span-1 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-[#1b2f24] pb-4 md:pb-0 md:pr-4">
                <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Confiança IA</span>
                <div className="relative flex items-center justify-center mt-2 w-16 h-16 rounded-full border-4 border-dashed border-[#eab308]/40 animate-spin-slow">
                  <span className="absolute animate-none font-mono text-lg font-black text-[#eab308]">
                    {predictions.confidenceRating}%
                  </span>
                </div>
              </div>

              <div className="col-span-3 flex flex-col justify-center gap-2.5">
                <span className="text-[11px] text-gray-300 font-mono font-semibold uppercase tracking-wide">
                  Probabilidade de Resultado Regulamentar (1X2)
                </span>

                {/* Styled multi-segment full range bar */}
                <div className="w-full h-7 rounded-lg overflow-hidden flex font-mono text-xs font-extrabold select-none shadow-md shadow-black/40">
                  <div 
                    title={`Vitória do ${homeTeam.name}`}
                    className="h-full flex items-center justify-center text-[#070b09] transition-all duration-700 min-w-8"
                    style={{ backgroundColor: homeColor, width: `${predictions.winProbHome}%` }}
                  >
                    {predictions.winProbHome > 15 ? `${formatProb(predictions.winProbHome)}%` : ""}
                  </div>
                  <div 
                    title="Empate"
                    className="h-full bg-zinc-600 text-white flex items-center justify-center transition-all duration-700 min-w-8"
                    style={{ width: `${predictions.drawProb}%` }}
                  >
                    {predictions.drawProb > 15 ? `${formatProb(predictions.drawProb)}%` : ""}
                  </div>
                  <div 
                    title={`Vitória do ${awayTeam.name}`}
                    className="h-full flex items-center justify-center text-white transition-all duration-700 min-w-8"
                    style={{ backgroundColor: awayColor, width: `${predictions.winProbAway}%` }}
                  >
                    {predictions.winProbAway > 15 ? `${formatProb(predictions.winProbAway)}%` : ""}
                  </div>
                </div>

                {/* Legends */}
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: homeColor }}></span>
                    {homeTeam.shortName || homeTeam.name}: {formatProb(predictions.winProbHome)}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-zinc-600"></span>
                    Empate: {formatProb(predictions.drawProb)}%
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: awayColor }}></span>
                    {awayTeam.shortName || awayTeam.name}: {formatProb(predictions.winProbAway)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Badges / Hot Tips Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#0b1410] border border-[#14251c] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Mais de 2.5 Gols</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">Over 2.5</span>
                  <span className="text-sm font-mono font-black text-[#eab308] bg-[#231b08] px-1.5 py-0.5 rounded">
                    {predictions.over25Prob}%
                  </span>
                </div>
              </div>

              <div className="bg-[#0b1410] border border-[#14251c] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Ambos Marcam</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-lg font-bold text-white">BTTS</span>
                  <span className="text-sm font-mono font-black text-[#eab308] bg-[#231b08] px-1.5 py-0.5 rounded">
                    {predictions.bothToScoreProb}%
                  </span>
                </div>
              </div>

              <div className="bg-[#0b1410] border border-[#14251c] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Próximo Gol previsto</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-xs font-bold text-gray-300">
                    {predictions.nextGoalTeam === "HOME" ? homeTeam.name : predictions.nextGoalTeam === "AWAY" ? awayTeam.name : "Nenhum GOL"}
                  </span>
                  <span className="text-sm font-mono font-black text-[#10b981] bg-[#0c2419] px-1.5 py-0.5 rounded">
                    {predictions.nextGoalProb}%
                  </span>
                </div>
              </div>
            </div>

            {/* Placar Provável final scores aligned beautifully */}
            <div className="flex flex-col gap-2 bg-[#0a100d] border border-[#112117] rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-4 h-4 text-[#eab308]" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Projeção do Placar Exato</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {predictions.probableScores.map((sc, idx) => (
                  <div key={idx} className="bg-[#0f1b14] border border-[#192f23] rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 font-mono block">Cenário {idx + 1}</span>
                      <strong className="text-sm font-bold text-white tracking-widest">{sc.score}</strong>
                    </div>
                    <span className="text-xs font-mono font-extrabold text-[#eab308] bg-[#231e0b] px-2 py-1 rounded">
                      {sc.probability}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Custom Technical commentary */}
            <div className="bg-[#0a100d] border border-[#112117] rounded-3xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-[#10b981]/5 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#10b981]" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Análise Tática do Modelo Neural</h4>
              </div>

              <p className="text-xs text-stone-300 leading-relaxed text-justify">
                {predictions.detailedAnalysis}
              </p>

              <div className="mt-4 p-3 bg-[#1d3528]/30 border border-[#2d563f] rounded-xl flex gap-2">
                <span className="text-sm">💡</span>
                <div>
                  <strong className="text-xs font-extrabold text-[#10b981] block">Indicação Dinâmica de Entrada:</strong>
                  <p className="text-[11px] text-zinc-300 leading-normal mt-0.5">{predictions.tacticalRecommendation}</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: LIVE STATS */}
        {activeTab === "live_stats" && stats && (() => {
          // Proximidade de Gol calculation logic during Live match
          const lastMomentum = stats.momentumHistory && stats.momentumHistory.length > 0 
            ? stats.momentumHistory[stats.momentumHistory.length - 1] 
            : 0;
          
          let closestTeam: "home" | "away" | "none" = "none";
          let proximityScoreHome = 50;
          let proximityScoreAway = 50;
          let proximityLabel = "Equilíbrio Tático";
          let proximityDescription = "A partida está equilibrada sob controle mútuo no círculo de meio-campo.";

          if (status === MatchStatus.LIVE) {
            if (lastMomentum > 35) {
              closestTeam = "home";
              proximityScoreHome = Math.min(98, 75 + Math.round((lastMomentum - 35) * 0.3) + Math.min(20, Math.round(stats.xG[0] * 10)));
              proximityScoreAway = Math.max(2, 25 - Math.round((lastMomentum - 35) * 0.2));
              proximityLabel = `Pressão Esmagadora do ${homeTeam.name}`;
              proximityDescription = `${homeTeam.name} está sufocando as linhas defensivas adversárias com triangulações intensas e infiltrações na área. Finalizações frequentes e perigo de gol iminente!`;
            } else if (lastMomentum > 12) {
              closestTeam = "home";
              proximityScoreHome = Math.min(85, 60 + Math.round((lastMomentum - 12) * 0.5) + Math.min(15, Math.round(stats.xG[0] * 8)));
              proximityScoreAway = Math.max(15, 30 - Math.round((lastMomentum - 12) * 0.4));
              proximityLabel = `${homeTeam.name} Mais Próximo do Gol`;
              proximityDescription = `${homeTeam.name} controla o ritmo do ataque e cria boas chances pelas pontas, rondando a intermediária com frequência.`;
            } else if (lastMomentum < -35) {
              closestTeam = "away";
              proximityScoreAway = Math.min(98, 75 + Math.round((Math.abs(lastMomentum) - 35) * 0.3) + Math.min(20, Math.round(stats.xG[1] * 10)));
              proximityScoreHome = Math.max(2, 25 - Math.round((Math.abs(lastMomentum) - 35) * 0.2));
              proximityLabel = `Pressão Esmagadora do ${awayTeam.name}`;
              proximityDescription = `${awayTeam.name} empurra as linhas de ${homeTeam.name} para o próprio quadrado penal. O goleiro mandante trabalha sob constante risco de sofrer gols.`;
            } else if (lastMomentum < -12) {
              closestTeam = "away";
              proximityScoreAway = Math.min(85, 60 + Math.round((Math.abs(lastMomentum) - 12) * 0.5) + Math.min(15, Math.round(stats.xG[1] * 8)));
              proximityScoreHome = Math.max(15, 30 - Math.round((Math.abs(lastMomentum) - 12) * 0.4));
              proximityLabel = `${awayTeam.name} Mais Próximo do Gol`;
              proximityDescription = `${awayTeam.name} ganha volume nas transições ofensivas e ameaça o placar de forma constante, se infiltrando na grande área mandante.`;
            } else {
              closestTeam = "none";
              proximityScoreHome = 50;
              proximityScoreAway = 50;
              proximityLabel = "Disputa de Meio-Campo";
              proximityDescription = "Jogo concentrado no círculo central. Ambas as defesas trabalham de forma coordenada, minimizando as infiltrações no último terço de campo.";
            }
          } else if (status === MatchStatus.FINISHED) {
            // Calculate based on the average momentum and final stats of the match
            const avgMomentum = stats.momentumHistory && stats.momentumHistory.length > 0
              ? stats.momentumHistory.reduce((a, b) => a + b, 0) / stats.momentumHistory.length
              : 0;
            
            proximityLabel = "Partida Encerrada";
            proximityDescription = "O confronto tático foi concluído sob placar final estabelecido.";
            
            if (avgMomentum > 15) {
              closestTeam = "home";
              proximityScoreHome = Math.min(95, 60 + Math.round((avgMomentum - 15) * 0.5) + Math.min(15, Math.round(stats.xG[0] * 8)));
              proximityScoreAway = Math.max(5, 30 - Math.round((avgMomentum - 15) * 0.4));
            } else if (avgMomentum < -15) {
              closestTeam = "away";
              proximityScoreAway = Math.min(95, 60 + Math.round((Math.abs(avgMomentum) - 15) * 0.5) + Math.min(15, Math.round(stats.xG[1] * 8)));
              proximityScoreHome = Math.max(5, 30 - Math.round((Math.abs(avgMomentum) - 15) * 0.4));
            } else {
              closestTeam = "none";
              const xgPct = getPct(stats.xG[0], stats.xG[1]);
              proximityScoreHome = Math.round(xgPct);
              proximityScoreAway = Math.round(100 - xgPct);
            }
          } else {
            proximityLabel = "Aguardando Apito Inicial";
            proximityDescription = "Estatísticas em tempo real e medidor de pressão de gol estarão disponíveis assim que a bola rolar.";
            const totalProb = predictions.winProbHome + predictions.winProbAway;
            if (totalProb > 0) {
              proximityScoreHome = Math.round((predictions.winProbHome / totalProb) * 100);
              proximityScoreAway = Math.round((predictions.winProbAway / totalProb) * 100);
            } else {
              proximityScoreHome = 50;
              proximityScoreAway = 50;
            }
          }

          return (
            <div className="flex flex-col gap-6">
              
              {/* GOAL PROXIMITY REAL-TIME ANALYSIS CARD */}
              <div className="bg-[#0b1410] border-2 border-emerald-950 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981]/5 rounded-full blur-xl pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
                    </span>
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">
                      Análise de Proximidade do Gol (Pressão AI)
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-[#eab308] font-bold bg-[#26210f] px-2.5 py-0.5 rounded border border-[#3b3318]">
                    {status === MatchStatus.LIVE ? "Mapeando Campo" : "Calculado"}
                  </span>
                </div>

                {/* Mercury Thermometer Bar Meters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center mb-4">
                  {/* Home Proximity Termometer */}
                  <div className="md:col-span-4 flex flex-col gap-1 text-right">
                    <span className="text-xs font-bold text-zinc-100 flex items-center justify-end gap-1.5">
                      {homeTeam.name}
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: homeColor }}></span>
                    </span>
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-full bg-[#122119] h-2.5 rounded-full overflow-hidden flex justify-end">
                        <div 
                          className="h-full rounded-full transition-all duration-700 bg-gradient-to-l from-emerald-500 to-teal-600" 
                          style={{ width: `${proximityScoreHome}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-xs font-black text-[#10b981] min-w-[30px]">
                        {proximityScoreHome}%
                      </span>
                    </div>
                  </div>

                  {/* VS / Core Danger Hub */}
                  <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-2 rounded-xl bg-[#070b09] border border-[#14231b] shadow-inner">
                    <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest block mb-0.5">Veredito do Jogo</span>
                    <strong className={`text-[13px] font-black uppercase tracking-tight ${
                      closestTeam === "home" ? "text-emerald-400" : closestTeam === "away" ? "text-red-400" : "text-[#eab308]"
                    }`}>
                      {proximityLabel}
                    </strong>
                  </div>

                  {/* Away Proximity Termometer */}
                  <div className="md:col-span-4 flex flex-col gap-1 text-left">
                    <span className="text-xs font-bold text-zinc-100 flex items-center justify-start gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: awayColor }}></span>
                      {awayTeam.name}
                    </span>
                    <div className="flex items-center justify-start gap-2">
                      <span className="font-mono text-xs font-black text-rose-500 min-w-[30px]">
                        {proximityScoreAway}%
                      </span>
                      <div className="w-full bg-[#122119] h-2.5 rounded-full overflow-hidden flex justify-start">
                        <div 
                          className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-rose-500 to-amber-600" 
                          style={{ width: `${proximityScoreAway}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom AI Description of proximity */}
                <div className="p-3 bg-[#0d1612] border border-[#192b1f] rounded-xl flex items-start gap-2.5">
                  <span className="text-base select-none leading-none">🎯</span>
                  <p className="text-[11px] text-zinc-300 leading-normal select-text">
                    {proximityDescription}
                  </p>
                </div>
              </div>

              {/* Dynamic Comparative bars */}
              <div className="flex flex-col gap-4">
              
              {/* xG Meter (Expected Goals) */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono text-gray-400">xG: {stats.xG[0]}</span>
                  <span className="font-bold text-white uppercase text-[10px] tracking-widest">Expected Goals (Gols Esperados)</span>
                  <span className="font-mono text-gray-400">xG: {stats.xG[1]}</span>
                </div>
                <div className="w-full bg-[#122119] rounded-full h-2 overflow-hidden flex">
                  <div className="h-full rounded-l transition-all duration-500" style={{ backgroundColor: homeColor, width: `${pctOfTotal(stats.xG[0], stats.xG[1])}%` }}></div>
                  <div className="h-full rounded-r transition-all duration-500" style={{ backgroundColor: awayColor, width: `${100 - pctOfTotal(stats.xG[0], stats.xG[1])}%` }}></div>
                </div>
              </div>

              {/* Possession Meter */}
              <div className="flex flex-col gap-1 mt-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className="font-mono font-bold text-white" style={{ color: homeColor }}>{stats.possession[0]}%</span>
                  <span className="font-bold text-gray-400 uppercase text-[10px] tracking-widest">Posse de Bola</span>
                  <span className="font-mono font-bold text-white" style={{ color: awayColor }}>{stats.possession[1]}%</span>
                </div>
                <div className="w-full bg-[#122119] rounded-full h-2 overflow-hidden flex">
                  <div className="h-full rounded-l transition-all duration-500" style={{ backgroundColor: homeColor, width: `${stats.possession[0]}%` }}></div>
                  <div className="h-full rounded-r transition-all duration-500" style={{ backgroundColor: awayColor, width: `${stats.possession[1]}%` }}></div>
                </div>
              </div>

              {/* Grid of secondary statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                {[
                  { label: "Chutes ao gol", h: stats.shotsOnTarget[0], a: stats.shotsOnTarget[1] },
                  { label: "Escanteios", h: stats.corners[0], a: stats.corners[1] },
                  { label: "Cartões Amarelos", h: stats.yellowCards[0], a: stats.yellowCards[1], colorCode: "yellow" },
                  { label: "Cartões Vermelhos", h: stats.redCards[0], a: stats.redCards[1], colorCode: "red" }
                ].map((st, i) => (
                  <div key={i} className="bg-[#0b1410] border border-[#14251c] rounded-xl p-3 flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wide">{st.label}</span>
                    <div className="flex items-center gap-2.5 mt-2 font-mono text-base font-extrabold text-white">
                      <span style={{ color: homeColor }}>{st.h}</span>
                      <span className="text-gray-600 text-xs">-</span>
                      <span style={{ color: awayColor }}>{st.a}</span>
                    </div>
                    {/* Visual mini-bar comparison */}
                    <div className="w-12 bg-zinc-800 h-1.5 rounded-full overflow-hidden flex mt-2.5">
                      <div className="h-full" style={{ backgroundColor: homeColor, width: `${getPct(st.h, st.a)}%` }}></div>
                      <div className="h-full" style={{ backgroundColor: awayColor, width: `${100 - getPct(st.h, st.a)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* PARTIDA MOMENTUM WAVE GRAPH (SVG) */}
            <div className="bg-[#0a100d] border border-[#112117] rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#eab308]" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Momentum da Partida (Pressão Dinâmica)</h4>
                </div>
                <span className="text-[9px] font-mono text-[#09c07b] bg-[#0f2a1f] px-2 py-0.5 rounded">Home: Dominando (+)</span>
              </div>

              {/* Graphic area */}
              <div className="w-full bg-[#080d0a] rounded-xl border border-[#111f16] h-36 flex items-center justify-center p-2 relative overflow-hidden select-none">
                
                {/* Baseline central line (equilibrium) */}
                <div className="absolute left-0 right-0 h-[1px] bg-dashed bg-zinc-800" style={{ borderTop: "1px dashed #3f3f46", opacity: 0.3 }}></div>

                {stats.momentumHistory && stats.momentumHistory.length > 1 ? (
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <defs>
                      <linearGradient id="gradient-momentum" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#10b981" stopOpacity="0" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid columns */}
                    <line x1="20" y1="0" x2="20" y2="100" stroke="#1d2d24" strokeWidth="0.25" strokeDasharray="3" />
                    <line x1="40" y1="0" x2="40" y2="100" stroke="#1d2d24" strokeWidth="0.25" strokeDasharray="3" />
                    <line x1="60" y1="0" x2="60" y2="100" stroke="#1d2d24" strokeWidth="0.25" strokeDasharray="3" />
                    <line x1="80" y1="0" x2="80" y2="100" stroke="#1d2d24" strokeWidth="0.25" strokeDasharray="3" />

                    {/* Shaded Area of momentum */}
                    <path
                      d={generateAreaPath(stats.momentumHistory)}
                      fill="url(#gradient-momentum)"
                    />
                    
                    {/* Flow Line of momentum */}
                    <path
                      d={generateLinePath(stats.momentumHistory)}
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />

                    {/* Glow dot on last point */}
                    {(() => {
                      const len = stats.momentumHistory.length;
                      const lastVal = stats.momentumHistory[len - 1];
                      const x = 96;
                      const y = 50 - (lastVal / 2); // Map -100..100 to 100..0
                      return (
                        <circle cx={x} cy={y} r="2" fill="#eab308" filter="drop-shadow(0 0 4px #eab308)">
                          <animate attributeName="r" values="1.5;3;1.5" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      );
                    })()}
                  </svg>
                ) : (
                  <span className="text-gray-500 text-xs font-mono">Processando flutuações táticas...</span>
                )}

                {/* Floating labels */}
                <div className="absolute top-2 left-2 text-[8px] font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded">
                  Ataque {homeTeam.shortName}
                </div>
                <div className="absolute bottom-2 left-2 text-[8px] font-mono text-red-400 bg-red-950/40 px-1 py-0.5 rounded">
                  Ataque {awayTeam.shortName}
                </div>
              </div>

              <p className="text-[10px] text-gray-500 italic mt-1 leading-relaxed">
                As flutuações horizontais indicam o volume de perigo criado em tempo real. Picos sugerem chutes qualificados ou sequências de passes na área adversária.
              </p>
            </div>

            {/* LIVE COMMENTARY LOGS (Ticker feed) */}
            <div className="bg-[#0a100d] border border-[#112117] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded bg-red-500 animate-pulse"></span>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Cronologia Tática de Eventos</h4>
              </div>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
                {logs && logs.length > 0 ? (
                  logs.map((log, lidx) => (
                    <div key={lidx} className="flex gap-2 text-xs border-b border-[#122119] pb-1.5 last:border-0">
                      <span className="text-[#eab308] font-semibold whitespace-nowrap">⚽</span>
                      <span className="text-gray-300 font-mono text-[11px] leading-relaxed select-text">{log}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs italic text-center py-4 font-mono">Sem lances relevantes anotados nesta etapa da análise.</span>
                )}
              </div>
            </div>

          </div>
          );
        })()}

        {/* TAB 3: PRE_MATCH FICHA */}
        {activeTab === "pre_match" && (
          <div className="flex flex-col gap-6">
            
            {/* Form and Stats Comparative */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home */}
              <div className="bg-[#0b1410] border border-[#14251c] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: homeColor }}></div>
                  <strong className="text-xs font-bold text-white uppercase">{homeTeam.name}</strong>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between border-b border-[#14241d] pb-1">
                    <span className="text-gray-400">Forma Recente</span>
                    {renderForm(homeTeam.form)}
                  </div>
                  <div className="flex justify-between border-b border-[#14241d] pb-1">
                    <span className="text-gray-400">Média Gols Pró</span>
                    <strong className="text-white font-mono">{homeTeam.avgGoalsScored} / jogo</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#14241d] pb-1">
                    <span className="text-gray-400">Média Gols Contra</span>
                    <strong className="text-white font-mono">{homeTeam.avgGoalsConceded} / jogo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Aprov. Mandante</span>
                    <strong className="text-emerald-400 font-mono">{homeTeam.homeWinRate}%</strong>
                  </div>
                </div>
              </div>

              {/* Away */}
              <div className="bg-[#0b1410] border border-[#14251c] rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded" style={{ backgroundColor: awayColor }}></div>
                  <strong className="text-xs font-bold text-white uppercase">{awayTeam.name}</strong>
                </div>

                <div className="flex flex-col gap-2 text-xs">
                  <div className="flex justify-between border-b border-[#14241d] pb-1">
                    <span className="text-gray-400">Forma Recente</span>
                    {renderForm(awayTeam.form)}
                  </div>
                  <div className="flex justify-between border-b border-[#14241d] pb-1">
                    <span className="text-gray-400">Média Gols Pró</span>
                    <strong className="text-white font-mono">{awayTeam.avgGoalsScored} / jogo</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#14241d] pb-1">
                    <span className="text-gray-400">Média Gols Contra</span>
                    <strong className="text-white font-mono">{awayTeam.avgGoalsConceded} / jogo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Aprov. Visitante</span>
                    <strong className="text-emerald-400 font-mono">{awayTeam.awayWinRate}%</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct H2H list */}
            <div className="bg-[#0a100d] border border-[#112117] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#eab308]" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Histórico Recente de Confrontos (H2H)</h4>
              </div>

              <div className="flex flex-col gap-2.5">
                {h2h && h2h.length > 0 ? (
                  h2h.map((h, hidx) => (
                    <div key={hidx} className="bg-[#0f1b14] border border-[#182e21] rounded-xl p-3 flex justify-between items-center text-xs">
                      <span className="text-gray-400 font-mono text-[10px]">{h.date}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-white">{h.homeTeam}</span>
                        <span className="bg-[#0a0f0d] px-2.5 py-1 rounded font-mono font-bold text-[#eab308] border border-[#112217]">
                          {h.homeScore} - {h.awayScore}
                        </span>
                        <span className="font-semibold text-zinc-300">{h.awayTeam}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <span className="text-gray-500 text-xs italic text-center py-2 font-mono">Nenhum registro de H2H encontrado para essas duas marcas.</span>
                )}
              </div>
            </div>

            {/* Injuries and physical situation box */}
            <div className="bg-[#0a100d] border border-[#112117] rounded-3xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Boletim Esportivo & Desfalques</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Home Injuries */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest block border-b border-red-950/40 pb-1">
                    Baixas {homeTeam.name}
                  </span>
                  {homeTeam.injuries && homeTeam.injuries.length > 0 ? (
                    homeTeam.injuries.map((inj, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-stone-300 font-medium">
                        <span className="text-red-500">•</span>
                        <span>{inj}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 text-[11px] italic font-mono">Nenhuma baixa relatada. Força máxima!</span>
                  )}
                </div>

                {/* Away Injuries */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest block border-b border-red-950/40 pb-1">
                    Baixas {awayTeam.name}
                  </span>
                  {awayTeam.injuries && awayTeam.injuries.length > 0 ? (
                    awayTeam.injuries.map((inj, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-stone-300 font-medium">
                        <span className="text-red-500">•</span>
                        <span>{inj}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 text-[11px] italic font-mono">Nenhuma baixa relatada. Força máxima!</span>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// Helpers for comparative meters
function pctOfTotal(val1: number, val2: number): number {
  const tot = val1 + val2;
  if (tot === 0) return 50;
  return Math.min(95, Math.max(5, (val1 / tot) * 100));
}

// Helpers for Generating line charts beautifully inside SVG
function generateLinePath(history: number[]): string {
  if (history.length === 0) return "";
  const totalPoints = history.length;
  const xStep = 100 / (totalPoints + 1); // safe margins
  
  let path = `M 4,${50 - (history[0] / 2)}`;
  for (let i = 1; i < totalPoints; i++) {
    const x = 4 + (i * xStep);
    const y = 50 - (history[i] / 2);
    path += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  return path;
}

function generateAreaPath(history: number[]): string {
  if (history.length === 0) return "";
  const totalPoints = history.length;
  const xStep = 100 / (totalPoints + 1);
  const firstY = 50 - (history[0] / 2);
  
  let path = `M 4,50 L 4,${firstY.toFixed(1)}`;
  for (let i = 1; i < totalPoints; i++) {
    const x = 4 + (i * xStep);
    const y = 50 - (history[i] / 2);
    path += ` L ${x.toFixed(1)},${y.toFixed(1)}`;
  }
  
  const lastX = 4 + ((totalPoints - 1) * xStep);
  path += ` L ${lastX.toFixed(1)},50 Z`;
  return path;
}
