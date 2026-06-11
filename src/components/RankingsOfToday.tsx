import React from "react";
import { Award, CheckCircle2, Flame, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";

interface RankingItem {
  matchName: string;
  prediction: string;
  probability: number;
  confidence: "ALTA" | "MÉDIA";
  oddSimulated: number;
}

export function RankingsOfToday({ onSelectPrediction }: { onSelectPrediction?: (pred: string) => void }) {
  const topPicks: RankingItem[] = [
    {
      matchName: "México x África do Sul",
      prediction: "Mais de 2.5 gols",
      probability: 88,
      confidence: "ALTA",
      oddSimulated: 1.68
    },
    {
      matchName: "México x África do Sul",
      prediction: "Vitória do México",
      probability: 78,
      confidence: "ALTA",
      oddSimulated: 1.80
    },
    {
      matchName: "Coreia do Sul x Tchéquia",
      prediction: "Vitória da Coreia",
      probability: 64,
      confidence: "ALTA",
      oddSimulated: 1.74
    },
    {
      matchName: "Brasil x Marrocos",
      prediction: "Vitória do Brasil",
      probability: 62,
      confidence: "ALTA",
      oddSimulated: 1.55
    },
    {
      matchName: "Brasil x Marrocos",
      prediction: "Ambas equipes marcam",
      probability: 58,
      confidence: "MÉDIA",
      oddSimulated: 1.95
    }
  ];

  return (
    <div className="bg-[#090f0c] rounded-2xl border border-[#14231b] p-5 shadow-xl flex flex-col gap-4" id="rankings_widget">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#eab308]" />
          <h3 className="font-bold text-white text-sm uppercase tracking-wider">
            Palpites Inteligentes do Dia
          </h3>
        </div>
        <span className="text-[10px] bg-[#1a2d24] text-[#10b981] px-2 py-0.5 rounded-full font-mono font-medium">
          MÁQUINA PREDITIVA
        </span>
      </div>

      <p className="text-xs text-gray-400">
        Nossos algoritmos identificaram as maiores assimetrias de valor para os confrontos de hoje:
      </p>

      <div className="flex flex-col gap-2.5">
        {topPicks.map((pick, idx) => (
          <div
            key={idx}
            className="group relative bg-[#0e1713] hover:bg-[#121f19] border border-[#1b2f24] hover:border-[#10b981]/50 rounded-xl p-3 flex flex-col gap-1.5 transition-all cursor-pointer"
            onClick={() => onSelectPrediction?.(`${pick.matchName}: ${pick.prediction}`)}
          >
            {/* Index Counter */}
            <div className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-[#1b2b22] text-[#eab308] font-mono text-[10px] font-bold">
              #{idx + 1}
            </div>

            <span className="text-[10px] uppercase font-bold text-gray-400 font-mono tracking-wide">
              {pick.matchName}
            </span>

            <div className="flex items-center justify-between pr-6">
              <span className="font-semibold text-white text-xs">{pick.prediction}</span>
              <span className="text-xs font-mono font-bold text-[#eab308]">
                {pick.probability}%
              </span>
            </div>

            {/* Probability bar */}
            <div className="w-full bg-[#15231c] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#10b981] to-[#eab308] h-full rounded-full transition-all duration-500"
                style={{ width: `${pick.probability}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#10b981]" />
                Confiança:{" "}
                <strong className={pick.confidence === "ALTA" ? "text-emerald-400" : "text-gray-300"}>
                  {pick.confidence}
                </strong>
              </span>
              <span>Odd Provável: <strong className="text-[#eab308]">@{pick.oddSimulated.toFixed(2)}</strong></span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 bg-[#0c1310] border border-dashed border-[#182c21] rounded-xl p-3 flex items-start gap-2.5">
        <Award className="w-5 h-5 text-[#eab308] shrink-0 mt-0.5" />
        <div>
          <span className="text-[11px] font-bold text-[#eab308] block">COMO USAR ESTAS DICAS?</span>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            As avaliações baseiam-se em desvios de gols esperados (xG), H2H e força do mando. Busque mercados equilibrados com taxa acima de 65% para maximizar seus retornos.
          </p>
        </div>
      </div>
    </div>
  );
}
