import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import PageLayout from "../components/PageLayout";
import {
  getMovie,
  getTVShow,
  getAnime,
  listMovies,
  listTVShows,
  listAnime,
  type Movie,
  type TVShow,
  type Anime,
  type VaultItem,
} from "../api/vault";
import { resolvePosterUrl } from "../api/client";

function formatYear(value: string) {
  return value ? new Date(value).getFullYear().toString() : "Unknown";
}

function formatScore(value: number) {
  return value ? value.toFixed(1) : "N/A";
}

type Kind = "movie" | "tv" | "anime";

export default function VaultItem() {
  const { id } = useParams<{ id: string }>();
  const [kind, setKind] = useState<Kind | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [tv, setTV] = useState<TVShow | null>(null);
  const [animeItem, setAnimeItem] = useState<Anime | null>(null);
  const [related, setRelated] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id) {
        setError("Missing vault item.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Try movie → tv → anime in order
        try {
          const movieResponse = await getMovie(id);
          if (!active) return;
          if ((movieResponse as any)?.item) {
            setKind("movie");
            setMovie((movieResponse as any).item as Movie);
            const rel = await listMovies(12, 0);
            const items = Array.isArray(rel.items) ? rel.items : [];
            setRelated(items.filter((e) => e.id !== id).slice(0, 4));
            return;
          }
        } catch {}

        try {
          const tvResponse = await getTVShow(id);
          if (!active) return;
          if ((tvResponse as any)?.item) {
            setKind("tv");
            setTV((tvResponse as any).item as TVShow);
            const rel = await listTVShows(12, 0);
            const items = Array.isArray(rel.items) ? rel.items : [];
            setRelated(items.filter((e) => e.id !== id).slice(0, 4));
            return;
          }
        } catch {}

        try {
          const animeResponse = await getAnime(id);
          if (!active) return;
          if ((animeResponse as any)?.item) {
            setKind("anime");
            setAnimeItem((animeResponse as any).item as Anime);
            const rel = await listAnime(12, 0);
            const items = Array.isArray(rel.items) ? rel.items : [];
            setRelated(items.filter((e) => e.id !== id).slice(0, 4));
            return;
          }
        } catch {}

        // If none matched:
        throw new Error("Item not found");
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load vault item.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const stats = useMemo(() => {
    const subject = movie ?? tv ?? animeItem;
    if (!subject) return [];

    return [
      {
        label: "Release",
        value: formatYear(
          (subject as Movie).release_date || (subject as TVShow).first_air_date || ""
        ),
      },
      { label: "Score", value: formatScore((subject as Movie).vote_average || (subject as Anime).score || 0) },
      { label: "Popularity", value: Math.round(subject.popularity || 0).toLocaleString() },
      { label: "Record", value: subject.id },
    ];
  }, [movie, tv, animeItem]);

  return (
    <PageLayout>

      <main className="min-h-screen pb-16 pt-6">
        {loading ? (
          <div className="mx-auto max-w-6xl px-4 sm:px-5 lg:px-6">
            <div className="h-[28rem] animate-pulse bg-surface-container-low" />
          </div>
        ) : error || (!movie && !tv && !animeItem) ? (
          <div className="mx-auto max-w-3xl px-4 sm:px-5 lg:px-6">
            <section className="bg-surface-container-low p-8 sm:p-10">
              <p className="font-label text-[10px] uppercase tracking-[0.22em] text-primary">
                Vault
              </p>
              <h1 className="mt-5 font-headline text-4xl tracking-tight text-on-surface sm:text-5xl">
                Item unavailable
              </h1>
              <p className="mt-5 font-body text-base leading-relaxed text-on-surface-variant">
                {error || "This vault entry could not be found in the backend archive."}
              </p>
              <Link
                to="/vault"
                className="mt-8 inline-flex rounded-lg bg-primary-container px-6 py-3 font-label text-[11px] uppercase tracking-[0.18em] text-on-primary-container transition-transform hover:scale-[1.02]"
              >
                Back to Vault
              </Link>
            </section>
          </div>
        ) : (
          <>
            <section className="relative overflow-hidden">
              <div className="absolute inset-0">
                <img
                  className="h-full w-full object-cover opacity-30"
                  src={resolvePosterUrl(
                    (movie as Movie)?.poster_path ||
                      (tv as TVShow)?.poster_path ||
                      (animeItem as Anime)?.image_url
                  )}
                  alt={
                    (movie as Movie)?.title ||
                    (tv as any)?.name ||
                    (tv as any)?.title ||
                    (animeItem as Anime)?.title
                  }
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/60 to-surface-container-lowest" />
              </div>

              <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-5 md:grid-cols-[18rem_1fr] lg:px-6 lg:py-16">
                <div className="mx-auto w-full max-w-xs md:mx-0">
                  <div className="overflow-hidden border border-white/10 bg-surface-container-high shadow-2xl">
                    <img
                      className="aspect-[2/3] w-full object-cover"
                      src={resolvePosterUrl(
                        (movie as Movie)?.poster_path ||
                          (tv as TVShow)?.poster_path ||
                          (animeItem as Anime)?.image_url ||
                          ""
                      )}
                      alt={
                        (movie as Movie)?.title ||
                        (tv as any)?.name ||
                        (tv as any)?.title ||
                        (animeItem as Anime)?.title ||
                        "Poster"
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end">
                  <p className="font-label text-[10px] uppercase tracking-[0.22em] text-primary">
                    Archive Record
                  </p>
                  <motion.h1
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-5 font-headline text-4xl tracking-tight text-on-surface sm:text-5xl lg:text-6xl"
                  >
                    {(movie as Movie)?.title ||
                      (tv as any)?.name ||
                      (tv as any)?.title ||
                      (animeItem as Anime)?.title ||
                      "Untitled"}
                  </motion.h1>

                  <div className="mt-5 flex flex-wrap gap-4 font-label text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                    <span>
                      {formatYear(
                        (movie as Movie)?.release_date ||
                          (tv as TVShow)?.first_air_date ||
                          ""
                      )}
                    </span>
                    <span>
                      {formatScore(
                        (movie as Movie)?.vote_average || (animeItem as Anime)?.score || 0
                      )}{" "}
                      rating
                    </span>
                    <span>
                      {Math.round((movie ?? tv ?? animeItem)?.popularity || 0)} popularity
                    </span>
                  </div>

                  <p className="mt-8 max-w-3xl font-body text-base leading-relaxed text-on-surface-variant sm:text-lg">
                    {(movie ?? tv ?? animeItem)?.overview ??
                      (animeItem as Anime)?.synopsis ??
                      "No synopsis is available yet for this title."}
                  </p>
                </div>
              </div>
            </section>

            <section className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-5 lg:grid-cols-[1fr_20rem] lg:px-6">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-px overflow-hidden bg-outline-variant/10 md:grid-cols-4">
                  {stats.map((item) => (
                    <div key={item.label} className="bg-surface-container-low p-5 sm:p-6">
                      <p className="font-label text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        {item.label}
                      </p>
                      <p className="mt-2 font-headline text-2xl text-on-surface">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-headline text-2xl text-on-surface">Related Archive</h2>
                    <Link
                      to="/vault"
                      className="font-label text-[10px] uppercase tracking-[0.18em] text-primary"
                    >
                      View All
                    </Link>
                  </div>

                  {related.length > 0 ? (
                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                      {related.map((entry) => (
                        <Link key={entry.id} to={`/vault/${entry.id}`} className="group">
                          <div className="overflow-hidden bg-surface-container-low">
                            <img
                              className="aspect-[2/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              src={resolvePosterUrl((entry as any).poster_path || (entry as any).image_url)}
                              alt={entry.title}
                            />
                          </div>
                          <h3 className="mt-3 font-headline text-lg text-on-surface">{entry.title}</h3>
                          <p className="mt-1 font-label text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                            {formatYear(String((entry as any).release_date || (entry as any).first_air_date || ""))} · {formatScore(Number((entry as any).vote_average ?? (entry as any).score ?? 0))}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface-container-low p-6">
                      <p className="font-body text-on-surface-variant">
                        More related vault records will appear here once the archive grows.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <aside className="bg-surface-container-low p-6 sm:p-8">
                <p className="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Archive Note
                </p>
                <p className="mt-4 font-body leading-relaxed text-on-surface-variant">
                  This detail page is now backed by the real movie endpoint instead of placeholder
                  content. As more fields land in the backend, this panel can expand without
                  changing the page structure.
                </p>
                <Link
                  to="/game"
                  className="mt-8 inline-flex rounded-lg border border-outline-variant/20 px-5 py-3 font-label text-[11px] uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                >
                  Rank Titles
                </Link>
              </aside>
            </section>
          </>
        )}
      </main>
    </PageLayout>
  );
}
