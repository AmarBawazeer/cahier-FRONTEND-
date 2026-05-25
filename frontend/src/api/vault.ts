import { apiRequest } from "./client";

export type VaultItem = {
  id: string;
  title: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  synopsis?: string;
  poster_path?: string;
  image_url?: string;
  popularity?: number;
  vote_average?: number;
  score?: number;
  episodes?: number;
  created_at?: string;
  updated_at?: string;
};

export type Movie = VaultItem & {
  release_date: string;
  vote_average: number;
};

export type TVShow = VaultItem & {
  first_air_date: string;
};

export type Anime = VaultItem & {
  score: number;
  episodes: number;
};

export type VaultResponse = {
  items: VaultItem[];
  limit: number;
  offset: number;
};

export type ItemResponse = {
  item: VaultItem;
};

export type SearchAllItem = {
  id: string;
  title: string;
  category: "movies" | "tv" | "anime";
  poster_path?: string;
  image_url?: string;
  score?: number;
  rank?: number;
};

// Rankings API
export type UserRanking = {
  id: string;
  user_id: string;
  name: string;
  category: "movies" | "tv" | "anime" | "mixed";
  max_size: number;
  created_at: string;
};

export type RankingItem = {
  item_id: string;
  item_type: string;
  rank_position: number;
  user_rating?: number;
};

// Movies
export async function listMovies(limit = 20, offset = 0, q?: string, order?: "random", sort?: "rating") {
  const res = await apiRequest<{ movies?: VaultItem[]; limit?: number; offset?: number }>(
    `/items/movies?limit=${limit}&offset=${offset}${
      q ? `&q=${encodeURIComponent(q)}` : ""
    }${order ? `&order=${order}` : ""}${sort ? `&sort=${sort}` : ""}`
  );
  return {
    items: Array.isArray(res.movies) ? res.movies : [],
    limit: typeof res.limit === "number" ? res.limit : limit,
    offset: typeof res.offset === "number" ? res.offset : offset,
  } as VaultResponse;
}

export async function getMovie(id: string) {
  const res = await apiRequest<{ movie?: VaultItem }>(`/items/movies/${id}`);
  return { item: res.movie as VaultItem } as ItemResponse;
}

// TV Shows
export async function listTVShows(limit = 20, offset = 0, q?: string, order?: "random", sort?: "rating") {
  const res = await apiRequest<{ shows?: VaultItem[]; limit?: number; offset?: number }>(
    `/items/tv?limit=${limit}&offset=${offset}${
      q ? `&q=${encodeURIComponent(q)}` : ""
    }${order ? `&order=${order}` : ""}${sort ? `&sort=${sort}` : ""}`
  );
  return {
    items: Array.isArray(res.shows) ? res.shows : [],
    limit: typeof res.limit === "number" ? res.limit : limit,
    offset: typeof res.offset === "number" ? res.offset : offset,
  } as VaultResponse;
}

export async function getTVShow(id: string) {
  const res = await apiRequest<{ show?: VaultItem }>(`/items/tv/${id}`);
  return { item: res.show as VaultItem } as ItemResponse;
}

// Anime
export async function listAnime(limit = 20, offset = 0, q?: string, order?: "random", sort?: "rating") {
  const res = await apiRequest<{ anime?: VaultItem[]; limit?: number; offset?: number }>(
    `/items/anime?limit=${limit}&offset=${offset}${
      q ? `&q=${encodeURIComponent(q)}` : ""
    }${order ? `&order=${order}` : ""}${sort ? `&sort=${sort}` : ""}`
  );
  return {
    items: Array.isArray(res.anime) ? res.anime : [],
    limit: typeof res.limit === "number" ? res.limit : limit,
    offset: typeof res.offset === "number" ? res.offset : offset,
  } as VaultResponse;
}

export async function getAnime(id: string) {
  const res = await apiRequest<{ anime?: VaultItem }>(`/items/anime/${id}`);
  return { item: res.anime as VaultItem } as ItemResponse;
}

export async function searchAll(q: string, limit = 20) {
  const res = await apiRequest<{ items?: SearchAllItem[]; limit?: number }>(
    `/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  return {
    items: Array.isArray(res.items) ? res.items : [],
    limit: typeof res.limit === "number" ? res.limit : limit,
  };
}

// Unified list by category
export async function listByCategory(
  category: "movies" | "tv" | "anime" | "all" = "all",
  limit = 20,
  offset = 0,
) {
  if (category === "all") {
    const [movies, tv, anime] = await Promise.all([
      listMovies(limit, offset),
      listTVShows(limit, offset),
      listAnime(limit, offset),
    ]);
    return {
      items: [...movies.items, ...tv.items, ...anime.items],
      limit,
      offset,
    };
  }

  const categoryMap = {
    movies: listMovies,
    tv: listTVShows,
    anime: listAnime,
  };

  return categoryMap[category](limit, offset);
}

// Rankings
export function createRanking(
  userId: string,
  name: string,
  category: "movies" | "tv" | "anime" | "mixed",
  maxSize: number,
) {
  return apiRequest<{ ranking_id?: string; ranking?: { id?: string } }>(
    "/rankings",
    { method: "POST", body: { user_id: userId, name, category, max_size: maxSize } },
  ).then((res) => {
    const ranking_id = res.ranking_id || res.ranking?.id;
    if (!ranking_id) {
      throw new Error("Ranking created but no ranking id returned by server");
    }
    return { ranking_id };
  });
}

export function getUserRankings(userId: string) {
  return apiRequest<{ rankings: UserRanking[] }>(`/user/${userId}/rankings`);
}

export function getRankingItems(rankingId: string) {
  return apiRequest<{ items: RankingItem[] }>(`/rankings/${rankingId}/items`);
}

export function addRankingItem(
  rankingId: string,
  itemId: string,
  itemType: string,
  userRating?: number,
) {
  return apiRequest(
    `/rankings/${rankingId}/items`,
    { method: "POST", body: { item_id: itemId, item_type: itemType, user_rating: userRating } },
  );
}

export function removeRankingItem(rankingId: string, itemId: string) {
  return apiRequest(
    `/rankings/${rankingId}/items/${itemId}`,
    { method: "DELETE" },
  );
}

export function reorderRankingItem(
  rankingId: string,
  itemId: string,
  newPosition: number,
) {
  return apiRequest(
    `/rankings/${rankingId}/items/${itemId}/reorder`,
    { method: "PUT", body: { rank_position: newPosition } },
  );
}

export function deleteRanking(rankingId: string) {
  return apiRequest(`/rankings/${rankingId}`, { method: "DELETE" });
}
