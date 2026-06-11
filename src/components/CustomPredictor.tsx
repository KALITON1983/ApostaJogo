import React, { useState } from "react";
import { BrainCircuit, Search, Loader2, Sparkles, MessageSquare, PlusCircle } from "lucide-react";

interface CustomPredictorProps {
  onAnalyze: (home: string, away: string) => Promise<void>;
  isLoading: boolean;
}

export function CustomPredictor({ onAnalyze, isLoading }: CustomPredictorProps) {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressStep, setProgressStep] = useState(0);

  const loadingMessages = [
    "Consultando Rede Neural de Desempenho...",
    "Calculando xG (Expected Goals) histórico...",
    "Acessando histórico de confrontos diretos (H2H)...",
    "Cruzando relatórios de desfalques e meteorologia...",
    "Validando probabilidades táticas finais com Gemini..."
  ];

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoading) {
      setProgressStep(0);
      const interval = setInterval(() => {
        setProgressStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!homeTeam.trim() || !awayTeam.trim()) {
      setErrorMsg("Por favor, preencha o nome de ambas as equipes.");
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
    } catch (err: any) {
      setErrorMsg("Erro ao processar análise inteligente. Tente novamente.");
    }
  };

  return (
    <div className="bg-[#090f0c] rounded-2xl border border-[#14231b] p-5 shadow-xl relative overflow-hidden" id="custom_predictor_card">
      {/* Decorative accent background grids */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center gap-2 mb-3">
        <BrainCircuit className="w-5 h-5 text-[#10b981]" />
        <h3 className="font-bold text-white text-sm uppercase tracking-wider">
          Análise Inteligente Sob Demanda
        </h3>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        Escreva quaisquer duas equipes do mundo para gerar probabilidades táticas em tempo real usando nossa inteligência computacional.
      </p>

      {errorMsg && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-950/40 border border-red-900 text-red-400 text-xs text-center font-medium">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="py-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="relative flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#eab308] animate-spin" />
            <Sparkles className="w-4 h-4 text-[#10b981] absolute animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Análise Preditiva em Andamento</p>
            <p className="text-xs text-emerald-400 mt-1 font-mono animate-pulse">
              {loadingMessages[progressStep]}
            </p>
          </div>
          <span className="text-[10px] text-gray-500 max-w-xs">
            Esta consulta utiliza o modelo avançado <strong className="text-gray-300">Gemini 3.5 Flash</strong> para projetar cenários esportivos profundos.
          </span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Home Team Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                Time Mandante (Home)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Real Madrid, Barcelona"
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-semibold bg-[#0e1713] border border-[#1b2f24] focus:border-[#10b981] rounded-xl py-3 pl-3 pr-8 text-white placeholder-gray-600 outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#10b981]"></span>
              </div>
            </div>

            {/* Away Team Input */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                Time Visitante (Away)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ex: Manchester United, Bayern"
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  disabled={isLoading}
                  className="w-full text-xs font-semibold bg-[#0e1713] border border-[#1b2f24] focus:border-[#eab308] rounded-xl py-3 pl-3 pr-8 text-white placeholder-gray-600 outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#eab308]"></span>
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
    </div>
  );
}
