import { apiRequest, resolvePosterUrl } from "./client";

export type GameMode = "movies" | "tv" | "anime" | "mixed";

type MoviePayload = {
  id: string;
  title: string;
  poster_path?: string;
  popularity?: number;
  vote_average?: number;
};

type TVPayload = {
  id: string;
  name: string;
  poster_path?: string;
  popularity?: number;
};

type AnimePayload = {
  id: number;
  title: string;
  image_url?: string;
  score?: number;
};

type RawRound = {
  item_a: MoviePayload | TVPayload | AnimePayload;
  item_b: MoviePayload | TVPayload | AnimePayload;
  mode: GameMode;
};

export type GameSession = {
  id: string;
  user_id: string;
  mode: GameMode;
  score: number;
  rounds: number;
  created_at: string;
  ended_at?: string;
};

export type GameCard = {
  id: string;
  title: string;
  imageUrl: string;
  metric: number;
  metricLabel: string;
  mediaType: GameMode;
};

export type GameRound = {
  itemA: GameCard;
  itemB: GameCard;
  mode: GameMode;
};

type StartSessionResponse = {
  session: GameSession;
};

type SessionResponse = {
  session: GameSession;
};

type SubmitAnswerResponse = {
  correct: boolean;
  points: number;
};

function isTVPayload(item: MoviePayload | TVPayload | AnimePayload): item is TVPayload {
  return "name" in item;
}

function isAnimePayload(item: MoviePayload | TVPayload | AnimePayload): item is AnimePayload {
  return "image_url" in item || typeof item.id === "number";
}

function normalizeCard(item: MoviePayload | TVPayload | AnimePayload, mode: GameMode): GameCard {
  if (isTVPayload(item)) {
    return {
      id: item.id,
      title: item.name,
      imageUrl: resolvePosterUrl(item.poster_path),
      metric: item.popularity ?? 0,
      metricLabel: "Popularity",
      mediaType: "tv",
    };
  }

  if (isAnimePayload(item)) {
    return {
      id: String(item.id),
      title: item.title,
      imageUrl: resolvePosterUrl(item.image_url),
      metric: item.score ?? 0,
      metricLabel: "Score",
      mediaType: "anime",
    };
  }

  const movieMetric = item.vote_average ?? item.popularity ?? 0;

  return {
    id: item.id,
    title: item.title,
    imageUrl: resolvePosterUrl(item.poster_path),
    metric: movieMetric,
    metricLabel: item.vote_average ? "Rating" : "Popularity",
    mediaType: mode === "mixed" ? "movies" : mode,
  };
}

export function startGameSession(userId: string, mode: GameMode, rounds: number) {
  return apiRequest<StartSessionResponse>("/game/start", {
    method: "POST",
    body: {
      user_id: userId,
      mode,
      rounds,
    },
  });
}

export async function getGameRound(sessionId: string): Promise<GameRound> {
  const round = await apiRequest<RawRound>(`/game/${sessionId}/round`);
  return {
    itemA: normalizeCard(round.item_a, round.mode),
    itemB: normalizeCard(round.item_b, round.mode),
    mode: round.mode,
  };
}

export function submitGameAnswer(
  sessionId: string,
  itemAId: string,
  itemBId: string,
  answer: "a" | "b",
  correctId: string,
) {
  return apiRequest<SubmitAnswerResponse>(`/game/${sessionId}/answer`, {
    method: "POST",
    body: {
      item_a_id: itemAId,
      item_b_id: itemBId,
      answer,
      correct_id: correctId,
    },
  });
}

export function endGameSession(sessionId: string) {
  return apiRequest<SessionResponse>(`/game/${sessionId}/end`, {
    method: "POST",
  });
}
