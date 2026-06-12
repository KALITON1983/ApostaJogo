import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { FootballMatch, MatchStatus, MatchStats, AIPrediction } from "./src/types";
import { exec } from "child_process";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Groq SDK with safety checks for token startup crash
let aiClient: Groq | null = null;
function getGroqClient(): Groq | null {
  if (!aiClient) {
    const key = process.env.GROQ_API_KEY;
    if (key && key.trim() !== "") {
      try {
        aiClient = new Groq({
          apiKey: key
        });
      } catch (e) {
        console.error("Erro ao inicializar o cliente do Groq:", e);
      }
    }
  }
  return aiClient;
}

// In-Memory state for soccer matches
function getInitialMatches(): FootballMatch[] {
  return [
  {
    id: "1",
    leagueName: "Copa do Mundo FIFA 2026 - Grupo A",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "11/06/2026 16:00",
    homeTeam: {
      name: "México",
      shortName: "MEX",
      form: ["W", "D", "W", "W", "L"],
      avgGoalsScored: 1.8,
      avgGoalsConceded: 1.0,
      homeWinRate: 80,
      awayWinRate: 50,
      leaguePosition: 1,
      injuries: ["Santiago Giménez (Dores na coxa)"],
      color: "#10b981" 
    },
    awayTeam: {
      name: "África do Sul",
      shortName: "RSA",
      form: ["W", "L", "D", "W", "D"],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.2,
      homeWinRate: 60,
      awayWinRate: 40,
      leaguePosition: 3,
      injuries: ["Tau (Preservado)"],
      color: "#15803d"
    },
    stats: {
      possession: [50, 50],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0, 0],
      momentumHistory: [0]
    },
    predictions: {
      winProbHome: 85,
      drawProb: 10,
      winProbAway: 5,
      over25Prob: 52,
      bothToScoreProb: 18,
      nextGoalTeam: "NONE",
      nextGoalProb: 0,
      probableScores: [
        { score: "2 x 0", probability: 52 },
        { score: "2 x 1", probability: 22 },
        { score: "3 x 0", probability: 12 }
      ],
      confidenceRating: 95,
      detailedAnalysis: "RESULTADO FINAL: México 2 x 0 África do Sul — Jogo de abertura da Copa do Mundo FIFA 2026 no lendário Estádio Azteca. Julián Quiñones abriu o placar de cabeça aos 41' após cruzamento preciso. Raúl Jiménez selou a vitória mexicana aos 82' com finalização rasteira no canto. México dominou toda a partida com 62% de posse de bola, 8 finalizações no alvo e xG de 2.31 — a África do Sul não conseguiu criar perigo real, registrando apenas 2 chutes no alvo e xG de 0.44.",
      tacticalRecommendation: "Placar final: México 2 x 0 África do Sul. Gols: Quiñones (41') e Jiménez (82')."
    },
    h2h: [
      { date: "11/06/2026", homeTeam: "México", awayTeam: "África do Sul", homeScore: 2, awayScore: 0 },
      { date: "11/06/2010", homeTeam: "África do Sul", awayTeam: "México", homeScore: 1, awayScore: 1 }
    ]
  },
  {
    id: "2",
    leagueName: "Copa do Mundo FIFA 2026 - Grupo A",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "11/06/2026 23:00",
    homeTeam: {
      name: "Coreia do Sul",
      shortName: "KOR",
      form: ["W", "W", "D", "W", "D"],
      avgGoalsScored: 2.0,
      avgGoalsConceded: 0.8,
      homeWinRate: 85,
      awayWinRate: 60,
      leaguePosition: 1,
      injuries: ["Son (Leve fadiga)"],
      color: "#e11d48" 
    },
    awayTeam: {
      name: "Tchéquia",
      shortName: "CZE",
      form: ["L", "W", "W", "D", "W"],
      avgGoalsScored: 1.7,
      avgGoalsConceded: 1.1,
      homeWinRate: 65,
      awayWinRate: 50,
      leaguePosition: 2,
      injuries: [],
      color: "#1d4ed8"
    },
    stats: {
      possession: [50, 50],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0, 0],
      momentumHistory: [0]
    },
    predictions: {
      winProbHome: 64,
      drawProb: 26,
      winProbAway: 10,
      over25Prob: 55,
      bothToScoreProb: 50,
      nextGoalTeam: "HOME",
      nextGoalProb: 58,
      probableScores: [
        { score: "2 x 0", probability: 38 },
        { score: "1 x 0", probability: 28 },
        { score: "2 x 1", probability: 18 }
      ],
      confidenceRating: 82,
      detailedAnalysis: "A Coreia do Sul impõe uma forte pressão alta em sua estreia. Comandada pela velocidade de seus pontas em transições agudas, a seleção asiática consegue neutralizar a compactação defensiva da Tchéquia, que aposta na força de sua bola aérea e físico para resistir aos ataques rápidos.",
      tacticalRecommendation: "Vitória simples da Coreia do Sul se mostra com tendência forte, com favoritismo estabilizado no mandante."
    },
    h2h: [
      { date: "05/06/2016", homeTeam: "República Tcheca", awayTeam: "Coreia do Sul", homeScore: 1, awayScore: 2 }
    ]
  },
  {
    id: "3",
    leagueName: "Copa do Mundo FIFA 2026 - Grupo B",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "12/06/2026 16:00",
    homeTeam: {
      name: "Canadá",
      shortName: "CAN",
      form: ["D", "W", "D", "W", "L"],
      avgGoalsScored: 1.8,
      avgGoalsConceded: 1.2,
      homeWinRate: 70,
      awayWinRate: 40,
      leaguePosition: 1,
      injuries: ["Davies (Dores musculares)"],
      color: "#ef4444"
    },
    awayTeam: {
      name: "Bósnia e Herzegovina",
      shortName: "BIH",
      form: ["W", "L", "D", "W", "W"],
      avgGoalsScored: 1.6,
      avgGoalsConceded: 1.1,
      homeWinRate: 65,
      awayWinRate: 45,
      leaguePosition: 2,
      injuries: [],
      color: "#1d4ed8"
    },
    stats: {
      possession: [50, 50],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0, 0],
      momentumHistory: [0]
    },
    predictions: {
      winProbHome: 52,
      drawProb: 28,
      winProbAway: 20,
      over25Prob: 48,
      bothToScoreProb: 52,
      nextGoalTeam: "HOME",
      nextGoalProb: 54,
      probableScores: [
        { score: "1 x 0", probability: 35 },
        { score: "1 x 1", probability: 28 },
        { score: "2 x 1", probability: 15 }
      ],
      confidenceRating: 75,
      detailedAnalysis: "O Canadá conta com sua geração mais veloz de transição rápida para desafiar o bloco defensivo rígido da Bósnia e Herzegovina. Um embate de propostas opostas nos gramados canadenses de Vancouver: o dinamismo vertical dos donos da casa contra a disciplina tática concentrada europeia.",
      tacticalRecommendation: "Canadá Empate Anula aposta (DNB Canadá) com cotação atrativa devido ao volume físico projetado e força do mando."
    },
    h2h: [
      { date: "Histórico", homeTeam: "Canadá", awayTeam: "Bósnia", homeScore: 1, awayScore: 1 }
    ]
  },
  {
    id: "4",
    leagueName: "Copa do Mundo FIFA 2026 - Grupo D",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "12/06/2026 22:00",
    homeTeam: {
      name: "Estados Unidos",
      shortName: "USA",
      form: ["W", "W", "D", "W", "D"],
      avgGoalsScored: 2.1,
      avgGoalsConceded: 0.8,
      homeWinRate: 85,
      awayWinRate: 60,
      leaguePosition: 1,
      injuries: ["McKennie (Pancada leve)"],
      color: "#1e3a8a"
    },
    awayTeam: {
      name: "Paraguai",
      shortName: "PAR",
      form: ["D", "W", "L", "W", "L"],
      avgGoalsScored: 1.4,
      avgGoalsConceded: 1.2,
      homeWinRate: 55,
      awayWinRate: 40,
      leaguePosition: 3,
      injuries: [],
      color: "#be123c"
    },
    stats: {
      possession: [50, 50],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0, 0],
      momentumHistory: [0]
    },
    predictions: {
      winProbHome: 58,
      drawProb: 24,
      winProbAway: 18,
      over25Prob: 60,
      bothToScoreProb: 58,
      nextGoalTeam: "HOME",
      nextGoalProb: 58,
      probableScores: [
        { score: "2 x 1", probability: 38 },
        { score: "1 x 1", probability: 28 },
        { score: "2 x 0", probability: 14 }
      ],
      confidenceRating: 85,
      detailedAnalysis: "Os Estados Unidos estreiam sob forte apoio da torcida no SoFi Stadium. A velocidade pelas pontas liderada por Christian Pulisic e o meio-campo dinâmico são os pontos principais dos norte-americanos para furar o tradicional sistema defensivo combativo paraguaio estruturado com bloco baixo.",
      tacticalRecommendation: "Excelente valor para vitória simples dos Estados Unidos dado o retrospecto de jogos e o forte apoio local da fanática torcida de Los Angeles."
    },
    h2h: [
      { date: "09/06/2018", homeTeam: "Estados Unidos", awayTeam: "Paraguai", homeScore: 1, awayScore: 0 }
    ]
  },
  {
    id: "5",
    leagueName: "Copa do Mundo FIFA 2026 - Grupo B",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "13/06/2026 16:00",
    homeTeam: {
      name: "Catar",
      shortName: "QAT",
      form: ["L", "W", "L", "D", "W"],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.4,
      homeWinRate: 60,
      awayWinRate: 35,
      leaguePosition: 4,
      injuries: [],
      color: "#86198f"
    },
    awayTeam: {
      name: "Suíça",
      shortName: "SUI",
      form: ["W", "D", "W", "W", "D"],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 0.9,
      homeWinRate: 75,
      awayWinRate: 55,
      leaguePosition: 2,
      injuries: ["Akanji (Dúvida por cansaço)"],
      color: "#dc2626"
    },
    stats: {
      possession: [50, 50],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0, 0],
      momentumHistory: [0]
    },
    predictions: {
      winProbHome: 18,
      drawProb: 27,
      winProbAway: 55,
      over25Prob: 58,
      bothToScoreProb: 50,
      nextGoalTeam: "AWAY",
      nextGoalProb: 60,
      probableScores: [
        { score: "0 x 2", probability: 35 },
        { score: "1 x 2", probability: 28 },
        { score: "1 x 1", probability: 18 }
      ],
      confidenceRating: 80,
      detailedAnalysis: "A Suíça carrega amplo favoritismo contra o Catar devido à sua estrutura tática compactada e vasta experiência em Copas do Mundo anteriores. O Catar buscará adotar postura reativa com linhas baixas para tentar achar bolas de contra-ataque rápido rasteiro.",
      tacticalRecommendation: "Vitória Simples da Suíça @1.65 é uma entrada fundamentada para consolidar as primeiras posições do Grupo B."
    },
    h2h: [
      { date: "14/11/2018", homeTeam: "Suíça", awayTeam: "Catar", homeScore: 0, awayScore: 1 }
    ]
  },
  {
    id: "6",
    leagueName: "Copa do Mundo FIFA 2026 - Grupo C",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "13/06/2026 19:00",
    homeTeam: {
      name: "Brasil",
      shortName: "BRA",
      form: ["W", "W", "W", "D", "W"],
      avgGoalsScored: 2.3,
      avgGoalsConceded: 0.7,
      homeWinRate: 90,
      awayWinRate: 65,
      leaguePosition: 1,
      injuries: ["Neymar (Preparação especial física)"],
      color: "#eab308"
    },
    awayTeam: {
      name: "Marrocos",
      shortName: "MAR",
      form: ["W", "D", "L", "W", "W"],
      avgGoalsScored: 1.8,
      avgGoalsConceded: 0.8,
      homeWinRate: 75,
      awayWinRate: 50,
      leaguePosition: 2,
      injuries: ["Ziyech (Preservado)"],
      color: "#047857"
    },
    stats: {
      possession: [50, 50],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0, 0],
      momentumHistory: [0]
    },
    predictions: {
      winProbHome: 62,
      drawProb: 23,
      winProbAway: 15,
      over25Prob: 65,
      bothToScoreProb: 58,
      nextGoalTeam: "HOME",
      nextGoalProb: 55,
      probableScores: [
        { score: "2 x 1", probability: 32 },
        { score: "2 x 0", probability: 28 },
        { score: "1 x 1", probability: 18 }
      ],
      confidenceRating: 90,
      detailedAnalysis: "Um dos confrontos mais grandiosos em clima de estreia. O Brasil entra em campo em ritmo de franco favoritismo técnico impulsionado pelo ataque dinâmico. No entanto, a seleção de Marrocos demonstrou primor de disciplina tática coletiva com contra-ataques letais e boa compactação.",
      tacticalRecommendation: "Vitória simples do Brasil ou mercado de Ambas Marcam (Sim) estimando um duelo ofensivo de altíssimo nível técnico."
    },
    h2h: [
      { date: "25/03/2023", homeTeam: "Marrocos", awayTeam: "Brasil", homeScore: 2, awayScore: 1 },
      { date: "16/06/1998", homeTeam: "Brasil", awayTeam: "Marrocos", homeScore: 3, awayScore: 0 }
    ]
  },
  {
    id: "7",
    leagueName: "Copa do Mundo FIFA 2026 - Grupo E",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "16/06/2026 16:00",
    homeTeam: {
      name: "Argentina",
      shortName: "ARG",
      form: ["W", "W", "W", "D", "W"],
      avgGoalsScored: 2.2,
      avgGoalsConceded: 0.8,
      homeWinRate: 85,
      awayWinRate: 60,
      leaguePosition: 1,
      injuries: [],
      color: "#38bdf8"
    },
    awayTeam: {
      name: "Argélia",
      shortName: "ALG",
      form: ["W", "L", "W", "W", "D"],
      avgGoalsScored: 1.5,
      avgGoalsConceded: 1.1,
      homeWinRate: 60,
      awayWinRate: 40,
      leaguePosition: 2,
      injuries: [],
      color: "#16a34a"
    },
    stats: {
      possession: [50, 50],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0, 0],
      momentumHistory: [0]
    },
    predictions: {
      winProbHome: 72,
      drawProb: 18,
      winProbAway: 10,
      over25Prob: 80,
      bothToScoreProb: 75,
      nextGoalTeam: "HOME",
      nextGoalProb: 60,
      probableScores: [
        { score: "3 x 1", probability: 40 },
        { score: "3 x 2", probability: 25 },
        { score: "2 x 1", probability: 18 }
      ],
      confidenceRating: 94,
      detailedAnalysis: "Argentina domina as ações com passes envolventes comandados por Lionel Messi. A Holanda tenta explorar os cruzamentos e a força aérea de Weghorst para descontar o placar no segundo tempo da partida.",
      tacticalRecommendation: "Excelente oportunidade para Mais de 3.5 Gols no jogo dado o ritmo frenético e alta precisão dos ataques."
    },
    h2h: [
      { date: "18/12/2022", homeTeam: "Argentina", awayTeam: "Holanda", homeScore: 2, awayScore: 2 }
    ]
  },
  // === PREMIER LEAGUE ===
  {
    id: "pl_1",
    leagueName: "Premier League 2025/26 - Jornada 38",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "12/06/2026 16:00",
    homeTeam: {
      name: "Manchester City",
      shortName: "MCI",
      form: ["W", "W", "D", "W", "W"],
      avgGoalsScored: 2.8,
      avgGoalsConceded: 0.9,
      homeWinRate: 88,
      awayWinRate: 72,
      leaguePosition: 1,
      injuries: ["De Bruyne (Recuperação muscular)"],
      color: "#6CABDD"
    },
    awayTeam: {
      name: "Arsenal",
      shortName: "ARS",
      form: ["W", "D", "W", "W", "L"],
      avgGoalsScored: 2.2,
      avgGoalsConceded: 1.0,
      homeWinRate: 80,
      awayWinRate: 58,
      leaguePosition: 2,
      injuries: ["Saka (Dúvida)"],
      color: "#EF0107"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 55, drawProb: 25, winProbAway: 20,
      over25Prob: 72, bothToScoreProb: 65,
      nextGoalTeam: "HOME", nextGoalProb: 58,
      probableScores: [{ score: "2 x 1", probability: 35 }, { score: "2 x 0", probability: 28 }, { score: "1 x 1", probability: 20 }],
      confidenceRating: 88,
      detailedAnalysis: "Clássico do Etihad entre os dois principais candidatos ao título da Premier League. O City tem o poder ofensivo, o Arsenal a organização tática. Duelo de filosofias com altas apostas.",
      tacticalRecommendation: "Ambas Marcam (Sim) com excelente cotação dado o histórico recente entre as equipes."
    },
    h2h: [
      { date: "08/02/2026", homeTeam: "Arsenal", awayTeam: "Manchester City", homeScore: 1, awayScore: 0 },
      { date: "22/10/2025", homeTeam: "Manchester City", awayTeam: "Arsenal", homeScore: 3, awayScore: 1 }
    ]
  },
  {
    id: "pl_2",
    leagueName: "Premier League 2025/26 - Jornada 38",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "12/06/2026 18:30",
    homeTeam: {
      name: "Liverpool",
      shortName: "LIV",
      form: ["W", "W", "W", "D", "W"],
      avgGoalsScored: 2.5,
      avgGoalsConceded: 0.8,
      homeWinRate: 85,
      awayWinRate: 68,
      leaguePosition: 3,
      injuries: ["Alisson (Indisponível)"],
      color: "#C8102E"
    },
    awayTeam: {
      name: "Chelsea",
      shortName: "CHE",
      form: ["D", "W", "L", "W", "W"],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 1.3,
      homeWinRate: 65,
      awayWinRate: 48,
      leaguePosition: 5,
      injuries: [],
      color: "#034694"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 60, drawProb: 22, winProbAway: 18,
      over25Prob: 68, bothToScoreProb: 60,
      nextGoalTeam: "HOME", nextGoalProb: 62,
      probableScores: [{ score: "2 x 0", probability: 32 }, { score: "2 x 1", probability: 28 }, { score: "3 x 1", probability: 18 }],
      confidenceRating: 82,
      detailedAnalysis: "Liverpool em excelente momento quer garantir a 3ª posição. Chelsea busca manter a 5ª vaga europeia. Partida com alta intensidade esperada em Anfield.",
      tacticalRecommendation: "Vitória simples do Liverpool com handicap asiático -1 é uma entrada estatisticamente sólida."
    },
    h2h: [
      { date: "01/03/2026", homeTeam: "Chelsea", awayTeam: "Liverpool", homeScore: 0, awayScore: 2 }
    ]
  },
  // === LA LIGA ===
  {
    id: "liga_1",
    leagueName: "La Liga 2025/26 - Jornada 38",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "12/06/2026 21:00",
    homeTeam: {
      name: "Real Madrid",
      shortName: "RMA",
      form: ["W", "W", "W", "W", "D"],
      avgGoalsScored: 2.7,
      avgGoalsConceded: 0.7,
      homeWinRate: 90,
      awayWinRate: 75,
      leaguePosition: 1,
      injuries: ["Bellingham (Suspensão)"],
      color: "#FEBE10"
    },
    awayTeam: {
      name: "FC Barcelona",
      shortName: "FCB",
      form: ["W", "D", "W", "L", "W"],
      avgGoalsScored: 2.4,
      avgGoalsConceded: 1.1,
      homeWinRate: 82,
      awayWinRate: 62,
      leaguePosition: 2,
      injuries: ["Pedri (Lesão no tornozelo)"],
      color: "#A50044"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 48, drawProb: 26, winProbAway: 26,
      over25Prob: 78, bothToScoreProb: 72,
      nextGoalTeam: "HOME", nextGoalProb: 50,
      probableScores: [{ score: "2 x 2", probability: 28 }, { score: "3 x 1", probability: 25 }, { score: "2 x 1", probability: 22 }],
      confidenceRating: 85,
      detailedAnalysis: "El Clásico! O duelo mais esperado do futebol mundial. Real Madrid quer confirmar o título em casa. Barcelona precisa da vitória para manter esperanças. Espetáculo garantido no Santiago Bernabéu.",
      tacticalRecommendation: "Mais de 2.5 Gols é a entrada mais valiosa neste tipo de confronto histórico com média alta de gols."
    },
    h2h: [
      { date: "26/10/2025", homeTeam: "FC Barcelona", awayTeam: "Real Madrid", homeScore: 1, awayScore: 4 },
      { date: "03/03/2026", homeTeam: "Real Madrid", awayTeam: "FC Barcelona", homeScore: 2, awayScore: 2 }
    ]
  },
  {
    id: "liga_2",
    leagueName: "La Liga 2025/26 - Jornada 38",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "12/06/2026 19:00",
    homeTeam: {
      name: "Atlético de Madrid",
      shortName: "ATM",
      form: ["W", "W", "D", "W", "W"],
      avgGoalsScored: 2.0,
      avgGoalsConceded: 0.8,
      homeWinRate: 78,
      awayWinRate: 60,
      leaguePosition: 3,
      injuries: [],
      color: "#CB3524"
    },
    awayTeam: {
      name: "Sevilla",
      shortName: "SEV",
      form: ["L", "D", "W", "L", "D"],
      avgGoalsScored: 1.3,
      avgGoalsConceded: 1.5,
      homeWinRate: 55,
      awayWinRate: 35,
      leaguePosition: 8,
      injuries: ["Rakitić (Lesionado)"],
      color: "#D4262C"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 65, drawProb: 22, winProbAway: 13,
      over25Prob: 52, bothToScoreProb: 45,
      nextGoalTeam: "HOME", nextGoalProb: 65,
      probableScores: [{ score: "2 x 0", probability: 38 }, { score: "2 x 1", probability: 28 }, { score: "1 x 0", probability: 18 }],
      confidenceRating: 80,
      detailedAnalysis: "Atlético sólido em casa com Simeone no comando. Sevilla em queda livre e sem grandes pretensões para esta jornada final.",
      tacticalRecommendation: "Vitória do Atlético a Ganhar/Empatar (DNB) é a entrada mais conservadora e lucrativa."
    },
    h2h: [
      { date: "15/02/2026", homeTeam: "Sevilla", awayTeam: "Atlético de Madrid", homeScore: 0, awayScore: 1 }
    ]
  },
  // === BUNDESLIGA ===
  {
    id: "bun_1",
    leagueName: "Bundesliga 2025/26 - Jornada 34",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "13/06/2026 15:30",
    homeTeam: {
      name: "Bayern München",
      shortName: "BAY",
      form: ["W", "W", "W", "W", "W"],
      avgGoalsScored: 3.1,
      avgGoalsConceded: 0.8,
      homeWinRate: 92,
      awayWinRate: 78,
      leaguePosition: 1,
      injuries: [],
      color: "#DC052D"
    },
    awayTeam: {
      name: "Borussia Dortmund",
      shortName: "BVB",
      form: ["W", "D", "W", "W", "L"],
      avgGoalsScored: 2.2,
      avgGoalsConceded: 1.2,
      homeWinRate: 75,
      awayWinRate: 52,
      leaguePosition: 3,
      injuries: ["Reus (Aposentado)", "Sancho (Dúvida)"],
      color: "#FDE100"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 62, drawProb: 20, winProbAway: 18,
      over25Prob: 82, bothToScoreProb: 70,
      nextGoalTeam: "HOME", nextGoalProb: 64,
      probableScores: [{ score: "3 x 1", probability: 35 }, { score: "2 x 1", probability: 28 }, { score: "3 x 2", probability: 18 }],
      confidenceRating: 87,
      detailedAnalysis: "Der Klassiker! A rivalidade mais intensa da Alemanha. Bayern invicto em casa nesta temporada. Dortmund tenta quebrar esta sequência com sua velocidade nas pontas.",
      tacticalRecommendation: "Ambas Marcam e Mais de 2.5 Gols são as entradas mais seguras neste confronto historicamente elétrico."
    },
    h2h: [
      { date: "02/11/2025", homeTeam: "Borussia Dortmund", awayTeam: "Bayern München", homeScore: 1, awayScore: 4 }
    ]
  },
  // === SERIE A ===
  {
    id: "sa_1",
    leagueName: "Serie A 2025/26 - Jornada 38",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "13/06/2026 20:45",
    homeTeam: {
      name: "Inter de Milão",
      shortName: "INT",
      form: ["W", "W", "W", "D", "W"],
      avgGoalsScored: 2.4,
      avgGoalsConceded: 0.7,
      homeWinRate: 85,
      awayWinRate: 65,
      leaguePosition: 1,
      injuries: [],
      color: "#010E80"
    },
    awayTeam: {
      name: "AC Milan",
      shortName: "MIL",
      form: ["D", "W", "L", "W", "D"],
      avgGoalsScored: 1.8,
      avgGoalsConceded: 1.2,
      homeWinRate: 65,
      awayWinRate: 50,
      leaguePosition: 4,
      injuries: ["Leão (Leve musculatura)"],
      color: "#FB090B"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 58, drawProb: 25, winProbAway: 17,
      over25Prob: 60, bothToScoreProb: 55,
      nextGoalTeam: "HOME", nextGoalProb: 60,
      probableScores: [{ score: "2 x 0", probability: 32 }, { score: "2 x 1", probability: 28 }, { score: "1 x 0", probability: 20 }],
      confidenceRating: 84,
      detailedAnalysis: "Derby della Madonnina! Inter confirma o título em casa. Milan tenta manter viva a esperança de Champions. Um dos derbies mais apaixonantes do mundo.",
      tacticalRecommendation: "Vitória simples da Inter tem valor elevado dado o favoritismo absoluto no confronto direto desta temporada."
    },
    h2h: [
      { date: "05/01/2026", homeTeam: "AC Milan", awayTeam: "Inter de Milão", homeScore: 0, awayScore: 2 }
    ]
  },
  {
    id: "sa_2",
    leagueName: "Serie A 2025/26 - Jornada 38",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "13/06/2026 20:45",
    homeTeam: {
      name: "Juventus",
      shortName: "JUV",
      form: ["W", "D", "W", "W", "D"],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 0.9,
      homeWinRate: 78,
      awayWinRate: 58,
      leaguePosition: 2,
      injuries: [],
      color: "#000000"
    },
    awayTeam: {
      name: "Napoli",
      shortName: "NAP",
      form: ["W", "W", "D", "W", "W"],
      avgGoalsScored: 2.2,
      avgGoalsConceded: 0.9,
      homeWinRate: 82,
      awayWinRate: 62,
      leaguePosition: 3,
      injuries: ["Osimhen (Preservado para Copa)"],
      color: "#12A0C3"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 45, drawProb: 28, winProbAway: 27,
      over25Prob: 62, bothToScoreProb: 60,
      nextGoalTeam: "AWAY", nextGoalProb: 52,
      probableScores: [{ score: "1 x 2", probability: 30 }, { score: "1 x 1", probability: 28 }, { score: "2 x 1", probability: 22 }],
      confidenceRating: 78,
      detailedAnalysis: "Confronto de alto nível entre dois postulantes ao top 3 da Serie A. Napoli chega embalado e deve pressionar desde o início do jogo.",
      tacticalRecommendation: "Vitória do Napoli como visitante tem cotação atrativa dado o bom momento da equipe napolitana."
    },
    h2h: [
      { date: "22/02/2026", homeTeam: "Napoli", awayTeam: "Juventus", homeScore: 2, awayScore: 1 }
    ]
  },
  // === LIGUE 1 ===
  {
    id: "l1_1",
    leagueName: "Ligue 1 2025/26 - Jornada 34",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "14/06/2026 20:00",
    homeTeam: {
      name: "Paris Saint-Germain",
      shortName: "PSG",
      form: ["W", "W", "W", "W", "W"],
      avgGoalsScored: 3.0,
      avgGoalsConceded: 0.6,
      homeWinRate: 92,
      awayWinRate: 78,
      leaguePosition: 1,
      injuries: [],
      color: "#003370"
    },
    awayTeam: {
      name: "Olympique de Marseille",
      shortName: "OM",
      form: ["W", "D", "W", "L", "W"],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 1.1,
      homeWinRate: 70,
      awayWinRate: 48,
      leaguePosition: 3,
      injuries: [],
      color: "#26A0D8"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 70, drawProb: 18, winProbAway: 12,
      over25Prob: 75, bothToScoreProb: 60,
      nextGoalTeam: "HOME", nextGoalProb: 70,
      probableScores: [{ score: "3 x 1", probability: 35 }, { score: "2 x 0", probability: 28 }, { score: "3 x 0", probability: 18 }],
      confidenceRating: 90,
      detailedAnalysis: "Le Classique! PSG domina a Ligue 1 mas o Marseille sempre eleva o nível. A rivalidade histórica movimenta toda a França neste confronto de alto voltagem emocional.",
      tacticalRecommendation: "PSG vence com mais de 1.5 gols marcados é a entrada mais confiável neste Le Classique."
    },
    h2h: [
      { date: "27/10/2025", homeTeam: "Olympique de Marseille", awayTeam: "Paris Saint-Germain", homeScore: 1, awayScore: 3 }
    ]
  },
  // === CHAMPIONS LEAGUE ===
  {
    id: "ucl_1",
    leagueName: "UEFA Champions League 2025/26 - Final",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "15/06/2026 20:00",
    homeTeam: {
      name: "Manchester City",
      shortName: "MCI",
      form: ["W", "W", "D", "W", "W"],
      avgGoalsScored: 2.5,
      avgGoalsConceded: 0.8,
      homeWinRate: 85,
      awayWinRate: 70,
      leaguePosition: 1,
      injuries: ["Haaland (Dúvida físico)"],
      color: "#6CABDD"
    },
    awayTeam: {
      name: "Real Madrid",
      shortName: "RMA",
      form: ["W", "W", "W", "D", "W"],
      avgGoalsScored: 2.3,
      avgGoalsConceded: 0.8,
      homeWinRate: 88,
      awayWinRate: 72,
      leaguePosition: 1,
      injuries: [],
      color: "#FEBE10"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 48, drawProb: 26, winProbAway: 26,
      over25Prob: 68, bothToScoreProb: 62,
      nextGoalTeam: "HOME", nextGoalProb: 50,
      probableScores: [{ score: "2 x 1", probability: 28 }, { score: "1 x 1", probability: 25 }, { score: "2 x 2", probability: 22 }],
      confidenceRating: 88,
      detailedAnalysis: "A grande final da Champions League! Dois gigantes europeus disputam o troféu máximo do futebol de clubes. Manchester City quer a segunda Champions. Real Madrid quer o 16º título.",
      tacticalRecommendation: "Ambas Marcam (Sim) com prorrogação possível. Mercado de gols individuais de Haaland tem alto valor."
    },
    h2h: [
      { date: "26/04/2023", homeTeam: "Real Madrid", awayTeam: "Manchester City", homeScore: 1, awayScore: 1 }
    ]
  },
  // === BRASILEIRÃO ===
  {
    id: "bra_1",
    leagueName: "Brasileirão Série A 2026 - Rodada 14",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "14/06/2026 18:30",
    homeTeam: {
      name: "Flamengo",
      shortName: "FLA",
      form: ["W", "W", "D", "W", "W"],
      avgGoalsScored: 2.3,
      avgGoalsConceded: 0.9,
      homeWinRate: 82,
      awayWinRate: 60,
      leaguePosition: 1,
      injuries: ["Pedro (Corte no joelho)"],
      color: "#CC0000"
    },
    awayTeam: {
      name: "Palmeiras",
      shortName: "PAL",
      form: ["W", "D", "W", "W", "L"],
      avgGoalsScored: 2.0,
      avgGoalsConceded: 0.8,
      homeWinRate: 78,
      awayWinRate: 55,
      leaguePosition: 2,
      injuries: [],
      color: "#006437"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 52, drawProb: 28, winProbAway: 20,
      over25Prob: 58, bothToScoreProb: 55,
      nextGoalTeam: "HOME", nextGoalProb: 55,
      probableScores: [{ score: "2 x 1", probability: 32 }, { score: "1 x 0", probability: 28 }, { score: "1 x 1", probability: 22 }],
      confidenceRating: 82,
      detailedAnalysis: "O Fla-Palestra é um dos jogos mais aguardados do Brasileirão. Flamengo em casa com a Nação Rubro-Negra empurrando. Palmeiras resiliente e bem treinado por Abel Ferreira.",
      tacticalRecommendation: "Vitória do Flamengo em casa tem valor elevado considerando o mandante e a fase atual das equipes."
    },
    h2h: [
      { date: "15/09/2025", homeTeam: "Palmeiras", awayTeam: "Flamengo", homeScore: 0, awayScore: 1 },
      { date: "05/05/2025", homeTeam: "Flamengo", awayTeam: "Palmeiras", homeScore: 2, awayScore: 0 }
    ]
  },
  {
    id: "bra_2",
    leagueName: "Brasileirão Série A 2026 - Rodada 14",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "15/06/2026 16:00",
    homeTeam: {
      name: "São Paulo",
      shortName: "SPF",
      form: ["D", "W", "L", "W", "D"],
      avgGoalsScored: 1.6,
      avgGoalsConceded: 1.1,
      homeWinRate: 65,
      awayWinRate: 45,
      leaguePosition: 5,
      injuries: ["Calleri (Contusão)"],
      color: "#FF0000"
    },
    awayTeam: {
      name: "Corinthians",
      shortName: "COR",
      form: ["L", "D", "W", "L", "D"],
      avgGoalsScored: 1.2,
      avgGoalsConceded: 1.3,
      homeWinRate: 52,
      awayWinRate: 38,
      leaguePosition: 10,
      injuries: [],
      color: "#000000"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 48, drawProb: 32, winProbAway: 20,
      over25Prob: 42, bothToScoreProb: 48,
      nextGoalTeam: "HOME", nextGoalProb: 50,
      probableScores: [{ score: "1 x 0", probability: 32 }, { score: "1 x 1", probability: 30 }, { score: "2 x 0", probability: 18 }],
      confidenceRating: 72,
      detailedAnalysis: "Majestoso! Clássico paulistano com São Paulo em melhor fase mas Corinthians sempre eleva o nível nos jogos de rivalidade. Espera-se um jogo disputado e físico.",
      tacticalRecommendation: "Menos de 2.5 Gols é um mercado atrativo dado o momento irregular de ambas as equipes."
    },
    h2h: [
      { date: "11/10/2025", homeTeam: "Corinthians", awayTeam: "São Paulo", homeScore: 1, awayScore: 1 }
    ]
  },
  // === EUROPA LEAGUE ===
  {
    id: "uel_1",
    leagueName: "UEFA Europa League 2025/26 - Final",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    startTime: "13/06/2026 20:00",
    homeTeam: {
      name: "Tottenham Hotspur",
      shortName: "TOT",
      form: ["W", "W", "D", "W", "D"],
      avgGoalsScored: 2.0,
      avgGoalsConceded: 1.1,
      homeWinRate: 72,
      awayWinRate: 55,
      leaguePosition: 4,
      injuries: ["Son (Pré Copa do Mundo)"],
      color: "#132257"
    },
    awayTeam: {
      name: "Eintracht Frankfurt",
      shortName: "SGE",
      form: ["W", "D", "W", "W", "W"],
      avgGoalsScored: 2.1,
      avgGoalsConceded: 1.0,
      homeWinRate: 70,
      awayWinRate: 52,
      leaguePosition: 5,
      injuries: [],
      color: "#E1000F"
    },
    stats: { possession: [50, 50], shotsOnTarget: [0, 0], corners: [0, 0], yellowCards: [0, 0], redCards: [0, 0], xG: [0, 0], momentumHistory: [0] },
    predictions: {
      winProbHome: 45, drawProb: 28, winProbAway: 27,
      over25Prob: 65, bothToScoreProb: 62,
      nextGoalTeam: "HOME", nextGoalProb: 48,
      probableScores: [{ score: "2 x 1", probability: 30 }, { score: "1 x 1", probability: 28 }, { score: "2 x 2", probability: 20 }],
      confidenceRating: 76,
      detailedAnalysis: "Final equilibrada entre dois clubes tradicionais europeus. Tottenham busca seu primeiro título continental. Frankfurt quer repetir o feito da Europa League 2022.",
      tacticalRecommendation: "Ambas Marcam (Sim) é a entrada mais valiosa em uma final equilibrada com tendência a gols de ambos os lados."
    },
    h2h: [
      { date: "10/12/2025", homeTeam: "Eintracht Frankfurt", awayTeam: "Tottenham Hotspur", homeScore: 1, awayScore: 2 }
    ]
  }
];
}
let databaseMatches: FootballMatch[] = getInitialMatches();

