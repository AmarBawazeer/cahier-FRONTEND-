import { useEffect, useMemo, useState } from "react";
import {
  addRankingItem,
  createRanking,
  listAnime,
  listMovies,
  searchAll,
  listTVShows,
  type UserRanking,
} from "../api/vault";
import { resolvePosterUrl } from "../api/client";
import { getActiveUserId } from "../api/users";

type Props = {
  onClose: () => void;
  onRankingCreated: (ranking: UserRanking) => void;
};

type PickerItem = {
  item_id: string;
  item_type: "movies" | "tv" | "anime";
  title: string;
  image: string;
};

export default function CollectionsManager({ onClose, onRankingCreated }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"movies" | "tv" | "anime" | "mixed">("movies");
  const [maxSize, setMaxSize] = useState<5 | 10 | 15 | 20>(10);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<PickerItem[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<PickerItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const h = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(h);
  }, [query]);

  useEffect(() => {
    let active = true;
    async function loadResults() {
      setSearching(true);
      try {
        const q = debouncedQuery || undefined;
        let items: PickerItem[] = [];

        if (category === "movies") {
          const res = await listMovies(40, 0, q, undefined, "rating");
          items = res.items.map((m) => ({
            item_id: String(m.id),
            item_type: "movies",
            title: String((m as any).title || "Untitled"),
            image: resolvePosterUrl((m as any).poster_path || (m as any).image_url || ""),
          }));
        } else if (category === "tv") {
          const res = await listTVShows(40, 0, q, undefined, "rating");
          items = res.items.map((s) => ({
            item_id: String(s.id),
            item_type: "tv",
            title: String((s as any).name || (s as any).title || "Untitled"),
            image: resolvePosterUrl((s as any).poster_path || ""),
          }));
        } else if (category === "anime") {
          const res = await listAnime(40, 0, q, undefined, "rating");
          items = res.items.map((a) => ({
            item_id: String(a.id),
            item_type: "anime",
            title: String((a as any).title || "Untitled"),
            image: resolvePosterUrl((a as any).image_url || (a as any).poster_path || ""),
          }));
        } else {
          if (q) {
            const res = await searchAll(q, 60);
            items = res.items.map((it) => ({
              item_id: String(it.id),
              item_type: it.category,
              title: String(it.title || "Untitled"),
              image: resolvePosterUrl(it.poster_path || it.image_url || ""),
            }));
          } else {
            const [moviesRes, tvRes, animeRes] = await Promise.all([
              listMovies(20, 0, undefined, undefined, "rating"),
              listTVShows(20, 0, undefined, undefined, "rating"),
              listAnime(20, 0, undefined, undefined, "rating"),
            ]);
            items = [
              ...moviesRes.items.map((m) => ({
                item_id: String(m.id),
                item_type: "movies" as const,
                title: String((m as any).title || "Untitled"),
                image: resolvePosterUrl((m as any).poster_path || (m as any).image_url || ""),
              })),
              ...tvRes.items.map((s) => ({
                item_id: String(s.id),
                item_type: "tv" as const,
                title: String((s as any).name || (s as any).title || "Untitled"),
                image: resolvePosterUrl((s as any).poster_path || ""),
              })),
              ...animeRes.items.map((a) => ({
                item_id: String(a.id),
                item_type: "anime" as const,
                title: String((a as any).title || "Untitled"),
                image: resolvePosterUrl((a as any).image_url || (a as any).poster_path || ""),
              })),
            ];
          }
        }

        if (!active) return;
        setResults(items);
      } catch {
        if (!active) return;
        setResults([]);
      } finally {
        if (active) setSearching(false);
      }
    }
    void loadResults();
    return () => {
      active = false;
    };
  }, [category, debouncedQuery]);

  useEffect(() => {
    setSelectedEntries((prev) => prev.slice(0, maxSize));
  }, [maxSize]);

  const selectedKeySet = useMemo(
    () => new Set(selectedEntries.map((e) => `${e.item_type}:${e.item_id}`)),
    [selectedEntries],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userId = getActiveUserId();
      if (!userId) throw new Error("Not authenticated");

      if (!name.trim()) throw new Error("Collection name is required");

      const response = await createRanking(
        userId,
        name.trim(),
        category,
        maxSize,
      );
      
      const newRanking: UserRanking = {
        id: response.ranking_id,
        user_id: userId,
        name: name.trim(),
        category,
        max_size: maxSize,
        created_at: new Date().toISOString(),
      };

      const rankingId = response.ranking_id;

      if (selectedEntries.length < 2) {
        throw new Error("Pick at least 2 items from Vault");
      }

      for (const entry of selectedEntries.slice(0, maxSize)) {
        await addRankingItem(rankingId, entry.item_id, entry.item_type);
      }

      onRankingCreated(newRanking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create collection");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md bg-surface-container-lowest p-8">
        <h2 className="mb-6 font-headline text-2xl font-bold text-on-surface">
          Create Collection
        </h2>

        {error && (
          <div className="mb-4 bg-error/20 p-3 text-center">
            <p className="font-body text-sm text-error">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label className="mb-2 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Collection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Favorite Sci-Fi Films"
              className="w-full border-b border-outline-variant bg-transparent py-3 font-body text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
              disabled={loading}
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-3 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["movies", "tv", "anime", "mixed"] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  disabled={loading}
                  className={`py-2 font-label text-xs uppercase tracking-widest transition-all ${
                    category === cat
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant bg-transparent text-on-surface hover:border-primary"
                  }`}
                >
                  {cat === "mixed" ? "All Types" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <label className="mb-3 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Maximum Items
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setMaxSize(size as 5 | 10 | 15 | 20)}
                  disabled={loading}
                  className={`py-2 font-label text-xs uppercase tracking-widest transition-all ${
                    maxSize === size
                      ? "bg-primary text-on-primary"
                      : "border border-outline-variant bg-transparent text-on-surface hover:border-primary"
                  }`}
                >
                  Top {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Search Your Vault
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search movies, TV, anime..."
              className="w-full border-b border-outline-variant bg-transparent py-3 font-body text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
              disabled={loading}
            />
            <p className="mt-2 font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              Selected {selectedEntries.length} / {maxSize}
            </p>
          </div>

          {selectedEntries.length > 0 && (
            <div>
              <label className="mb-3 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
                Your Top List Order
              </label>
              <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                {selectedEntries.map((entry, idx) => (
                  <div
                    key={`${entry.item_type}:${entry.item_id}`}
                    className="flex items-center gap-3 border border-outline-variant/60 bg-surface-container-highest/30 p-2"
                  >
                    <span className="w-8 text-center font-label text-[10px] uppercase tracking-widest text-primary">
                      #{idx + 1}
                    </span>
                    {entry.image ? (
                      <img src={entry.image} alt={entry.title} className="h-12 w-9 object-cover" loading="lazy" />
                    ) : (
                      <div className="h-12 w-9 bg-surface-container-highest" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-sm text-on-surface">{entry.title}</p>
                      <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {entry.item_type}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="border border-outline-variant px-2 py-1 text-xs"
                        onClick={() =>
                          setSelectedEntries((prev) => {
                            if (idx === 0) return prev;
                            const next = [...prev];
                            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                            return next;
                          })
                        }
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        className="border border-outline-variant px-2 py-1 text-xs"
                        onClick={() =>
                          setSelectedEntries((prev) => {
                            if (idx >= prev.length - 1) return prev;
                            const next = [...prev];
                            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                            return next;
                          })
                        }
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        className="border border-outline-variant px-2 py-1 text-xs text-error"
                        onClick={() =>
                          setSelectedEntries((prev) =>
                            prev.filter((e) => !(e.item_id === entry.item_id && e.item_type === entry.item_type)),
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="mb-3 block font-label text-xs uppercase tracking-widest text-on-surface-variant">
              Vault Results
            </label>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {searching ? (
                <div className="border border-outline-variant/50 p-3 text-center text-sm text-on-surface-variant">
                  Searching...
                </div>
              ) : results.length === 0 ? (
                <div className="border border-outline-variant/50 p-3 text-center text-sm text-on-surface-variant">
                  No items found
                </div>
              ) : (
                results.map((item) => {
                  const itemKey = `${item.item_type}:${item.item_id}`;
                  const alreadySelected = selectedKeySet.has(itemKey);
                  const listFull = selectedEntries.length >= maxSize;
                  return (
                    <div
                      key={itemKey}
                      className="flex items-center gap-3 border border-outline-variant/60 bg-surface-container-highest/20 p-2"
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-14 w-10 object-cover" loading="lazy" />
                      ) : (
                        <div className="h-14 w-10 bg-surface-container-highest" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-body text-sm text-on-surface">{item.title}</p>
                        <p className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
                          {item.item_type}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={alreadySelected || listFull}
                        onClick={() => {
                          if (alreadySelected || listFull) return;
                          setSelectedEntries((prev) => [...prev, item]);
                        }}
                        className="border border-outline-variant px-3 py-1 font-label text-[10px] uppercase tracking-widest text-on-surface disabled:opacity-40"
                      >
                        {alreadySelected ? "Added" : listFull ? "Full" : "Add"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border border-outline-variant bg-transparent py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface transition-all hover:border-primary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary py-3 font-label text-xs font-bold uppercase tracking-widest text-on-primary transition-all hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
