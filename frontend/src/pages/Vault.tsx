import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  listMovies,
  listTVShows,
  listAnime,
  searchAll,
  type Movie,
  type TVShow,
  type Anime,
  type SearchAllItem,
} from "../api/vault";
import { resolvePosterUrl } from "../api/client";
import PageLayout from "../components/PageLayout";

type Category = "movies" | "tv" | "anime" | "all";

type VaultEntry = {
  id: string;
  title: string;
  category: "Movie" | "TV" | "Anime";
  score: string;
  year: string;
  image: string;
  featured?: boolean;
};

function toVaultEntry(
  item: Movie | TVShow | Anime,
  category: "Movie" | "TV" | "Anime",
  featured = false
): VaultEntry {
  let year = "";
  if ("release_date" in item && item.release_date) {
    year = item.release_date.slice(0, 4);
  } else if ("first_air_date" in item && item.first_air_date) {
    year = item.first_air_date.slice(0, 4);
  }

  // Some APIs use `name` for TV shows; default to a safe fallback.
  const title =
    (("title" in item && (item as any).title) ||
      ("name" in item && (item as any).name)) ??
    "Untitled";

  return {
    id: item.id,
    title: String(title),
    category,
    score: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
    year: year || "----",
    image: resolvePosterUrl((item as any).poster_path || (item as any).image_url),
    featured,
  };
}

function toVaultEntryFromSearch(item: SearchAllItem): VaultEntry {
  return {
    id: item.id,
    title: item.title || "Untitled",
    category: item.category === "movies" ? "Movie" : item.category === "tv" ? "TV" : "Anime",
    score: typeof item.score === "number" ? item.score.toFixed(1) : "N/A",
    year: "----",
    image: resolvePosterUrl(item.poster_path || item.image_url || ""),
  };
}

