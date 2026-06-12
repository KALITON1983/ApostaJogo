import React, { useState, useEffect, useRef, useCallback } from "react";
import { FootballMatch, MatchStatus, AIPrediction } from "./types";
import { Header } from "./components/Header";
import { AIPredictionDetails } from "./components/AIPredictionDetails";
import { CustomPredictor } from "./components/CustomPredictor";
import { RankingsOfToday } from "./components/RankingsOfToday";
import { 
  Sparkles, Award, ShieldAlert, BadgeInfo, Play, Activity, 
  HelpCircle, Calendar, MessageSquare, AlertCircle, TrendingUp,
  BrainCircuit, Coins, CheckCircle2, Ticket, Receipt, Filter, Loader2,
  Triangle, Target
} from "lucide-react";

export default function App() {
  const [matches, setMatches] = useState<FootballMatch[]>([]);
  const [logs, setLogs] = useState<{ [key: string]: string[] }>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string>("1");
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isModoReal, setIsModoReal] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [statusFilter, setStatusFilter] = useState<"ALL" | MatchStatus>("ALL");
  const [globalMessage, setGlobalMessage] = useState<string | null>(null);

  // Simulated Bet Slip State
  const [selectedTip, setSelectedTip] = useState<string | null>(null);
  const [betStake, setBetStake] = useState<string>("100");
  const [betPlacedReceipt, setBetPlacedReceipt] = useState<{
    tip: string;
    stake: number;
    odd: number;
    payout: number;
    matchName: string;
  } | null>(null);

  // Fetch match details on startup
  const fetchMatches = async () => {
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      if (data.matches) {
        setMatches(data.matches);
        setLogs(data.logs || {});
        // Auto-select first match on initial load if list not empty
        if (data.matches.length > 0 && !selectedMatchId) {
          setSelectedMatchId(data.matches[0].id);
        }
      }
    } catch (e) {
      console.error("Erro ao buscar as partidas:", e);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  // Listen for newly added live matches from CustomPredictor
  useEffect(() => {
    const handler = () => {
      fetchMatches();
      setGlobalMessage("✅ Jogo encontrado e adicionado ao painel!");
      setTimeout(() => setGlobalMessage(null), 4000);
    };
    window.addEventListener("match-added", handler);
    return () => window.removeEventListener("match-added", handler);
  }, []);

  // Reset to initial soccer database state
  const handleReset = async () => {
    try {
      const res = await fetch("/api/matches/reset", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setMatches(data.matches);
        setLogs(data.logs);
        setSelectedMatchId("1"); // reset select
        setSelectedTip(null);
        setBetPlacedReceipt(null);
        triggerToast("Banco de dados esportivo resetado com sucesso!");
      }
    } catch (e) {
      console.error("Erro ao resetar banco:", e);
    }
  };

  // Simulates tick: advances minute for live matches and mutates random stats
  const handleSimulateTick = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch("/api/matches/simulate", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setMatches(data.matches);
        setLogs(data.logs);
        triggerToast("Lances de jogo simulados e atualizados a cada segundo no motor de IA!");
      }
    } catch (e) {
      console.error("Erro de simulação:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleToggleModoReal = () => {
    setIsModoReal((prev) => {
      const next = !prev;
      if (next) {
        setCountdown(60);
        triggerToast("Modo Real Ativado! Minutos e lances táticos serão atualizados automaticamente a cada 1 minuto (60s).");
      } else {
        triggerToast("Modo Real Desativado. Agora você pode avançar os minutos manualmente.");
      }
      return next;
    });
  };

  const intervalRef = useRef<any>(null);
  const countdownRef = useRef(60);
  const matchesRef = useRef(matches);

  // Keep matchesRef in sync
  useEffect(() => {
    matchesRef.current = matches;
  }, [matches]);

  const runSimulateTick = useCallback(async () => {
    const hasLive = matchesRef.current.some(m => m.status === MatchStatus.LIVE);
    if (!hasLive) {
      setIsModoReal(false);
      triggerToast("Todos os jogos foram finalizados!");
      return;
    }
    try {
      const res = await fetch("/api/matches/simulate", { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setMatches(data.matches);
        setLogs(data.logs);
      }
    } catch (err) {
      console.error("Erro no ticker automático:", err);
    }
  }, []);

  // Stable interval using refs — avoids countdown reset on each render
  useEffect(() => {
    if (isModoReal) {
      countdownRef.current = 60;
      setCountdown(60);
      intervalRef.current = setInterval(() => {
        countdownRef.current -= 1;
        setCountdown(countdownRef.current);
        if (countdownRef.current <= 0) {
          countdownRef.current = 60;
          setCountdown(60);
          runSimulateTick();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      countdownRef.current = 60;
      setCountdown(60);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isModoReal, runSimulateTick]);

  // Trigger Gemini AI Analyzer model on custom typed home & away
  const handleCustomAnalyze = async (home: string, away: string) => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/matches/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeTeam: home, awayTeam: away })
      });
      const data = await res.json();
      if (data.match) {
        setMatches((prev) => [data.match, ...prev]);
        setSelectedMatchId(data.match.id);
        if (data.message) {
          triggerToast(data.message);
        }
      }
    } catch (e) {
      console.error("Erro no modelo de análise:", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGoLive = async (matchId: string) => {
    try {
      const res = await fetch(`/api/matches/${matchId}/go-live`, { method: "POST" });
      const data = await res.json();
      if (data.status === "success") {
        setMatches(data.matches);
        setLogs(data.logs);
        triggerToast("Transmissão ao vivo iniciada! O placar em tempo real e a análise de pressão de gol estão habilitados!");
      }
    } catch (e) {
      console.error("Erro ao ativar partida ao vivo:", e);
    }
  };

  // Toast triggering mechanism
  const triggerToast = (msg: string) => {
    setGlobalMessage(msg);
    setTimeout(() => {
      setGlobalMessage(null);
    }, 6000);
  };

  // Render match list with filters
  const filteredMatches = matches.filter((m) => {
    if (statusFilter === "ALL") return true;
    return m.status === statusFilter;
  });

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) || matches[0];

  // Helper calculation of mock betting factors
  const getMockOddForTip = (tipStr: string): number => {
    if (tipStr.includes("gols") || tipStr.includes("marcam")) return 1.82;
    if (tipStr.includes("Vitória")) return 2.10;
    return 1.90;
  };

  const handlePlaceBet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTip) return;
    const stakeVal = parseFloat(betStake) || 10;
    const oddVal = getMockOddForTip(selectedTip);

    setBetPlacedReceipt({
      tip: selectedTip.split(":")[1] || selectedTip,
      matchName: selectedTip.split(":")[0] || "Partida Geral",
      stake: stakeVal,
      odd: oddVal,
      payout: stakeVal * oddVal
    });
  };

  return (
    <div className="min-h-screen bg-[#040705] text-zinc-100 font-sans flex flex-col justify-start" id="root_layout">
      
      {/* Top Interactive Toast notifications */}
      {globalMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-bounce p-4 rounded-xl bg-[#091f14] border-2 border-[#10b981] shadow-2xl text-xs max-w-sm flex items-start gap-3 text-white">
          <Sparkles className="w-5 h-5 text-[#eab308] shrink-0" />
          <p className="font-semibold leading-relaxed">{globalMessage}</p>
        </div>
      )}

      {/* Main Header with Sim controls */}
      <Header 
        onReset={handleReset} 
        isSimulating={isSimulating} 
        onSimulateTick={handleSimulateTick} 
        hasLiveMatch={matches.some(m => m.status === MatchStatus.LIVE)}
        isModoReal={isModoReal}
        onToggleModoReal={handleToggleModoReal}
        countdown={countdown}
      />

      {/* Main Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: ACTIVE MATCH LIST & SEARCH GENERATOR (Grid spam: 4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Custom Dynamic Pred Analyzer */}
          <CustomPredictor onAnalyze={handleCustomAnalyze} isLoading={isAnalyzing} />

          {/* Matches List Widget */}
          <div className="bg-[#090f0c] rounded-2xl border border-[#14231b] p-5 shadow-xl flex flex-col gap-4" id="match_list_widget">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#eab308] text-xs uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Grelha de Partidas ({matches.length})
              </h3>
              
              {/* Dynamic status count badges */}
              <span className="text-[10px] bg-[#14261a] text-[#10b981] px-2 py-0.5 rounded font-mono">
                {matches.filter(m => m.status === MatchStatus.LIVE).length} ao vivo
              </span>
            </div>

            {/* Filter buttons row */}
            <div className="flex flex-wrap gap-1.5 bg-[#0e1713] p-1 rounded-xl border border-[#192b21]">
              {[
                { label: "Todos", value: "ALL" },
                { label: "Ao Vivo", value: MatchStatus.LIVE },
                { label: "Pré-Jogo", value: MatchStatus.PRE_MATCH },
                { label: "Finalizado", value: MatchStatus.FINISHED }
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setStatusFilter(btn.value as any)}
                  className={`flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg text-center transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === btn.value
                      ? "bg-[#10b981] text-[#070b09]"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* List entries */}
            <div className="flex flex-col gap-3 max-h-96 overflow-y-auto">
              {filteredMatches.length > 0 ? (
                filteredMatches.map((m) => {
                  const isSelected = selectedMatchId === m.id;
                  const scoreLabel = m.status !== MatchStatus.PRE_MATCH ? `${m.homeScore} - ${m.awayScore}` : "VS";
                  
                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMatchId(m.id);
                        // Also auto feed tip selected matching this match
                        setSelectedTip(`${m.homeTeam.name} x ${m.awayTeam.name}: Vitória do ${m.homeTeam.name}`);
                      }}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                        isSelected 
                          ? "bg-[#15271d]/80 border-[#10b981] shadow-md shadow-emerald-950/20" 
                          : "bg-[#0c1410] border-[#182820] hover:border-[#1d3328]"
                      }`}
                      id={`match_card_btn_${m.id}`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                        <span className="uppercase text-emerald-400 font-extrabold">{m.leagueName}</span>
                        {m.status === MatchStatus.LIVE && (
                          <span className="text-red-400 font-bold animate-pulse">● AO VIVO • {m.minute}'</span>
                        )}
                        {m.status === MatchStatus.PRE_MATCH && <span className="text-amber-500 font-medium">{m.startTime || "AGENDA"}</span>}
                        {m.status === MatchStatus.FINISHED && <span className="text-zinc-500">FINALIZADO</span>}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-extrabold text-white">{m.homeTeam.name}</span>
                          <span className="text-xs font-semibold text-zinc-300">{m.awayTeam.name}</span>
                        </div>
                        <div className="font-mono text-sm font-black text-[#eab308] bg-[#090f0c] py-1 px-3 border border-[#16271e] rounded shadow-inner min-w-[50px] text-center">
                          {scoreLabel}
                        </div>
                      </div>

                      {/* Small Confidence line */}
                      <div className="flex items-center justify-between text-[9px] text-[#10b981] font-mono border-t border-[#15261d] mt-1 pt-1.5">
                        <span className="flex items-center gap-1 text-gray-400">
                          <BrainCircuit className="w-3 h-3 text-[#eab308]" /> Confidence:
                        </span>
                        <strong className="text-white font-bold">{m.predictions.confidenceRating}%</strong>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 border border-dashed border-[#182820] rounded-xl">
                  <p className="text-xs text-gray-500 font-mono">Nenhuma partida encontrada para este filtro.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: ACTIVE MATCH DETAILS VIEW (Grid spam: 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {selectedMatch ? (
            <AIPredictionDetails 
              match={selectedMatch} 
              logs={logs[selectedMatch.id] || []} 
              onGoLive={handleGoLive}
            />
          ) : (
            <div className="bg-[#070b09] rounded-3xl border border-[#14231b] p-12 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-[#eab308] animate-spin" />
              <p className="text-sm text-gray-400">Carregando palpites dinâmicos...</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: BET SLIP SIMULATOR & CORNERS ANALYSIS & HIGHLIGHT PICKS (Grid spam: 3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Active Bet Slip Simulated Ticket */}
          <div className="bg-[#090f0c] rounded-2xl border border-[#14231b] p-5 shadow-xl relative overflow-hidden" id="betslip_card">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#14251a]">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#eab308]" />
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-white">
                  Bilhete Simulado IA
                </h3>
              </div>
              <span className="text-[9px] uppercase font-bold text-[#10b981] bg-[#0c2415] px-2 py-0.5 rounded tracking-widest font-mono">
                MOCK SLIP
              </span>
            </div>

            {betPlacedReceipt ? (
              /* Receipt Show */
              <div className="flex flex-col gap-4 text-center py-2 animate-fadeIn uppercase select-none">
                <div className="mx-auto w-12 h-12 bg-[#0c2415] border border-[#10b981] flex items-center justify-center rounded-full text-[#10b981]">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-white">Simulação Efetuada!</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 lowercase">O palpite foi processado no simulador local</p>
                </div>

                <div className="bg-[#0c1410] border border-[#192a1f] rounded-xl p-3 text-left font-mono text-[11px] flex flex-col gap-2">
                  <div className="flex justify-between border-b border-[#15241b] pb-1">
                    <span className="text-zinc-500">Mercado:</span>
                    <strong className="text-white text-[10px]">{betPlacedReceipt.tip}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#15241b] pb-1">
                    <span className="text-zinc-500">Partida:</span>
                    <strong className="text-white text-[10px] truncate max-w-[140px]">{betPlacedReceipt.matchName}</strong>
                  </div>
                  <div className="flex justify-between border-b border-[#15241b] pb-1">
                    <span className="text-zinc-500 font-bold">Investimento:</span>
                    <span className="text-emerald-400 font-bold">R$ {betPlacedReceipt.stake.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#15241b] pb-1">
                    <span className="text-zinc-500">Odd Prevista:</span>
                    <strong className="text-[#eab308]">@{betPlacedReceipt.odd.toFixed(2)}</strong>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-zinc-400 font-bold">Retorno Est.:</span>
                    <strong className="text-[#eab308] font-black">R$ {betPlacedReceipt.payout.toFixed(2)}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setBetPlacedReceipt(null)}
                  className="w-full bg-[#182a20] hover:bg-[#20372a] text-[#10b981] border border-[#10b981]/30 font-bold text-xs py-2.5 rounded-lg uppercase tracking-wide transition-colors cursor-pointer"
                >
                  Novo Palpite
                </button>
              </div>
            ) : (
              /* Bet Input form wrapper */
              <form onSubmit={handlePlaceBet} className="flex flex-col gap-3">
                <span className="text-[10px] text-zinc-400 leading-normal block">
                  Escolha qualquer previsão ao lado ou selecione do ranking diário para calcular retornos.
                </span>

                {/* Selected Tip Card */}
                <div className="bg-[#0e1713] p-3 rounded-xl border border-[#1e3427] flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase">Previsão Ativa</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white max-w-[180px] break-words">
                      {selectedTip ? selectedTip.split(":")[1] || selectedTip : `${selectedMatch?.homeTeam?.name} x ${selectedMatch?.awayTeam?.name}: Vitória`}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#eab308] bg-[#231b08] px-2 py-0.5 border border-[#3c2f10] rounded">
                      @{selectedTip ? getMockOddForTip(selectedTip).toFixed(2) : "1.85"}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#10b981] font-mono tracking-tighter capitalize truncate mt-1">
                    Partida: {selectedTip ? selectedTip.split(":")[0] : `${selectedMatch?.homeTeam?.name} x ${selectedMatch?.awayTeam?.name}`}
                  </span>
                </div>

                {/* Stake input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest flex justify-between items-baseline">
                    <span>Investimento Simulado</span>
                    <span className="text-emerald-400">R$</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={betStake}
                      onChange={(e) => setBetStake(String(Math.max(1, parseFloat(e.target.value) || 0)))}
                      className="w-full text-xs bg-[#0e1713] border border-[#1f3427] focus:border-[#10b981] rounded-xl py-2.5 px-3 font-semibold text-white outline-none"
                    />
                    <Coins className="w-4 h-4 text-gray-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Estimate potential gains */}
                <div className="flex items-center justify-between text-xs font-semibold bg-[#0e1713] p-2.5 rounded-lg border border-[#18281f] font-mono">
                  <span className="text-gray-400">Ganhos em Potencial:</span>
                  <strong className="text-[#eab308] font-bold">
                    R$ {((parseFloat(betStake) || 0) * getMockOddForTip(selectedTip || "Default: Tip")).toFixed(2)}
                  </strong>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  id="btn_submit_betslip"
                  className="w-full bg-gradient-to-r from-[#10b981] to-emerald-500 hover:scale-102 hover:shadow-lg hover:shadow-emerald-900/10 text-[#070b09] font-black text-xs uppercase tracking-wide py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Receipt className="w-4 h-4" />
                  <span>Registrar Palpite Seguro</span>
                </button>
              </form>
            )}
          </div>

          {/* CORNER ANALYSIS CARD */}
          {selectedMatch && (() => {
            const hAvg = selectedMatch.homeTeam.avgGoalsScored * 2.2;
            const aAvg = selectedMatch.awayTeam.avgGoalsScored * 2.0;
            const liveCornersHome = selectedMatch.stats?.corners?.[0] ?? 0;
            const liveCornersAway = selectedMatch.stats?.corners?.[1] ?? 0;
            const totalLive = liveCornersHome + liveCornersAway;
            
            // Projected total using per-90min rate
            const minutePlayed = selectedMatch.minute || 90;
            const projectedTotal = selectedMatch.status === MatchStatus.FINISHED
              ? totalLive
              : selectedMatch.status === MatchStatus.LIVE
              ? Math.round((totalLive / Math.max(minutePlayed, 1)) * 90)
              : Math.round(hAvg + aAvg);

            const over85 = Math.min(92, Math.round(55 + (projectedTotal - 8.5) * 12));
            const over105 = Math.min(88, Math.round(35 + (projectedTotal - 10.5) * 10));
            const homePct = Math.round((hAvg / (hAvg + aAvg)) * 100);
            const awayPct = 100 - homePct;

            return (
              <div className="bg-[#090f0c] rounded-2xl border border-[#14231b] p-4 shadow-xl flex flex-col gap-3" id="corner_analysis_card">
                <div className="flex items-center justify-between pb-2 border-b border-[#14251a]">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#eab308]" />
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-white">Análise de Escanteios</h3>
                  </div>
                  <span className="text-[9px] uppercase font-bold text-[#10b981] bg-[#0c2415] px-2 py-0.5 rounded tracking-widest font-mono">IA</span>
                </div>

                {/* Projected Total */}
                <div className="flex items-center justify-between bg-[#0e1713] rounded-xl p-3 border border-[#1e3427]">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-widest block">Escanteios Projetados</span>
                    <strong className="text-2xl font-black text-[#eab308] font-mono">{projectedTotal}</strong>
                    <span className="text-[9px] text-zinc-500 block">no total da partida</span>
                  </div>
                  <div className="text-right">
                    {selectedMatch.status !== MatchStatus.PRE_MATCH && (
                      <>
                        <span className="text-[9px] font-mono text-zinc-400 block">Ao vivo</span>
                        <strong className="text-lg font-black text-white font-mono">{totalLive}</strong>
                        <span className="text-[9px] text-zinc-500 block">({liveCornersHome}-{liveCornersAway})</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Over lines */}
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Over 8.5 Escanteios", prob: Math.max(5, Math.min(95, over85)), color: "#10b981" },
                    { label: "Over 10.5 Escanteios", prob: Math.max(5, Math.min(95, over105)), color: "#eab308" },
                    { label: "Under 8.5 Escanteios", prob: Math.max(5, Math.min(95, 100 - over85)), color: "#f97316" },
                  ].map((line, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-zinc-400 font-mono">{line.label}</span>
                        <strong className="font-mono" style={{ color: line.color }}>{line.prob}%</strong>
                      </div>
                      <div className="w-full h-1.5 bg-[#122119] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${line.prob}%`, backgroundColor: line.color }}></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Home/Away corner split */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">Domínio de Escanteios</span>
                  <div className="w-full h-5 rounded-lg overflow-hidden flex font-mono text-[9px] font-extrabold">
                    <div className="h-full flex items-center justify-center text-[#070b09] transition-all" style={{ width: `${homePct}%`, backgroundColor: selectedMatch.homeTeam.color || "#10b981" }}>
                      {homePct > 20 ? `${homePct}%` : ""}
                    </div>
                    <div className="h-full flex items-center justify-center text-white transition-all" style={{ width: `${awayPct}%`, backgroundColor: selectedMatch.awayTeam.color || "#ef4444" }}>
                      {awayPct > 20 ? `${awayPct}%` : ""}
                    </div>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-zinc-500">
                    <span>{selectedMatch.homeTeam.shortName}</span>
                    <span>{selectedMatch.awayTeam.shortName}</span>
                  </div>
                </div>

                {/* Quick tip */}
                <div className="flex items-start gap-2 p-2.5 bg-[#0b1710] border border-[#1a3025] rounded-xl text-[10px] text-zinc-300 leading-relaxed">
                  <span className="text-base leading-none">🚩</span>
                  <p>
                    <strong className="text-[#eab308]">Dica IA:</strong>{" "}
                    {projectedTotal >= 10
                      ? `Alta expectativa de escanteios (${projectedTotal} proj.). Excelente valor no Over 8.5.`
                      : projectedTotal >= 8
                      ? `Expectativa moderada de escanteios (${projectedTotal} proj.). Over 8.5 com risco calculado.`
                      : `Baixa expectativa de escanteios (${projectedTotal} proj.). Avaliar Under 8.5 com cautela.`
                    }
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Table list of Hot picks ranked by algorithm */}
          <RankingsOfToday onSelectPrediction={(pred) => {
            setSelectedTip(pred);
            triggerToast(`Palpite adicionado com sucesso ao Bilhete Simulado: ${pred}`);
          }} />

        </div>

      </main>

      {/* Humble Footer */}
      <footer className="border-t border-[#122119] bg-[#050906] py-5 px-6 text-center text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-mono text-[10px] tracking-wider text-zinc-600 uppercase">
          © 2026 FOOTBALL AI PREDICTOR • MODELAGEM MATEMÁTICA AVANÇADA
        </p>
        <p className="text-[10px] text-zinc-500 max-w-sm sm:text-right">
          Feito com o processamento do modelo <strong className="text-zinc-400">Gemini 3.5 Flash</strong>. A análise estatística fornecida serve como consultoria tática de simulações e não fomenta apostas reais indiretas.
        </p>
      </footer>

    </div>
  );
}
