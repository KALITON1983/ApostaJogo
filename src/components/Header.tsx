import React from "react";
import { BrainCircuit, Play, RotateCcw, TrendingUp } from "lucide-react";

interface HeaderProps {
  onReset: () => void;
  isSimulating: boolean;
  onSimulateTick: () => void;
  hasLiveMatch: boolean;
  isModoReal: boolean;
  onToggleModoReal: () => void;
  countdown?: number;
}

export function Header({ onReset, isSimulating, onSimulateTick, hasLiveMatch, isModoReal, onToggleModoReal, countdown = 60 }: HeaderProps) {
  return (
    <header className="border-b border-[#1b2a22] bg-[#070b09] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50 shadow-lg" id="app_header">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10b981] to-[#eab308] p-[2px] shadow-lg shadow-emerald-950/40">
          <div className="flex items-center justify-center w-full h-full rounded-[10px] bg-[#090f0c]">
            <BrainCircuit className="w-5 h-5 text-[#eab308]" />
          </div>
          {hasLiveMatch && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            FOOTBALL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10b981] to-[#eab308]">AI PREDICTOR</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-mono tracking-widest uppercase">
            ESTATÍSTICAS & REDES NEURAIS EM TEMPO REAL
          </p>
        </div>
      </div>

      {/* Simulator Ticker Bar */}
      <div className="hidden lg:flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#0d1612] border border-[#14231b] text-xs">
        <span className="flex h-2 w-2 rounded-full bg-[#10b981]"></span>
        <span className="text-gray-300 font-medium">Algoritmo de IA Ativo:</span>
        <span className="font-mono text-[#eab308] bg-[#1a2d24] px-2 py-0.5 rounded text-[10px]">Gemini 3.5 Flash</span>
        <span className="text-gray-400">|</span>
        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-emerald-400">79.4% Taxa de Acerto</span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
        {/* Toggle Modo Real Switch */}
        <button
          onClick={onToggleModoReal}
          className={`flex items-center gap-2 px-3.5 py-2 font-extrabold text-[11px] uppercase tracking-wider rounded-lg transition-all border cursor-pointer ${
            isModoReal
              ? "bg-[#0f2d1e] text-[#10b981] border-[#10b981] shadow-md shadow-emerald-950/30 font-black"
              : "bg-[#0d1612] text-gray-400 border-[#1d2d25] hover:text-white"
          }`}
          title="Ativar atualização automática em tempo real a cada 1 minuto (60 segundos)"
          id="btn_modo_real"
        >
          <span className={`relative flex h-2 w-2 ${isModoReal ? "" : "hidden"}`}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
          </span>
          {!isModoReal && <span className="w-1.5 h-1.5 rounded-full bg-zinc-650"></span>}
          <span>{isModoReal ? `Modo Real: Ligado (${countdown}s)` : "Ativar Modo Real"}</span>
        </button>

        <button
          onClick={onSimulateTick}
          disabled={isModoReal}
          className={`flex items-center gap-2 px-4 py-2 text-[#070b09] font-bold text-sm rounded-lg transition-all shadow-md active:scale-95 cursor-pointer ${
            isModoReal
              ? "bg-[#10b981]/35 cursor-not-allowed text-emerald-800"
              : "bg-[#10b981] hover:bg-emerald-500 shadow-emerald-950/20"
          }`}
          title={isModoReal ? "Desative o Modo Real para avançar manualmente" : "Avança 1 minuto e gera lances aleatórios para os jogos ao vivo"}
          id="btn_sim_minute"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Avançar Minuto Ao Vivo</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center p-2 rounded-lg bg-[#0d1612] border border-[#1d2d25] text-gray-400 hover:text-white hover:bg-[#15231c]"
          title="Resetar jogos para o estado padrão"
          id="btn_reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