// Active ticker messages logger for simulation
let matchLogs: { [matchId: string]: string[] } = {
  "1": [
    "90'- Fim de jogo! O México vence a África do Sul por 2x0 no jogo de abertura!",
    "82'- Gol do México! Raúl Jiménez bate rasteiro no canto e amplia! MEX 2 - 0 RSA",
    "41'- Gol do México! Julián Quiñones abre o placar de cabeça após cruzamento! MEX 1 - 0 RSA",
    "15'- México pressiona no campo de ataque sob forte apoio dos torcedores."
  ],
  "2": ["28'- Gol da Coreia do Sul! Son Heung-min chuta com categoria no ângulo esquerdo! KOR 1 - 0 CZE", "15'- CARTÃO AMARELO para zagueiro da Tchéquia por falta violenta.", "10'- Tchéquia tenta preencher as linhas mas sofre com intensidade do ataque coreano."],
  "3": ["A partida ainda não começou. Clima de Copa do Mundo em Vancouver!"],
  "4": ["A partida ainda não começou. Torcida local enche o SoFi Stadium para estreia dos EUA!"],
  "5": ["A partida ainda não começou. Seleções iniciam preparação tática em campo."],
  "6": ["A partida ainda não começou. Clima de rivalidade internacional nas alturas para o clássico."],
  "7": [
    "65'- Gol da Argentina! Lautaro Martínez empurra para as redes após linda jogada de Messi! ARG 3 - 1 NED",
    "45'- Intervalo de Jogo. Partida espetacular com domínio tático de ambos os lados.",
    "32'- Gol da Holanda! Memphis Depay desconta em finalização precisa na saída do goleiro! ARG 2 - 1 NED",
    "18'- Gol da Argentina! Messi bate pênalti com extrema categoria e amplia! ARG 2 - 0 NED",
    "05'- Gol da Argentina! Julián Álvarez abre o placar em contra-ataque relâmpago! ARG 1 - 0 NED"
  ]
};