function VaultCard({ entry, index }: { entry: VaultEntry; index: number }) {
  const isFeatured = Boolean(entry.featured);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05 }}
      className={`group cinematic-glow relative overflow-hidden bg-surface-container-low transition-all duration-500 ${
        isFeatured ? "col-span-1 sm:col-span-2 lg:row-span-2" : ""
      }`}
    >
      <Link to={`/vault/${entry.id}`} className="block h-full">
        <div
          className={`relative overflow-hidden ${
            isFeatured ? "aspect-[2/3] lg:h-full lg:aspect-auto" : "aspect-[2/3]"
          }`}
        >
          {entry.image ? (
            <img
              className={`h-full w-full object-cover grayscale transition-all ease-out group-hover:grayscale-0 ${
                isFeatured
                  ? "duration-1000 group-hover:scale-105"
                  : "duration-700 group-hover:scale-110"
              }`}
              src={entry.image}
              alt={entry.title}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-neutral-900 text-neutral-300">
              <span className="font-headline text-2xl uppercase tracking-[0.2em]">
                {String(entry.title ?? "").slice(0, 2)}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest to-transparent opacity-60 transition-opacity group-hover:opacity-40" />
          <div
            className={`absolute inset-0 flex flex-col justify-end transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100 ${
              isFeatured ? "translate-y-4 p-8 opacity-0" : "translate-y-4 p-6 opacity-0"
            }`}
          >
            <div className="mb-2 flex items-center gap-4">
              <span className="bg-tertiary px-2 py-0.5 font-label text-xs font-bold text-on-tertiary">
                {entry.score}
              </span>
              <span className="font-label text-xs uppercase tracking-widest text-neutral-300">
                {entry.year}
              </span>
            </div>
            <h3
              className={`mb-2 font-headline text-white ${
                isFeatured ? "text-4xl" : "text-2xl"
              }`}
            >
              {entry.title}
            </h3>
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
              {entry.category}
            </p>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

const ITEMS_PER_PAGE = 20;

export default function Vault() {
  const [category, setCategory] = useState<Category>("all");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [tvShows, setTVShows] = useState<TVShow[]>([]);
  const [anime, setAnime] = useState<Anime[]>([]);
  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [allSearchEntries, setAllSearchEntries] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handle = setTimeout(() => setQuery(rawQuery), 400);
    return () => clearTimeout(handle);
  }, [rawQuery]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const trimmedQuery = query.trim();
        const isSearching = trimmedQuery.length > 0;
        const requestOrder = isSearching ? undefined : "random";
        const requestSort = isSearching ? undefined : "rating";

        if (isSearching && category === "all") {
          const searchRes = await searchAll(trimmedQuery, ITEMS_PER_PAGE);
          if (!active) return;
          setMovies([]);
          setTVShows([]);
          setAnime([]);
          setAllSearchEntries((searchRes.items || []).map(toVaultEntryFromSearch));
          return;
        }

        if (active) setAllSearchEntries([]);

        if (category === "movies" || category === "all") {
          const moviesData = await listMovies(
            ITEMS_PER_PAGE,
            offset,
            trimmedQuery || undefined,
            requestOrder,
            requestSort
          );
          if (!active) return;
          setMovies(Array.isArray((moviesData as any).items) ? ((moviesData as any).items as Movie[]) : []);
        } else if (active) {
          setMovies([]);
        }

        if (category === "tv" || category === "all") {
          const tvData = await listTVShows(
            ITEMS_PER_PAGE,
            offset,
            trimmedQuery || undefined,
            requestOrder,
            requestSort
          );
          if (!active) return;
          setTVShows(Array.isArray((tvData as any).items) ? ((tvData as any).items as TVShow[]) : []);
        } else if (active) {
          setTVShows([]);
        }

        if (category === "anime" || category === "all") {
          const animeData = await listAnime(
            ITEMS_PER_PAGE,
            offset,
            trimmedQuery || undefined,
            requestOrder,
            requestSort
          );
          if (!active) return;
          setAnime(Array.isArray((animeData as any).items) ? ((animeData as any).items as Anime[]) : []);
        } else if (active) {
          setAnime([]);
        }
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error ? loadError.message : "Could not fetch content."
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [category, page, query, shuffleSeed]);

  // Stable shuffle based on category+page so typing doesn't reshuffle
  function mulberry32(seed: number) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffleStable<T>(arr: T[], seed: number): T[] {
    const a = arr.slice();
    const rand = mulberry32(seed);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const vaultEntries = useMemo(() => {
    let items: VaultEntry[] = [];

    if (category === "movies" || category === "all") {
      items = items.concat(
        (movies || []).map((movie) => toVaultEntry(movie, "Movie"))
      );
    }

    if (category === "tv" || category === "all") {
      items = items.concat((tvShows || []).map((tv) => toVaultEntry(tv, "TV")));
    }

    if (category === "anime" || category === "all") {
      items = items.concat((anime || []).map((a) => toVaultEntry(a, "Anime")));
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery && category === "all") {
      return allSearchEntries.map((item, index) => ({
        ...item,
        featured: index === 0 && allSearchEntries.length > 0,
      }));
    }

    // Randomize only when there is no active query.
    const randomized =
      trimmedQuery.length > 0
        ? items
        : shuffleStable(
            items,
            Math.abs(
              Array.from(`${category}-${page}-${shuffleSeed}`).reduce(
                (acc, ch) => acc + ch.charCodeAt(0),
                0
              )
            )
          );

    return randomized.map((item, index) => ({
      ...item,
      featured: index === 0 && randomized.length > 0,
    }));
  }, [movies, tvShows, anime, category, query, page, shuffleSeed, allSearchEntries]);

  const categories: Array<{ key: Category; label: string }> = [
    { key: "all", label: "All" },
    { key: "movies", label: "Movies" },
    { key: "tv", label: "TV" },
    { key: "anime", label: "Anime" },
  ];

  return (
    <PageLayout>
      {/* Main */}
      <div className="mx-auto min-h-screen max-w-5xl px-4 pb-12 pt-4 sm:px-5 lg:px-6">
        <header className="mb-12 lg:mb-16">
          <h1 className="mb-6 font-headline text-4xl font-bold tracking-tighter text-on-surface sm:text-5xl md:text-6xl lg:text-7xl">
            The Vault
          </h1>

          {/* Category Tabs */}
          <div className="mb-8 flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => {
                  setCategory(cat.key);
                  setPage(1);
                }}
                className={`font-label text-[11px] uppercase tracking-widest px-4 py-2 transition-all duration-300 ${
                  category === cat.key
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant bg-transparent text-on-surface-variant hover:border-primary hover:text-primary"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="group w-full md:w-[28rem]">
              <label className="mb-2 block font-label text-[10px] uppercase tracking-[0.2em] text-neutral-500">
                Search Archive
              </label>
              <div className="relative">
                <input
                  className="w-full border-b border-outline-variant/40 bg-transparent py-4 font-body text-lg placeholder:text-neutral-600 transition-all duration-500 focus:border-primary focus:outline-none sm:text-xl"
                  placeholder="Title..."
                  type="text"
                  value={rawQuery}
                  onChange={(event) => {
                    setRawQuery(event.target.value);
                    setPage(1);
                  }}
                />
                {rawQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRawQuery("");
                      setQuery("");
                      setPage(1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-label text-[10px] uppercase tracking-widest text-neutral-500 hover:text-primary"
                  >
                    Clear
                  </button>
                ) : null}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-primary transition-all duration-700 group-focus-within:w-full" />
              </div>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <button
                onClick={() => {
                  setPage(1); // keep pagination reset explicit
                }}
                className="rounded-sm border border-outline-variant px-4 py-1.5 font-label text-[11px] uppercase tracking-widest hover:border-primary hover:text-primary"
                title="Sort by IMDb rating"
                disabled={query.trim().length > 0}
              >
                Sort: Rating
              </button>
              <button
                onClick={() => {
                  setShuffleSeed((s) => s + 1);
                }}
                className="rounded-sm border border-outline-variant px-4 py-1.5 font-label text-[11px] uppercase tracking-widest hover:border-primary hover:text-primary"
                title="Shuffle results"
                disabled={query.trim().length > 0}
              >
                Shuffle
              </button>
              <div className="mr-1 flex items-center gap-2 sm:mr-4">
                <span className="font-label text-[10px] uppercase tracking-[0.1em] text-neutral-500">
                  Source:
                </span>
              </div>
              <span className="rounded-sm bg-surface-container-highest px-4 py-1.5 font-label text-[11px] uppercase tracking-widest text-on-surface-variant">
                {category === "all"
                  ? "All Media"
                  : category === "movies"
                    ? "Movies"
                    : category === "tv"
                      ? "TV Shows"
                      : "Anime"}
              </span>
            </div>
          </div>
          {query.trim() ? (
            <p className="mt-3 font-label text-[10px] uppercase tracking-[0.18em] text-neutral-500">
              {loading
                ? `Searching "${query.trim()}"...`
                : `${vaultEntries.length} results for "${query.trim()}"`}
            </p>
          ) : null}
        </header>

        {loading ? (
          <section className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="aspect-[2/3] animate-pulse bg-surface-container-low" />
            ))}
          </section>
        ) : error ? (
          <section className="bg-surface-container-low p-8 text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
              Archive Unavailable
            </p>
            <p className="mt-4 font-body text-on-surface-variant">{error}</p>
          </section>
        ) : vaultEntries.length === 0 ? (
          <section className="bg-surface-container-low p-8 text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
              No Results
            </p>
            <p className="mt-4 font-body text-on-surface-variant">
              {movies.length === 0 && tvShows.length === 0 && anime.length === 0
                ? "No titles loaded yet."
                : "No titles matched your search."}
            </p>
          </section>
        ) : (
          <>
            <section className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {vaultEntries.map((entry, index) => (
                <VaultCard key={`${entry.category}:${entry.id}`} entry={entry} index={index} />
              ))}
            </section>

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="font-label text-[11px] uppercase tracking-widest px-4 py-2 border border-outline-variant disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary"
              >
                Previous
              </button>
              <span className="font-label text-sm text-on-surface-variant">
                Page {page}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={vaultEntries.length < ITEMS_PER_PAGE}
                className="font-label text-[11px] uppercase tracking-widest px-4 py-2 border border-outline-variant disabled:opacity-50 disabled:cursor-not-allowed hover:border-primary"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
