import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  getUser,
  getUserPreferences,
  getUserGameHistory,
  getActiveUserId,
} from "../api/users";
import { isAuthenticated } from "../api/client";
import { resolvePosterUrl } from "../api/client";
import PageLayout from "../components/PageLayout";
import type { User, UserPreferences, GameHistorySession } from "../api/users";
import {
  addRankingItem,
  createRanking,
  deleteRanking,
  getUserRankings as apiGetUserRankings,
  getRankingItems,
  getMovie,
  getTVShow,
  getAnime,
  listAnime,
  listMovies,
  listTVShows,
  searchAll,
  type UserRanking,
  type RankingItem,
} from "../api/vault";

type TopCategory = "movies" | "tv" | "anime";
type PickerItem = {
  item_id: string;
  item_type: TopCategory;
  title: string;
  image: string;
};

type RankingPreviewItem = {
  title: string;
  image: string;
};

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [sessions, setSessions] = useState<GameHistorySession[]>([]);
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [rankingPreviews, setRankingPreviews] = useState<Record<string, RankingPreviewItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TopCategory | null>(null);
  const [editorSize, setEditorSize] = useState<5 | 10 | 15 | 20>(10);
  const [editorQuery, setEditorQuery] = useState("");
  const [editorDebouncedQuery, setEditorDebouncedQuery] = useState("");
  const [editorResults, setEditorResults] = useState<PickerItem[]>([]);
  const [editorSelected, setEditorSelected] = useState<PickerItem[]>([]);
  const [editorSearching, setEditorSearching] = useState(false);
  const [editorSaving, setEditorSaving] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      setNotLoggedIn(true);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const userId = getActiveUserId();
        if (!userId) {
          setError("User ID not found");
          setLoading(false);
          return;
        }
        setActiveUserId(userId);

        const [userData, prefsData, sessionsData, rankingsData] = await Promise.all([
          getUser(userId),
          getUserPreferences(userId),
          getUserGameHistory(userId, 10),
          apiGetUserRankings(userId),
        ]);

        setUser(userData.user);
        setPreferences(prefsData.preferences);
        setSessions(sessionsData.sessions || []);
        setRankings(rankingsData.rankings || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profile",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // Fetch preview posters for each collection so the Profile UI looks “alive”.
  // We only show a small subset to keep network requests reasonable.
  const POSTER_PREVIEW_COUNT = 6;
  useEffect(() => {
    let active = true;

    async function loadPosters() {
      try {
        const next: Record<string, RankingPreviewItem[]> = {};

        await Promise.all(
          rankings.filter((r) => Boolean(r?.id)).map(async (ranking) => {
            const itemsRes = await getRankingItems(ranking.id);
            const items = (itemsRes.items || []) as RankingItem[];

            const itemsToShow = items.slice(0, Math.min(POSTER_PREVIEW_COUNT, items.length));
            const previews: RankingPreviewItem[] = [];

            for (const it of itemsToShow) {
              if (it.item_type === "movies") {
                const res = await getMovie(it.item_id);
                const title = String((res.item as any)?.title || "Untitled");
                const posterPath = (res.item as any)?.poster_path as string | undefined;
                previews.push({ title, image: resolvePosterUrl(posterPath || "") });
              } else if (it.item_type === "tv") {
                const res = await getTVShow(it.item_id);
                const title = String((res.item as any)?.name || (res.item as any)?.title || "Untitled");
                const posterPath = (res.item as any)?.poster_path as string | undefined;
                previews.push({ title, image: resolvePosterUrl(posterPath || "") });
              } else if (it.item_type === "anime") {
                const res = await getAnime(it.item_id);
                const title = String((res.item as any)?.title || "Untitled");
                const imageUrl = (res.item as any)?.image_url as string | undefined;
                // anime uses `image_url` (or sometimes poster_path if present)
                const posterPath = imageUrl || ((res.item as any)?.poster_path as string | undefined);
                previews.push({ title, image: resolvePosterUrl(posterPath || "") });
              }
            }

            next[ranking.id] = previews;
          }),
        );

        if (active) setRankingPreviews(next);
      } catch {
        // If posters fail, still show collections (no hard failure).
        if (active) setRankingPreviews({});
      }
    }

    if (rankings.length > 0) {
      void loadPosters();
    } else {
      setRankingPreviews({});
    }

    return () => {
      active = false;
    };
  }, [rankings]);

  useEffect(() => {
    const handle = setTimeout(() => setEditorDebouncedQuery(editorQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [editorQuery]);

  useEffect(() => {
    if (!editingCategory) return;
    const activeCategory = editingCategory;
    let active = true;
    async function loadSearchResults() {
      setEditorSearching(true);
      try {
        const q = editorDebouncedQuery;
        let items: PickerItem[] = [];
        if (q) {
          const res = await searchAll(q, 60);
          items = (res.items || [])
            .filter((it) => it.category === activeCategory)
            .map((it) => ({
              item_id: String(it.id),
              item_type: activeCategory,
              title: String(it.title || "Untitled"),
              image: resolvePosterUrl(it.poster_path || it.image_url || ""),
            }));
        } else {
          if (activeCategory === "movies") {
            const res = await listMovies(40, 0, undefined, undefined, "rating");
            items = res.items.map((m) => ({
              item_id: String(m.id),
              item_type: "movies",
              title: String((m as any).title || "Untitled"),
              image: resolvePosterUrl((m as any).poster_path || ""),
            }));
          } else if (activeCategory === "tv") {
            const res = await listTVShows(40, 0, undefined, undefined, "rating");
            items = res.items.map((s) => ({
              item_id: String(s.id),
              item_type: "tv",
              title: String((s as any).name || (s as any).title || "Untitled"),
              image: resolvePosterUrl((s as any).poster_path || ""),
            }));
          } else {
            const res = await listAnime(40, 0, undefined, undefined, "rating");
            items = res.items.map((a) => ({
              item_id: String(a.id),
              item_type: "anime",
              title: String((a as any).title || "Untitled"),
              image: resolvePosterUrl((a as any).image_url || ""),
            }));
          }
        }
        if (active) setEditorResults(items);
      } catch {
        if (active) setEditorResults([]);
      } finally {
        if (active) setEditorSearching(false);
      }
    }
    void loadSearchResults();
    return () => {
      active = false;
    };
  }, [editingCategory, editorDebouncedQuery]);

  const topByCategory = useMemo(() => {
    return {
      movies: rankings.find((r) => r?.id && r.category === "movies"),
      tv: rankings.find((r) => r?.id && r.category === "tv"),
      anime: rankings.find((r) => r?.id && r.category === "anime"),
    } as Record<TopCategory, UserRanking | undefined>;
  }, [rankings]);

  async function loadRankingSelection(ranking: UserRanking) {
    if (!ranking?.id) return [];
    const itemsRes = await getRankingItems(ranking.id);
    const items = itemsRes.items || [];
    const selected: PickerItem[] = [];
    for (const it of items) {
      if (it.item_type === "movies") {
        const res = await getMovie(it.item_id);
        const title = String((res.item as any)?.title || "Untitled");
        const image = resolvePosterUrl((res.item as any)?.poster_path || "");
        selected.push({ item_id: it.item_id, item_type: "movies", title, image });
      } else if (it.item_type === "tv") {
        const res = await getTVShow(it.item_id);
        const title = String((res.item as any)?.name || (res.item as any)?.title || "Untitled");
        const image = resolvePosterUrl((res.item as any)?.poster_path || "");
        selected.push({ item_id: it.item_id, item_type: "tv", title, image });
      } else if (it.item_type === "anime") {
        const res = await getAnime(it.item_id);
        const title = String((res.item as any)?.title || "Untitled");
        const image = resolvePosterUrl((res.item as any)?.image_url || (res.item as any)?.poster_path || "");
        selected.push({ item_id: it.item_id, item_type: "anime", title, image });
      }
    }
    return selected;
  }

  async function openEditor(cat: TopCategory) {
    setEditingCategory(cat);
    setEditorQuery("");
    setEditorDebouncedQuery("");
    const existing = topByCategory[cat];
    if (existing) {
      setEditorSize((existing.max_size as 5 | 10 | 15 | 20) || 10);
      try {
        const selected = await loadRankingSelection(existing);
        setEditorSelected(selected.slice(0, existing.max_size));
      } catch {
        setEditorSelected([]);
      }
    } else {
      setEditorSize(10);
      setEditorSelected([]);
    }
  }

  async function saveTopCategory() {
    if (!editingCategory || !activeUserId) return;
    if (editorSelected.length < 2) {
      setError("Pick at least 2 items");
      return;
    }
    setEditorSaving(true);
    setError(null);
    try {
      const existing = topByCategory[editingCategory];
      if (existing) await deleteRanking(existing.id);
      const name =
        editingCategory === "movies" ? "Top Movies" : editingCategory === "tv" ? "Top TV Shows" : "Top Anime";
      const created = await createRanking(activeUserId, name, editingCategory, editorSize);
      for (const entry of editorSelected.slice(0, editorSize)) {
        await addRankingItem(created.ranking_id, entry.item_id, editingCategory);
      }
      const refreshed = await apiGetUserRankings(activeUserId);
      setRankings(refreshed.rankings || []);
      setEditingCategory(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save top list");
    } finally {
      setEditorSaving(false);
    }
  }

  const totalScore = sessions.reduce((sum, session) => sum + session.score, 0);
  const accuracy =
    sessions.length > 0
      ? (
          (sessions.reduce((sum, session) => sum + (session.rounds ? 1 : 0), 0) /
            sessions.length) *
          100
        ).toFixed(1) + "%"
      : "--";

  const initials = user?.username
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  if (notLoggedIn) {
    return (
      <PageLayout>
        <main className="mx-auto flex w-full max-w-5xl flex-grow flex-col items-center justify-center px-4 py-24 sm:px-5 lg:px-6">
          <span className="material-symbols-outlined mb-6 text-6xl text-zinc-600">person_off</span>
          <h1 className="mb-4 font-headline text-3xl font-bold text-on-surface">Not Logged In</h1>
          <p className="mb-8 max-w-md text-center font-body text-on-surface-variant">
            Sign in to view your profile, game history, and preferences.
          </p>
          <Link
            to="/"
            className="rounded-lg bg-zinc-100 px-6 py-3 font-label text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-900 transition-colors hover:bg-white"
          >
            Back to Home
          </Link>
        </main>
      </PageLayout>
    );
  }

  if (loading) {
    return (
      <PageLayout>
        <main className="mx-auto w-full max-w-5xl flex-grow px-4 pb-16 pt-6 sm:px-5 lg:px-6">
          <div className="space-y-4">
            <div className="h-80 animate-pulse rounded-lg bg-surface-container-low" />
            <div className="h-20 animate-pulse rounded-lg bg-surface-container-low" />
            <div className="h-40 animate-pulse rounded-lg bg-surface-container-low" />
          </div>
        </main>
      </PageLayout>
    );
  }

  if (error || !user) {
    return (
      <PageLayout>
        <main className="mx-auto w-full max-w-5xl flex-grow px-4 pb-16 pt-6 sm:px-5 lg:px-6">
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-8 text-center">
            <p className="font-label text-xs uppercase tracking-[0.3em] text-red-400">
              Error Loading Profile
            </p>
            <p className="mt-4 font-body text-on-surface-variant">
              {error || "Unable to load your profile. Please try again."}
            </p>
          </div>
        </main>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <main className="mx-auto w-full max-w-5xl flex-grow px-4 pb-16 pt-6 sm:px-5 lg:px-6">
        <header className="mb-14 flex flex-col gap-6 md:mb-16 md:flex-row md:items-center">
          <div className="group relative">
            <div className="absolute inset-0 bg-zinc-500 opacity-20 blur-2xl transition-opacity group-hover:opacity-40" />
            <div className="relative flex h-56 w-40 items-center justify-center rounded-lg border border-slate-600 bg-slate-900 text-5xl font-headline tracking-[0.2em] text-zinc-200 shadow-2xl">
              {initials || "?"}
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="inline-flex items-center rounded-full border border-zinc-600/30 bg-zinc-600/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.2em] text-zinc-200">
              <svg
                className="mr-2 h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2l-2.81 6.63L2 9.24l5.46 4.73L5.82 21 12 17.27z" />
              </svg>
              Member
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-headline text-4xl font-bold tracking-tighter text-slate-100 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {user.username}
            </motion.h1>
            <p className="max-w-xl font-body text-lg italic text-slate-400">
              {user.email}
            </p>
          </div>
        </header>

        {/* Stats */}
        <section className="mb-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-slate-700 md:mb-24 md:grid-cols-4">
          {[
            { label: "Total Score", value: totalScore.toString() },
            { label: "Games Played", value: sessions.length.toString() },
            { label: "Accuracy", value: accuracy },
            {
              label: "Preferred Mode",
              value: preferences?.preferred_mode || "--",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="group flex flex-col items-center justify-center bg-slate-800 p-5 text-center transition-colors hover:bg-slate-700 sm:p-7"
            >
              <span className="mb-2 font-label text-[10px] uppercase tracking-widest text-slate-500">
                {stat.label}
              </span>
              <span className="font-headline text-3xl font-bold text-zinc-200 transition-transform group-hover:scale-110 sm:text-4xl">
                {stat.value}
              </span>
            </div>
          ))}
        </section>

        <div className="space-y-16 lg:space-y-24">
          <div className="flex flex-col gap-16 lg:gap-24">
            {/* Game History */}
            <section className="order-2">
              <div className="mb-10 flex items-center justify-between">
                <h2 className="font-headline text-xl font-bold uppercase tracking-tight text-slate-100">
                  Recent Games
                </h2>
                <span className="font-label text-[10px] tracking-widest text-slate-500">
                  TOP 10
                </span>
              </div>
              {sessions.length === 0 ? (
                <div className="border border-slate-600 rounded-lg bg-slate-800/50 p-8 text-center">
                  <p className="text-slate-400">No games played yet. Start playing to see your history!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative flex items-center gap-4 rounded-lg bg-slate-800 p-4 transition-all duration-300 hover:bg-slate-700 sm:gap-6"
                    >
                      <div className="flex h-16 w-20 flex-shrink-0 items-center justify-center bg-slate-900 font-headline text-lg tracking-[0.16em] text-zinc-200">
                        {session.score}
                      </div>
                      <div className="min-w-0 flex-grow">
                        <h3 className="mb-1 truncate font-headline text-lg font-bold uppercase tracking-tight text-slate-100">
                          {session.mode}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                          <span className="font-label text-[10px] uppercase tracking-widest text-slate-500">
                            {session.rounds} rounds
                          </span>
                          <span className="font-body text-sm font-bold text-slate-400">
                            {new Date(session.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Direct Top Picks */}
            <section className="order-1">
              <div className="mb-10 flex items-center justify-between gap-4">
                <h2 className="font-headline text-xl font-bold uppercase tracking-tight text-slate-100">
                  Your Top Picks
                </h2>
              </div>

              <div className="space-y-4">
                {(["movies", "tv", "anime"] as TopCategory[]).map((cat) => {
                  const r = topByCategory[cat];
                  return (
                    <div key={cat} className="rounded-lg border border-slate-700 bg-slate-800/40 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-headline text-lg font-bold text-slate-100">
                            {cat === "movies" ? "Top Movies" : cat === "tv" ? "Top TV Shows" : "Top Anime"}
                          </h3>
                          <p className="mt-1 font-label text-[10px] uppercase tracking-widest text-primary">
                            {r ? `Top ${r.max_size}` : "Not set"}
                          </p>
                        </div>
                        <button
                          onClick={() => void openEditor(cat)}
                          className="rounded-lg bg-primary px-4 py-2 font-label text-xs font-bold uppercase tracking-widest text-on-primary transition-all hover:opacity-90"
                        >
                          {r ? "Edit" : "Set Top List"}
                        </button>
                      </div>
                      {r && rankingPreviews[r.id]?.length ? (
                        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                          {rankingPreviews[r.id].map((item, idx) => (
                            <div key={`${r.id}-preview-${idx}`} className="w-24 shrink-0">
                              <img
                                src={item.image}
                                alt={item.title}
                                loading="lazy"
                                className="h-32 w-24 rounded-md border border-slate-600/60 object-cover"
                              />
                              <p className="mt-1 line-clamp-2 text-xs text-slate-300">{item.title}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-slate-400">
                          Use Edit to select your preferred items from Vault search.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {editingCategory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                  <div className="w-full max-w-4xl rounded-lg border border-slate-700 bg-slate-900 p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-headline text-2xl text-slate-100">
                        {editingCategory === "movies"
                          ? "Edit Top Movies"
                          : editingCategory === "tv"
                            ? "Edit Top TV Shows"
                            : "Edit Top Anime"}
                      </h3>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="rounded border border-slate-600 px-3 py-1 text-xs uppercase tracking-widest text-slate-300"
                      >
                        Close
                      </button>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      {[5, 10, 15, 20].map((size) => (
                        <button
                          key={size}
                          onClick={() => setEditorSize(size as 5 | 10 | 15 | 20)}
                          className={`px-3 py-1 text-xs uppercase tracking-widest ${
                            editorSize === size
                              ? "bg-primary text-on-primary"
                              : "border border-slate-600 text-slate-300"
                          }`}
                        >
                          Top {size}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      value={editorQuery}
                      onChange={(e) => setEditorQuery(e.target.value)}
                      placeholder="Search Vault..."
                      className="mb-4 w-full border-b border-slate-600 bg-transparent py-3 text-slate-100 placeholder:text-slate-500 focus:border-primary focus:outline-none"
                    />

                    <div className="mb-4">
                      <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">
                        Selected {editorSelected.length} / {editorSize}
                      </p>
                      <div className="max-h-44 space-y-2 overflow-y-auto">
                        {editorSelected.map((entry, idx) => (
                          <div
                            key={`${entry.item_type}:${entry.item_id}`}
                            className="flex items-center gap-2 rounded border border-slate-700 p-2"
                          >
                            <span className="w-8 text-center text-xs text-primary">#{idx + 1}</span>
                            {entry.image ? (
                              <img src={entry.image} alt={entry.title} className="h-10 w-8 object-cover" />
                            ) : (
                              <div className="h-10 w-8 bg-slate-700" />
                            )}
                            <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{entry.title}</span>
                            <button
                              onClick={() =>
                                setEditorSelected((prev) => {
                                  if (idx === 0) return prev;
                                  const next = [...prev];
                                  [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                  return next;
                                })
                              }
                              className="border border-slate-600 px-2 py-1 text-xs"
                            >
                              Up
                            </button>
                            <button
                              onClick={() =>
                                setEditorSelected((prev) => {
                                  if (idx >= prev.length - 1) return prev;
                                  const next = [...prev];
                                  [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                  return next;
                                })
                              }
                              className="border border-slate-600 px-2 py-1 text-xs"
                            >
                              Down
                            </button>
                            <button
                              onClick={() =>
                                setEditorSelected((prev) =>
                                  prev.filter((x) => !(x.item_id === entry.item_id && x.item_type === entry.item_type)),
                                )
                              }
                              className="border border-slate-600 px-2 py-1 text-xs text-red-400"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="max-h-60 space-y-2 overflow-y-auto">
                      {editorSearching ? (
                        <div className="rounded border border-slate-700 p-3 text-sm text-slate-400">Searching...</div>
                      ) : (
                        editorResults.map((item) => {
                          const exists = editorSelected.some(
                            (x) => x.item_id === item.item_id && x.item_type === item.item_type,
                          );
                          return (
                            <div
                              key={`${item.item_type}:${item.item_id}`}
                              className="flex items-center gap-2 rounded border border-slate-700 p-2"
                            >
                              {item.image ? (
                                <img src={item.image} alt={item.title} className="h-14 w-10 object-cover" />
                              ) : (
                                <div className="h-14 w-10 bg-slate-700" />
                              )}
                              <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{item.title}</span>
                              <button
                                disabled={exists || editorSelected.length >= editorSize}
                                onClick={() => setEditorSelected((prev) => [...prev, item])}
                                className="border border-slate-600 px-3 py-1 text-xs uppercase tracking-widest disabled:opacity-40"
                              >
                                {exists ? "Added" : editorSelected.length >= editorSize ? "Full" : "Add"}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="mt-5 flex justify-end gap-2">
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="rounded border border-slate-600 px-4 py-2 text-xs uppercase tracking-widest text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => void saveTopCategory()}
                        disabled={editorSaving}
                        className="rounded bg-primary px-4 py-2 text-xs font-bold uppercase tracking-widest text-on-primary disabled:opacity-50"
                      >
                        {editorSaving ? "Saving..." : "Save Top List"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Preferences */}
          <section className="pt-2">
            <div className="mb-10 flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold uppercase tracking-tight text-slate-100">
                Preferences
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {preferences ? (
                <>
                  <div className="rounded-lg border border-slate-600 bg-slate-800 p-4">
                    <span className="block font-label text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                      Preferred Mode
                    </span>
                    <span className="font-headline text-2xl font-bold text-zinc-200">
                      {preferences.preferred_mode || "Not set"}
                    </span>
                  </div>
                  <div className="rounded-lg border border-slate-600 bg-slate-800 p-4">
                    <span className="block font-label text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                      Rounds Per Game
                    </span>
                    <span className="font-headline text-2xl font-bold text-zinc-200">
                      {preferences.rounds_per_game || 5}
                    </span>
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-slate-600 bg-slate-800/50 p-4 text-center text-slate-400">
                  No preferences set yet
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </PageLayout>
  );
}