// GET current matches
app.get("/api/matches", (req, res) => {
  res.json({
    matches: databaseMatches,
    logs: matchLogs
  });
});

// POST reset matches to initial
app.post("/api/matches/reset", (req, res) => {
  databaseMatches = getInitialMatches();
  matchLogs = {
    "1": [
      "90'- Fim de jogo! O México vence a África do Sul por 2x0 no jogo de abertura!",
      "82'- Gol do México! Raúl Jiménez bate rasteiro no canto e amplia! MEX 2 - 0 RSA",
      "41'- Gol do México! Julián Quiñones abre o placar de cabeça após cruzamento! MEX 1 - 0 RSA",
      "15'- México pressiona no campo de ataque sob forte apoio dos torcedores."
    ],
    "2": ["28'- Gol da Coreia do Sul! Son Heung-min chuta com categoria no ângulo esquerdo! KOR 1 - 0 CZE", "15'- CARTÃO AMARELO para zagueiro da Tchéquia por falta violenta.", "10'- Tchéquia tenta preencher as linhas mas sofre com intensidade do ataque coreano."],
    "10": [], // place holder safe guard
    "3": ["A partida ainda não começou. Clima de Copa do Mundo em Vancouver!"],
    "4": ["A partida ainda não começou. Torcida local enche o SoFi Stadium para estreia dos EUA!"],
    "5": ["A partida ainda não começou. Seleções iniciam preparação tática em campo."],
    "6": ["A partida ainda não começou. Clima de rivalidade internacional nas alturas para o clássico."],
    "7": [
      "65'- Gol da Argentina! Lautaro Martínez empurra para as redes após linda jogada de Messi! ARG 3 - 1 NED",
      "45'- Intervalo de Jogo. Partida espetacular com domínio tático de ambos os lados.",
      "32'- Gol da Holanda! Memphis Depay desconta em finalização precisa na saída do goleiro! ARG 2 - 1 NED",
      "18'- Gol da Argentina! Messi bate pênalti com extrema categoria e amplia! ARG 2 - 0 NED",
      "05'- Gol da Argentina! Julián Álvarez abre o placar em contra-ataque relâmpago! ARG 1 - 0 NED"
    ]
  };
  res.json({ status: "success", matches: databaseMatches, logs: matchLogs });
});

