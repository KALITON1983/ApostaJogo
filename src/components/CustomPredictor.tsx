import React, { useState, useCallback } from "react";
import { BrainCircuit, Search, Loader2, Sparkles, RefreshCw, Wifi, WifiOff, Radio } from "lucide-react";

interface CustomPredictorProps {
  onAnalyze: (home: string, away: string) => Promise<void>;
  isLoading: boolean;
}

export function CustomPredictor({ onAnalyze, isLoading }: CustomPredictorProps) {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressStep, setProgressStep] = useState(0);
  const [mode, setMode] = useState<"ai" | "live">("live");
  const [liveStatus, setLiveStatus] = useState<{
    source?: string; isReal?: boolean; matchId?: string; refreshing?: boolean; lastUpdate?: string
  }>({});

  const loadingMessages = [
    "🔍 Buscando jogo nas APIs de futebol ao vivo...",
    "📡 Verificando dados em tempo real...",
    "🧠 Groq AI analisando estatísticas táticas...",
    "⚽ Calculando xG e probabilidades de gol...",
    "✅ Finalizando análise inteligente...",
  ];

  React.useEffect(() => {
    if (isLoading) {
      setProgressStep(0);
      const interval = setInterval(() => {
        setProgressStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  // Auto-refresh for live matches
  React.useEffect(() => {
    if (!liveStatus.matchId || !liveStatus.isReal) return;
    const interval = setInterval(async () => {
      setLiveStatus(prev => ({ ...prev, refreshing: true }));
      try {
        const res = await fetch(`/api/matches/${liveStatus.matchId}/refresh`);
        const data = await res.json();
        if (data.updated) {
          setLiveStatus(prev => ({
            ...prev,
            refreshing: false,
            lastUpdate: new Date().toLocaleTimeString("pt-BR")
          }));
        } else {
          setLiveStatus(prev => ({ ...prev, refreshing: false }));
        }
      } catch {
        setLiveStatus(prev => ({ ...prev, refreshing: false }));
      }
    }, 60000); // refresh every 60s
    return () => clearInterval(interval);
  }, [liveStatus.matchId, liveStatus.isReal]);

  const handleSearchLive = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setErrorMsg("Preencha o nome de ambas as equipes.");
      return;
    }
    try {
      const res = await fetch("/api/matches/search-live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeTeam: homeTeam.trim(), awayTeam: awayTeam.trim() })
      });
      const data = await res.json();
      if (data.match) {
        setLiveStatus({
          source: data.source,
          isReal: data.isReal,
          matchId: data.match.id,
          lastUpdate: new Date().toLocaleTimeString("pt-BR")
        });
        setHomeTeam("");
        setAwayTeam("");
        // Trigger parent refresh
        window.dispatchEvent(new Event("match-added"));
      } else {
        setErrorMsg("Jogo não encontrado. Tente verificar os nomes das equipes.");
      }
    } catch {
      setErrorMsg("Erro ao buscar o jogo. Verifique a conexão.");
    }
  }, [homeTeam, awayTeam]);

  const handleAiAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!homeTeam.trim() || !awayTeam.trim()) {
      setErrorMsg("Preencha o nome de ambas as equipes.");
      return;
    }
    if (homeTeam.trim().toLowerCase() === awayTeam.trim().toLowerCase()) {
      setErrorMsg("O time mandante e visitante devem ser diferentes.");
      return;
    }
    try {
      await onAnalyze(homeTeam, awayTeam);
      setHomeTeam("");
      setAwayTeam("");
    } catch {
      setErrorMsg("Erro ao processar análise. Tente novamente.");
    }
  };

  const sourceLabel = liveStatus.source === "football-data.org"
    ? { text: "Dados Reais", color: "text-emerald-400", icon: <Wifi className="w-3 h-3" /> }
    : liveStatus.source === "groq-ai"
    ? { text: "IA Groq", color: "text-amber-400", icon: <BrainCircuit className="w-3 h-3" /> }
    : liveStatus.source
    ? { text: "Local", color: "text-gray-400", icon: <WifiOff className="w-3 h-3" /> }
    : null;

  return (
    <div className="bg-[#090f0c] rounded-2xl border border-[#14231b] p-5 shadow-xl relative overflow-hidden" id="custom_predictor_card">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setMode("live")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${mode === "live" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "text-gray-500 hover:text-gray-300"}`}
          id="btn_mode_live"
        >
          <Radio className="w-3.5 h-3.5" />
          Buscar Jogo Real
        </button>
        <button
          onClick={() => setMode("ai")}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${mode === "ai" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "text-gray-500 hover:text-gray-300"}`}
          id="btn_mode_ai"
        >
          <BrainCircuit className="w-3.5 h-3.5" />
          Análise IA
        </button>
      </div>

      {mode === "live" ? (
        <>
          <p className="text-xs text-gray-400 mb-3">
            Digite qualquer jogo que está acontecendo <strong className="text-emerald-400">agora ou nos próximos dias</strong>. O app busca automaticamente os dados reais e atualiza a cada 60 segundos.
          </p>

          {/* Status badge */}
          {sourceLabel && (
            <div className={`flex items-center gap-1.5 mb-3 text-[10px] font-mono ${sourceLabel.color}`}>
              {sourceLabel.icon}
              <span>Fonte: {sourceLabel.text}</span>
              {liveStatus.lastUpdate && <span className="text-gray-500 ml-2">· Atualizado {liveStatus.lastUpdate}</span>}
              {liveStatus.refreshing && <RefreshCw className="w-3 h-3 animate-spin ml-1" />}
            </div>
          )}

          {errorMsg && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-950/40 border border-red-900 text-red-400 text-xs text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSearchLive} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Time Mandante</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: Real Madrid"
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#0e1713] border border-[#1b2f24] focus:border-[#10b981] rounded-xl py-3 pl-3 pr-8 text-white placeholder-gray-600 outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Time Visitante</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ex: Barcelona"
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    className="w-full text-xs font-semibold bg-[#0e1713] border border-[#1b2f24] focus:border-[#eab308] rounded-xl py-3 pl-3 pr-8 text-white placeholder-gray-600 outline-none transition-colors"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400" />
                </div>
              </div>
            </div>
            <button
              type="submit"
              id="btn_search_live"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Buscar e Rastrear Jogo em Tempo Real</span>
            </button>
            <p className="text-[10px] text-gray-600 text-center">
              Powered by <span className="text-emerald-600">football-data.org</span> · Fallback <span className="text-amber-600">Groq AI</span>
            </p>
          </form>
        </>
      ) : (
        <>
          <p className="text-xs text-gray-400 mb-3">
            Gera probabilidades táticas detalhadas para qualquer jogo usando inteligência artificial avançada.
          </p>

          {errorMsg && (
            <div className="mb-3 p-2.5 rounded-lg bg-red-950/40 border border-red-900 text-red-400 text-xs text-center">
              {errorMsg}
            </div>
          )}

          {isLoading ? (
            <div className="py-6 flex flex-col items-center justify-center text-center gap-4">
              <div className="relative flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                <Sparkles className="w-4 h-4 text-emerald-400 absolute animate-pulse" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Análise Preditiva em Andamento</p>
                <p className="text-xs text-emerald-400 mt-1 font-mono animate-pulse">{loadingMessages[progressStep]}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAiAnalyze} className="flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Time Mandante</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Real Madrid, Barcelona"
                      value={homeTeam}
                      onChange={(e) => setHomeTeam(e.target.value)}
                      disabled={isLoading}
                      className="w-full text-xs font-semibold bg-[#0e1713] border border-[#1b2f24] focus:border-[#10b981] rounded-xl py-3 pl-3 pr-8 text-white placeholder-gray-600 outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Time Visitante</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ex: Manchester United, Bayern"
                      value={awayTeam}
                      onChange={(e) => setAwayTeam(e.target.value)}
                      disabled={isLoading}
                      className="w-full text-xs font-semibold bg-[#0e1713] border border-[#1b2f24] focus:border-[#eab308] rounded-xl py-3 pl-3 pr-8 text-white placeholder-gray-600 outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-yellow-400" />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                id="btn_submit_analyzer"
                className="w-full bg-[#10b981] hover:bg-emerald-500 text-[#070b09] font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <BrainCircuit className="w-4 h-4" />
                <span>Gerar Predição AI Avançada</span>
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
