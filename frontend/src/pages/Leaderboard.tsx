import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getLeaderboard, type LeaderboardEntry } from "../api/leaderboard";
import PageLayout from "../components/PageLayout";

type Category = "movies" | "tv" | "anime" | "mixed";

type RankingMixerEntry = {
  rank: number;
  user_id: string;
  username: string;
  score: number;
  wins: number;
  category: Category;
  mode?: string;
};

type LeaderboardCard = {
  place: string;
  name: string;
  points: string;
  rank: number;
  mode: string;
  primary?: boolean;
  secondary?: boolean;
  tertiary?: boolean;
};

function formatScore(score: number) {
  return score.toLocaleString();
}

function initials(name: string) {
  return name
    .split(/[\s_]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function PodiumAvatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center border border-outline-variant/20 bg-zinc-900 text-zinc-100 ${
        large ? "h-32 w-32 text-3xl" : "h-20 w-20 text-xl"
      }`}
    >
      <span className="font-headline tracking-[0.2em]">{initials(name)}</span>
    </div>
  );
}

function PodiumCard({
  card,
  index,
}: {
  card: LeaderboardCard;
  index: number;
}) {
  if (card.primary) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        className="order-1 md:order-2 md:col-span-6"
      >
        <div className="neon-glow-purple relative overflow-hidden border-t border-primary/20 bg-surface-container-high p-8 sm:p-10 lg:p-12">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-0 top-0 p-6 font-label text-6xl font-extrabold italic text-primary opacity-20">
            {card.place}
          </div>
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-start md:text-left">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 scale-110 border-2 border-primary/30" />
              <PodiumAvatar name={card.name} large />
            </div>
            <div className="flex-grow">
              <div className="mb-4 inline-flex items-center gap-2 bg-primary/10 px-3 py-1 font-label text-[10px] uppercase tracking-[0.2em] text-primary">
                <span
                  className="material-symbols-outlined text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  stars
                </span>
                Rank #{card.rank}
              </div>
              <h2 className="mb-2 font-headline text-4xl font-bold text-on-surface md:text-5xl">
                {card.name}
              </h2>
              <p className="mb-6 font-label text-sm italic tracking-[0.2em] text-secondary">
                {card.mode || "ALL-TIME"}
              </p>
              <div className="mb-6 h-px w-full bg-outline-variant/20" />
              <div className="flex items-end justify-between gap-4">
                <div>
                  <span className="font-headline text-4xl font-bold text-on-surface sm:text-5xl">
                    {card.points}
                  </span>
                  <span className="ml-2 font-label text-xs uppercase tracking-widest text-on-surface-variant/60">
                    Lifetime Score
                  </span>
                </div>
                <span className="material-symbols-outlined text-4xl text-primary opacity-50">
                  verified
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`${card.secondary ? "order-2 md:order-1" : "order-3"} md:col-span-3`}
    >
      <div className="group relative overflow-hidden bg-surface-container-low p-8 transition-all duration-500 hover:bg-surface-container">
        <div className="absolute right-0 top-0 p-4 font-label text-4xl font-bold italic opacity-10">
          {card.place}
        </div>
        <div className="relative mb-6">
          <PodiumAvatar name={card.name} />
        </div>
        <h3 className="mb-1 font-headline text-2xl font-bold text-on-surface">
          {card.name}
        </h3>
        <p className="mb-4 font-label text-xs tracking-widest text-secondary">
          {card.mode || "ALL-TIME"}
        </p>
        <div className="flex items-end justify-between">
          <span className="font-headline text-3xl font-bold text-on-surface">
            {card.points}
          </span>
          <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant opacity-50">
            PTS
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function RowAvatar({ name }: { name: string }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center bg-zinc-900 text-zinc-100">
      <span className="font-headline text-sm tracking-[0.2em]">{initials(name)}</span>
    </div>
  );
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [mixerEntries, setMixerEntries] = useState<RankingMixerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"game" | "mixer">("game");
  const [category, setCategory] = useState<Category>("movies");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (view === "game") {
          const response = await getLeaderboard(10);
          if (!active) return;
          setEntries(Array.isArray(response.leaderboard) ? response.leaderboard : []);
        } else {
          // Load ranking mixer leaderboard for selected category
          const response = await fetch(
            `/api/leaderboard/ranking-mixer?category=${category}&limit=10`
          );
          if (!response.ok) throw new Error("Failed to load ranking mixer leaderboard");
          const data = await response.json();
          if (!active) return;
          setMixerEntries(data.leaderboard || []);
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load leaderboard");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [view, category]);

  const gamePodum = useMemo(() => {
    const topThree = (entries || []).slice(0, 3);
    const second = topThree.find((entry) => entry.rank === 2);
    const first = topThree.find((entry) => entry.rank === 1);
    const third = topThree.find((entry) => entry.rank === 3);

    return [second, first, third]
      .filter((entry): entry is LeaderboardEntry => Boolean(entry))
      .map((entry, index) => ({
        place: String(entry.rank).padStart(2, "0"),
        name: entry.username,
        points: formatScore(entry.score),
        rank: entry.rank,
        mode: entry.mode,
        primary: entry.rank === 1,
        secondary: entry.rank === 2,
        tertiary: entry.rank === 3,
        key: `${entry.user_id}-${entry.rank}-${index}`,
      }));
  }, [entries]);

  const mixerPodium = useMemo(() => {
    const topThree = (mixerEntries || []).slice(0, 3);
    const second = topThree.find((entry) => entry.rank === 2);
    const first = topThree.find((entry) => entry.rank === 1);
    const third = topThree.find((entry) => entry.rank === 3);

    return [second, first, third]
      .filter((entry): entry is RankingMixerEntry => Boolean(entry))
      .map((entry, index) => ({
        place: String(entry.rank).padStart(2, "0"),
        name: entry.username,
        points: formatScore(entry.score),
        rank: entry.rank,
        mode: category.toUpperCase(),
        primary: entry.rank === 1,
        secondary: entry.rank === 2,
        tertiary: entry.rank === 3,
        key: `${entry.user_id}-${entry.rank}-${index}`,
      }));
  }, [mixerEntries, category]);

  const gameRankingRows = useMemo(() => (entries || []).slice(3, 10), [entries]);
  const mixerRankingRows = useMemo(() => (mixerEntries || []).slice(3, 10), [mixerEntries]);

  return (
    <PageLayout>

      <main className="mx-auto min-h-screen max-w-[58rem] px-4 pb-16 pt-6 sm:px-5 md:px-8">
        <header className="mb-16 text-center md:mb-20 md:text-left">
          <h1 className="mb-4 font-headline text-3xl font-bold tracking-tighter text-on-surface sm:text-4xl md:text-6xl">
            The Projectionist&apos;s <span className="italic text-primary">Circle</span>
          </h1>
          <p className="max-w-xl font-body text-lg text-on-surface-variant opacity-80">
            Reserved for the elite curators. Those who see the frames others miss.
          </p>
        </header>

        {/* View Toggle */}
        <div className="mb-12 flex gap-4 border-b border-outline-variant/20 pb-6">
          <button
            onClick={() => setView("game")}
            className={`font-label text-sm uppercase tracking-widest transition-colors ${
              view === "game"
                ? "border-b-2 border-primary pb-2 text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Game Sessions
          </button>
          <button
            onClick={() => setView("mixer")}
            className={`font-label text-sm uppercase tracking-widest transition-colors ${
              view === "mixer"
                ? "border-b-2 border-primary pb-2 text-primary"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Ranking Mixer
          </button>
        </div>

        {/* Category Filter for Ranking Mixer */}
        {view === "mixer" && (
          <div className="mb-12 flex flex-wrap gap-3">
            {(["movies", "tv", "anime", "mixed"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`font-label text-[11px] uppercase tracking-widest px-4 py-2 transition-all ${
                  category === cat
                    ? "bg-primary text-on-primary"
                    : "border border-outline-variant bg-transparent text-on-surface-variant hover:border-primary hover:text-primary"
                }`}
              >
                {cat === "mixed" ? "All Types" : cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <section className="space-y-4">
            <div className="h-80 animate-pulse bg-surface-container-low" />
            <div className="h-20 animate-pulse bg-surface-container-low" />
            <div className="h-20 animate-pulse bg-surface-container-low" />
          </section>
        ) : error ? (
          <section className="border border-primary/10 bg-surface-container-low p-8 text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-primary">
              Leaderboard Unavailable
            </p>
            <p className="mt-4 font-body text-on-surface-variant">{error}</p>
          </section>
        ) : view === "game" && entries.length === 0 ? (
          <section className="border border-primary/10 bg-surface-container-low p-8 text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-primary">
              No Rankings Yet
            </p>
            <p className="mt-4 font-body text-on-surface-variant">
              This page will populate after real game scores are recorded.
            </p>
          </section>
        ) : view === "mixer" && mixerEntries.length === 0 ? (
          <section className="border border-primary/10 bg-surface-container-low p-8 text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.3em] text-primary">
              No Rankings Yet
            </p>
            <p className="mt-4 font-body text-on-surface-variant">
              Rankings will appear after players complete battles in {category} mode.
            </p>
          </section>
        ) : (
          <>
            <section className="mb-16 grid grid-cols-1 items-end gap-4 md:mb-20 md:grid-cols-12">
              {(view === "game" ? gamePodum : mixerPodium).map((card, index) => (
                <PodiumCard key={`${card.rank}-${card.name}`} card={card} index={index} />
              ))}
            </section>

            <section className="mx-auto max-w-4xl">
              <div className="mb-8 flex flex-col gap-4 px-2 sm:px-4 md:flex-row md:items-center md:justify-between">
                <h4 className="font-label text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500">
                  Supporting Cast / Ranks 04-10
                </h4>
              </div>

              <div className="space-y-px">
                {(view === "game" ? gameRankingRows : mixerRankingRows).map((row, index) => (
                  <motion.div
                    key={`${row.user_id || row.user_id}-${row.rank}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="group flex items-center gap-4 bg-surface-container-low/40 p-4 transition-all duration-300 hover:bg-surface-container-high sm:gap-6 sm:p-6"
                  >
                    <div className="w-10 font-headline text-xl italic text-on-surface-variant transition-colors group-hover:text-primary sm:w-12">
                      {String(row.rank).padStart(2, "0")}
                    </div>
                    <div className="flex-shrink-0">
                      <RowAvatar name={row.username} />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <h5 className="truncate font-body font-bold text-on-surface transition-transform group-hover:translate-x-1">
                        {row.username}
                      </h5>
                      <p className="font-label text-[10px] uppercase tracking-widest text-zinc-500">
                        {view === "game" ? row.mode || "all-time" : `${category}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-headline text-xl font-bold text-on-surface">
                        {formatScore(row.score)}
                      </div>
                      <div className="font-label text-[8px] uppercase tracking-widest text-on-surface-variant opacity-40">
                        Points
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </PageLayout>
  );
}