// POST to start a pre-match game live in real-time!
app.post("/api/matches/:id/go-live", (req, res) => {
  const matchId = req.params.id;
  const match = databaseMatches.find(m => m.id === matchId);
  if (match) {
    match.status = MatchStatus.LIVE;
    match.minute = 1; // Start at minute 1
    match.homeScore = 0;
    match.awayScore = 0;
    match.stats = {
      possession: [50, 50],
      shotsOnTarget: [1, 1],
      corners: [1, 1],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0.15, 0.12],
      momentumHistory: [0, 5, -8, 12]
    };
    matchLogs[matchId] = [`1'- Apito inicial da IA! A partida entre ${match.homeTeam.name} e ${match.awayTeam.name} agora está sendo simulada EM TEMPO REAL.`];
    res.json({ status: "success", matches: databaseMatches, logs: matchLogs });
  } else {
    res.status(404).json({ error: "Partida não encontrada" });
  }
});

// POST to tick/simulate the minute advancement of all LIVE matches
app.post("/api/matches/simulate", (req, res) => {
  databaseMatches.forEach((match) => {
    if (match.status !== MatchStatus.LIVE) return;

    // Advance minute
    match.minute += 1;
    if (match.minute >= 90) {
      match.status = MatchStatus.FINISHED;
      match.minute = 90;
      if (!matchLogs[match.id]) matchLogs[match.id] = [];
      matchLogs[match.id].unshift(`90' - Fim de partida regulamentar encerrada! Placar final: ${match.homeScore} x ${match.awayScore}.`);
      return;
    }

    if (!matchLogs[match.id]) matchLogs[match.id] = [];

    // Periodic actions (Every tick has a chance of triggering shots, corners, goals, yellow cards or momentum swing)
    const seed = Math.random();

    // 1. Momentum variation
    const currentMomentum = match.stats.momentumHistory[match.stats.momentumHistory.length - 1] || 0;
    // Add swing towards random side
    const swing = Math.floor(Math.random() * 41) - 20; // -20 to +20
    const newMomentum = Math.max(-100, Math.min(100, currentMomentum + swing));
    match.stats.momentumHistory.push(newMomentum);
    if (match.stats.momentumHistory.length > 25) {
      match.stats.momentumHistory.shift();
    }

    // 1b. Update possession dynamically based on rolling momentum average
    const recentMomentum = match.stats.momentumHistory.slice(-10);
    const avgRecent = recentMomentum.reduce((a, b) => a + b, 0) / recentMomentum.length;
    // avgRecent -100..100 → possession 35..65
    const newHomePoss = Math.round(50 + (avgRecent * 0.15));
    match.stats.possession[0] = Math.max(35, Math.min(65, newHomePoss));
    match.stats.possession[1] = 100 - match.stats.possession[0];

    // 2. Chance of Shot on target
    if (seed < 0.12) {
      const isHome = Math.random() < (newMomentum + 100) / 200; // higher momentum increases shot chance
      if (isHome) {
        match.stats.shotsOnTarget[0] += 1;
        match.stats.xG[0] = parseFloat((match.stats.xG[0] + 0.11).toFixed(2));
        matchLogs[match.id].unshift(`${match.minute}' - Finalização perigosa do ${match.homeTeam.name}! Defesa do goleiro.`);
      } else {
        match.stats.shotsOnTarget[1] += 1;
        match.stats.xG[1] = parseFloat((match.stats.xG[1] + 0.09).toFixed(2));
        matchLogs[match.id].unshift(`${match.minute}' - Ataque organizado do ${match.awayTeam.name} termina em bom chute defendido.`);
      }
    }

    // 3. Chance of Corner (15% per tick → ~13 corners/90min on average, realistic range)
    if (seed >= 0.12 && seed < 0.27) {
      const isHome = Math.random() < (0.5 + (newMomentum / 400)); // momentum slightly biases corners
      const cornerMsgs = isHome ? [
        `${match.minute}' - 🚩 Escanteio para o ${match.homeTeam.name}! Bola desviada pela zaga adversária.`,
        `${match.minute}' - 🚩 Cobrança de canto conquistada pelo ${match.homeTeam.name} após pressão ofensiva.`,
        `${match.minute}' - 🚩 ${match.homeTeam.name} ganha escanteio. Bola cobrada na área — zaga afasta!`,
      ] : [
        `${match.minute}' - 🚩 Escanteio para o ${match.awayTeam.name}! Zaga mandante desvia para escanteio.`,
        `${match.minute}' - 🚩 Canto cobrado pelo ${match.awayTeam.name}. Defesa do ${match.homeTeam.name} afasta a ameaça.`,
        `${match.minute}' - 🚩 ${match.awayTeam.name} conquista escanteio após boa movimentação no ataque.`,
      ];
      const msg = cornerMsgs[Math.floor(Math.random() * cornerMsgs.length)];
      if (isHome) {
        match.stats.corners[0] += 1;
      } else {
        match.stats.corners[1] += 1;
      }
      matchLogs[match.id].unshift(msg);
    }

    // 4. Chance of Yellow card
    if (seed >= 0.22 && seed < 0.25) {
      const isHome = Math.random() < 0.5;
      if (isHome) {
        match.stats.yellowCards[0] += 1;
        matchLogs[match.id].unshift(`${match.minute}' - CARTÃO AMARELO para o jogador do ${match.homeTeam.name} por puxão de camisa.`);
      } else {
        match.stats.yellowCards[1] += 1;
        matchLogs[match.id].unshift(`${match.minute}' - CARTÃO AMARELO com aviso ríspido após tranco violento do zagueiro do ${match.awayTeam.name}.`);
      }
    }

    // 5. Chance of GOAL! (Uses stats and xG weights)
    if (seed >= 0.96) {
      const isHome = Math.random() < (match.predictions.winProbHome / (match.predictions.winProbHome + match.predictions.winProbAway));
      if (isHome) {
        match.homeScore += 1;
        match.stats.xG[0] = parseFloat((match.stats.xG[0] + 0.75).toFixed(2));
        matchLogs[match.id].unshift(`${match.minute}' - ⚽ GOOOL DO ${match.homeTeam.name.toUpperCase()}! Placar atualizado: ${match.homeScore} x ${match.awayScore}! Festa dos torcedores!`);
        
        // Recalculate IA values briefly to adapt to goal
        match.predictions.winProbHome = Math.min(95, match.predictions.winProbHome + 15);
        match.predictions.winProbAway = Math.max(2, match.predictions.winProbAway - 12);
        match.predictions.drawProb = 100 - (match.predictions.winProbHome + match.predictions.winProbAway);
        match.predictions.nextGoalTeam = "AWAY";
        match.predictions.nextGoalProb = 52;
      } else {
        match.awayScore += 1;
        match.stats.xG[1] = parseFloat((match.stats.xG[1] + 0.75).toFixed(2));
        matchLogs[match.id].unshift(`${match.minute}' - ⚽ GOOOL DO ${match.awayTeam.name.toUpperCase()}! Placar atualizado: ${match.homeScore} x ${match.awayScore}! Silêncio no estádio mandante!`);

        // Recalculate IA values briefly to adapt to goal
        match.predictions.winProbAway = Math.min(92, match.predictions.winProbAway + 18);
        match.predictions.winProbHome = Math.max(3, match.predictions.winProbHome - 14);
        match.predictions.drawProb = 100 - (match.predictions.winProbHome + match.predictions.winProbAway);
        match.predictions.nextGoalTeam = "HOME";
        match.predictions.nextGoalProb = 55;
      }
    }
  });

  res.json({
    status: "success",
    matches: databaseMatches,
    logs: matchLogs
  });
});

