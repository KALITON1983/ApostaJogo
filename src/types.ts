export enum MatchStatus {
  PRE_MATCH = "PRÉ-JOGO",
  LIVE = "AO VIVO",
  FINISHED = "FINALIZADO"
}

export interface Team {
  name: string;
  shortName: string;
  form: string[]; // ['W', 'D', 'L', etc.]
  avgGoalsScored: number;
  avgGoalsConceded: number;
  homeWinRate: number; // Percentage
  awayWinRate: number; // Percentage
  leaguePosition: number;
  injuries: string[]; // List of names & reason
  color: string; // Tailind color or hex
}

export interface H2HMatch {
  date: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
}

export interface MatchStats {
  possession: [number, number]; // [Home, Away]
  shotsOnTarget: [number, number];
  corners: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
  xG: [number, number];
  momentumHistory: number[]; // Momentum of home team (-100 to +100)
}

export interface AIPrediction {
  winProbHome: number;
  drawProb: number;
  winProbAway: number;
  over25Prob: number;
  bothToScoreProb: number;
  nextGoalTeam: "HOME" | "AWAY" | "NONE";
  nextGoalProb: number;
  probableScores: { score: string; probability: number }[];
  detailedAnalysis: string; // AI write-up
  tacticalRecommendation: string; // Dynamic tip
  confidenceRating: number; // 0-100%
}

export interface FootballMatch {
  id: string;
  leagueName: string;
  status: MatchStatus;
  minute: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore: number;
  awayScore: number;
  startTime?: string;
  stats: MatchStats;
  predictions: AIPrediction;
  h2h: H2HMatch[];
}
