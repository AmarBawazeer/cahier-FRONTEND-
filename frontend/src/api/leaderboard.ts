import { apiRequest } from "./client";

export type LeaderboardEntry = {
  user_id: string;
  username: string;
  score: number;
  rank: number;
  mode: string;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
  mode: string;
};

export function getLeaderboard(limit = 20, mode = "") {
  const params = new URLSearchParams({ limit: String(limit) });
  if (mode) {
    params.set("mode", mode);
  }

  return apiRequest<LeaderboardResponse>(`/leaderboard?${params.toString()}`);
}