// POST to create a customized match prediction dynamically using Gemini API!
app.post("/api/matches/analyze", async (req, res) => {
  const { homeTeam, awayTeam } = req.body;
  if (!homeTeam || !awayTeam) {
    return res.status(400).json({ error: "Nomes das equipes são obrigatórios" });
  }

  const client = getGroqClient();
  const simulatedId = "custom_" + Date.now();

  const mockGeneratedMatch: FootballMatch = {
    id: simulatedId,
    leagueName: "Amistoso Internacional - IA",
    status: MatchStatus.PRE_MATCH,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    homeTeam: {
      name: homeTeam,
      shortName: homeTeam.slice(0, 3).toUpperCase(),
      form: ["W", "D", "W", "L", "W"],
      avgGoalsScored: 1.9,
      avgGoalsConceded: 1.1,
      homeWinRate: 65,
      awayWinRate: 35,
      leaguePosition: 4,
      injuries: ["Destaques indisponíveis serão definidos no pré-jogo."],
      color: "#1d4ed8" // Default blue
    },
    awayTeam: {
      name: awayTeam,
      shortName: awayTeam.slice(0, 3).toUpperCase(),
      form: ["D", "W", "L", "W", "D"],
      avgGoalsScored: 1.6,
      avgGoalsConceded: 1.2,
      homeWinRate: 55,
      awayWinRate: 40,
      leaguePosition: 7,
      injuries: [],
      color: "#b91c1c" // Default red
    },
    stats: {
      possession: [50, 50],
      shotsOnTarget: [0, 0],
      corners: [0, 0],
      yellowCards: [0, 0],
      redCards: [0, 0],
      xG: [0.0, 0.0],
      momentumHistory: [0]
    },
    predictions: {
      winProbHome: 46,
      drawProb: 28,
      winProbAway: 26,
      over25Prob: 55,
      bothToScoreProb: 61,
      nextGoalTeam: "HOME",
      nextGoalProb: 54,
      probableScores: [
        { score: "2 x 1", probability: 35 },
        { score: "1 x 1", probability: 28 },
        { score: "1 x 0", probability: 18 }
      ],
      confidenceRating: 75,
      detailedAnalysis: `Análise simulada de pré-jogo entre ${homeTeam} e ${awayTeam}. O confronto promete equilíbrio dadas as médias recentes de aproveitamento ofensivo.`,
      tacticalRecommendation: "Modelo estatístico indica inclinação sutil para vitória do mandante ou Ambas Marcam."
    },
    h2h: [
      { date: "Histórico", homeTeam, awayTeam, homeScore: 2, awayScore: 2 }
    ]
  };

  if (!client) {
    // If Groq is not fully configured, return high-fidelity mock calculations but label them as simulated
    console.log("No Groq API key configured, active client fallback simulation triggered.");
    databaseMatches.unshift(mockGeneratedMatch);
    matchLogs[simulatedId] = ["Aguardando início da simulação. Dados formulados por algoritmos locais padrão."];
    return res.json({
      match: mockGeneratedMatch,
      isSimulated: true,
      message: "Sucesso! Analisado usando o algoritmo inteligente local (Insira a sua chave Groq no painel de Segredos para ativar a IA avançada em tempo real)."
    });
  }

  try {
    const prompt = `Analise detalhadamente o jogo de futebol entre as equipes: "${homeTeam}" e "${awayTeam}". 
Sendo você um analista preditivo profissional de altíssimo nível, retorne dados consistentes em formato JSON.
Considere dados do histórico real (se existirem) ou projete cenários táticos realistas baseados na força esportiva dessas equipes.
Defina a liga plausível para o confronto, uma cor de identificação para cada time (ex: "#f87171" ou "#3b82f6"), posições das equipes na tabela (posições plausíveis de 1 a 20), desfalques/lesões interessantes se existirem, formas recentes, estatísticas de probabilidade (que somadas deem 100% para Vitória Mandante + Empate + Vitória Visitante), probabilidade de gols Over 2.5 e Ambas Marcam, e uma análise tática e recomendação ricas em português detalhado.

EXIJO que o seu retorno seja ÚNICA E EXCLUSIVAMENTE o conteúdo do JSON, sem comentários fora, formatado exatamente conforme a estrutura JSON a seguir:
{
  "leagueName": "Nome da Liga ou Campeonato Plausível",
  "homeTeam": {
    "name": "Nome Completo do Mandante",
    "shortName": "Código de 3 letras",
    "form": ["W", "D", "L", "W", "W"], // exatos 5 elementos de forma
    "avgGoalsScored": 2.1,
    "avgGoalsConceded": 0.9,
    "homeWinRate": 72,
    "awayWinRate": 40,
    "leaguePosition": 3,
    "injuries": ["Nome do jogador (Razão da lesão)"],
    "color": "cor hex tática coerente com o clube"
  },
  "awayTeam": {
    "name": "Nome Completo do Visitante",
    "shortName": "Código de 3 letras",
    "form": ["D", "W", "L", "D", "W"], // exatos 5 elementos
    "avgGoalsScored": 1.4,
    "avgGoalsConceded": 1.5,
    "homeWinRate": 50,
    "awayWinRate": 30,
    "leaguePosition": 12,
    "injuries": ["Jogador suspenso/lesionado"],
    "color": "cor hex coerente com o clube"
  },
  "predictions": {
    "winProbHome": 54, // valor inteiro de 0 a 100
    "drawProb": 26, // valor inteiro de 0 a 100
    "winProbAway": 20, // valor inteiro de 0 a 100 (winProbHome + drawProb + winProbAway DEVE somar 100)
    "over25Prob": 65, // probabilidade Over 2.5 gols
    "bothToScoreProb": 58, // probabilidade Ambas Marcam
    "nextGoalTeam": "HOME", // "HOME", "AWAY" ou "NONE"
    "nextGoalProb": 62,
    "confidenceRating": 82, // nível de confiança da IA em porcentagem
    "detailedAnalysis": "Texto detalhado escrito por você com pelo menos 3 linhas explicando o modelo físico-tático, a forma dos atacantes, os problemas no meio campo e o panorama global do que vai ditar o confronto.",
    "tacticalRecommendation": "Conselho de aposta estatístico curto e valioso baseado nos números.",
    "probableScores": [
      { "score": "2 x 1", "probability": 34 },
      { "score": "1 x 1", "probability": 25 },
      { "score": "2 x 0", "probability": 15 }
    ]
  },
  "h2h": [
    { "date": "14/04/2026", "homeTeam": "Nome do Time Home", "awayTeam": "Nome do Time Away", "homeScore": 2, "awayScore": 1 },
    { "date": "19/10/2025", "homeTeam": "Nome do Time Away", "awayTeam": "Nome do Time Home", "homeScore": 1, "awayScore": 1 }
  ]
}`;

    const response = await client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      response_format: { type: "json_object" }
    });

    const outputText = response.choices[0].message.content || "";
    const parsedData = JSON.parse(outputText.trim());

    // Construct full match object back-end
    const newMatch: FootballMatch = {
      id: "custom_" + Date.now(),
      leagueName: parsedData.leagueName || "Liga Gerada por IA",
      status: MatchStatus.PRE_MATCH,
      minute: 0,
      homeScore: 0,
      awayScore: 0,
      homeTeam: {
        name: parsedData.homeTeam.name || homeTeam,
        shortName: parsedData.homeTeam.shortName || homeTeam.slice(0, 3).toUpperCase(),
        form: parsedData.homeTeam.form || ["W", "D", "W"],
        avgGoalsScored: Number(parsedData.homeTeam.avgGoalsScored) || 1.5,
        avgGoalsConceded: Number(parsedData.homeTeam.avgGoalsConceded) || 1.2,
        homeWinRate: Number(parsedData.homeTeam.homeWinRate) || 50,
        awayWinRate: Number(parsedData.homeTeam.awayWinRate) || 30,
        leaguePosition: Number(parsedData.homeTeam.leaguePosition) || 10,
        injuries: parsedData.homeTeam.injuries || [],
        color: parsedData.homeTeam.color || "#10b981"
      },
      awayTeam: {
        name: parsedData.awayTeam.name || awayTeam,
        shortName: parsedData.awayTeam.shortName || awayTeam.slice(0, 3).toUpperCase(),
        form: parsedData.awayTeam.form || ["D", "L", "W"],
        avgGoalsScored: Number(parsedData.awayTeam.avgGoalsScored) || 1.2,
        avgGoalsConceded: Number(parsedData.awayTeam.avgGoalsConceded) || 1.5,
        homeWinRate: Number(parsedData.awayTeam.homeWinRate) || 40,
        awayWinRate: Number(parsedData.awayTeam.awayWinRate) || 25,
        leaguePosition: Number(parsedData.awayTeam.leaguePosition) || 14,
        injuries: parsedData.awayTeam.injuries || [],
        color: parsedData.awayTeam.color || "#eab308"
      },
      stats: {
        possession: [50, 50],
        shotsOnTarget: [0, 0],
        corners: [0, 0],
        yellowCards: [0, 0],
        redCards: [0, 0],
        xG: [0.0, 0.0],
        momentumHistory: [0]
      },
      predictions: {
        winProbHome: Number(parsedData.predictions.winProbHome) || 40,
        drawProb: Number(parsedData.predictions.drawProb) || 30,
        winProbAway: Number(parsedData.predictions.winProbAway) || 30,
        over25Prob: Number(parsedData.predictions.over25Prob) || 50,
        bothToScoreProb: Number(parsedData.predictions.bothToScoreProb) || 50,
        nextGoalTeam: parsedData.predictions.nextGoalTeam || "HOME",
        nextGoalProb: Number(parsedData.predictions.nextGoalProb) || 50,
        probableScores: parsedData.predictions.probableScores || [{ score: "1 x 1", probability: 30 }],
        confidenceRating: Number(parsedData.predictions.confidenceRating) || 75,
        detailedAnalysis: parsedData.predictions.detailedAnalysis || "Análise detalhada gerada automaticamente pela IA.",
        tacticalRecommendation: parsedData.predictions.tacticalRecommendation || "Recomendação de entrada padrão baseada no equilíbrio ofensivo."
      },
      h2h: parsedData.h2h || []
    };

    databaseMatches.unshift(newMatch);
    matchLogs[newMatch.id] = ["Análise de Inteligência Artificial processada com sucesso no modelo oficial. Pronto para iniciar simulações."];

    res.json({
      match: newMatch,
      isSimulated: false,
      message: "Análise realizada com sucesso através da Inteligência Artificial da Groq!"
    });
  } catch (error) {
    console.error("Erro ao invocar a API da Groq:", error);
    // Return gorgeous fallback
    databaseMatches.unshift(mockGeneratedMatch);
    matchLogs[simulatedId] = ["Aguardando início da simulação. Dados gerados sob algoritmo inteligente de contingência de rede."];
    res.json({
      match: mockGeneratedMatch,
      isSimulated: true,
      message: "Sucesso! Analisado usando o algoritmo inteligente local (Detectamos oscilação ou chave inválida na API Groq)."
    });
  }
});


// Serve files with Vite config support
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Server running on port ${PORT}`);
    
    // Auto-open browser in development mode
    if (process.env.NODE_ENV !== "production") {
      console.log(`Abrindo o navegador automaticamente em: ${url}`);
      const start = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
      const cmd = process.platform === "win32" ? `start "" "${url}"` : `${start} ${url}`;
      exec(cmd, (err) => {
        if (err) {
          console.error("Erro ao abrir o navegador automaticamente:", err);
        }
      });
    }
  });
}

startServer();
