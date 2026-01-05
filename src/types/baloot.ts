export type GameType = 'حكم' | 'صن';
export type Multiplier = 'عادي' | 'دبل' | '×3' | '×4' | 'قهوة';

export interface Round {
  id: string;
  roundNumber: number;
  gameType: GameType;
  buyingTeam: 1 | 2;
  team1Points: number;
  team2Points: number;
  multiplier: Multiplier;
  winningTeam: 1 | 2;
  finalTeam1Points: number;
  finalTeam2Points: number;
}

export interface Game {
  id: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  winningScore: number;
  rounds: Round[];
  winner: 1 | 2 | null;
  createdAt: Date;
}
