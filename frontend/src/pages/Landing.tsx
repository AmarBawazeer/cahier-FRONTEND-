import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import SiteNav from "../components/SiteNav";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Item = {
  id: number;
  title: string;
  rank: number;
  image_url: string;
  type: string;
};

type Question = {
  itemA: Item;
  itemB: Item;
  type: string;
};

type HeroMovies = Item[] | null;

// ─────────────────────────────────────────────
// Static data
// ─────────────────────────────────────────────
// Dummy leaderboard removed - use real leaderboard page instead

const steps = [
  {
    number: "01",
    icon: "compare_arrows",
    title: "Compare",
    description:
      "Two masterpieces appear. Only one can be your choice. Use your gut, your knowledge, or your heart.",
    accent: "text-primary-container",
    bar: "bg-primary-container",
  },
  {
    number: "02",
    icon: "check_circle",
    title: "Choose",
    description:
      "Cast your vote. See how your cinematic sensibilities align with the global consensus or defy it.",
    accent: "text-tertiary",
    bar: "bg-tertiary",
  },
  {
    number: "03",
    icon: "trending_up",
    title: "Climb",
    description:
      "Accumulate streak points, unlock rare digital posters, and cement your status as a Projectionist.",
    accent: "text-primary-fixed-dim",
    bar: "bg-primary-fixed-dim",
  },
];

// ─────────────────────────────────────────────
// MatchCard
// ─────────────────────────────────────────────
type MatchCardProps = {
  title: string;
  rank: number;
  image: string;
  tiltClass: string;
  shadowClass: string;
};

function MatchCard({ title, rank, image, tiltClass, shadowClass }: MatchCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.025 }}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      className={`group relative h-full w-full overflow-hidden rounded-2xl bg-surface-container-high ${shadowClass}`}
    >
      {/* Poster fills the card */}
      <img
        src={image}
        alt={title}
        className={`h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-110 ${tiltClass}`}
        loading="lazy"
      />

      {/* Strong cinematic gradient so text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

      {/* Text overlay — centred vertically in the lower 40% */}
      <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
        <span
          className="mb-1 block font-label text-[10px] uppercase tracking-[0.22em] text-primary/90 sm:text-xs"
          style={{ textShadow: "0 1px 8px rgba(0,0,0,0.9)" }}
        >
          IMDb Rank #{rank}
        </span>
        <h3
          className="font-headline text-2xl font-bold leading-tight text-white sm:text-3xl"
          style={{ textShadow: "0 2px 16px rgba(0,0,0,1), 0 1px 4px rgba(0,0,0,0.9)" }}
        >
          {title}
        </h3>
      </div>

      {/* Hover badge */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="rounded-full border border-white/15 bg-neutral-950/80 px-4 py-2 backdrop-blur-md">
          <span className="font-label text-xs text-primary">#{rank} Ranked</span>
        </div>
      </div>
    </motion.div>
  );
}


// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────
export default function Landing() {
  const [heroMovies, setHeroMovies] = useState<HeroMovies>(null);

  useEffect(() => {
    // Load a small sample of movies from the archive for the hero posters.
    import("../api/vault")
      .then(({ listMovies }) => listMovies(40, 0))
      .then((res) => {
        const items = (res.items || []).slice(0, 40);
        if (items.length === 0) return;
        const transparentPixel =
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
        const mapped = items.map((m: any) => ({
          id: Number(m.id) || 0,
          title: m.title,
          // The hero UI expects an 'image_url' field.
          image_url: m.poster_path
            ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
            : transparentPixel,
          rank: Math.max(1, Math.round((m.vote_average || 0) * 10)),
          type: "movie",
        }));
        const unique = Array.from(new Map(mapped.map((i) => [i.id, i])).values());
        const shuffled = unique.sort(() => 0.5 - Math.random());
        setHeroMovies(shuffled.slice(0, 7));
      })
      .catch(() => {
        // silently fall back – hero section uses placeholder state
      });
  }, []);

  const heroA = heroMovies?.[0];
  const heroB = heroMovies?.[1];

  return (
    <div className="bg-surface-container-lowest text-on-surface">
      {/* ── Nav ─────────────────────────────────── */}
      <SiteNav
        action={
          <Link
            to="/game"
            className="rounded-lg bg-primary-container px-4 py-2 text-center font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-primary-container transition-all hover:opacity-85 active:scale-95 sm:px-6"
          >
            Start Playing
          </Link>
        }
      />

      {/* ── Hero ────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a]">

        {/* Subtle radial glow behind everything */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_60%,rgba(214,221,230,0.05)_0%,transparent_70%)]" />

        {/* ── Tilted poster cards ── */}
        {heroMovies && (
          <>
            {heroMovies.map((movie, index) => {
              // 7 posters distributed perfectly from left to right:
              const configs = [
                { class: "left-[-8%] sm:left-[-4%] md:left-[-2%] lg:left-[0%] bottom-[-5%]", rotate: -15, origin: "bottom left" },
                { class: "left-[12%] sm:left-[14%] md:left-[15%] lg:left-[16%] bottom-[-7%] hidden md:block", rotate: -10, origin: "bottom center" },
                { class: "left-[26%] sm:left-[28%] md:left-[30%] lg:left-[32%] bottom-[-9%] hidden sm:block", rotate: -5, origin: "bottom center" },
                { class: "left-1/2 -translate-x-1/2 bottom-[-11%] hidden lg:block z-0", rotate: 0, origin: "bottom center" },
                { class: "right-[26%] sm:right-[28%] md:right-[30%] lg:right-[32%] bottom-[-9%] hidden sm:block", rotate: 5, origin: "bottom center" },
                { class: "right-[12%] sm:right-[14%] md:right-[15%] lg:right-[16%] bottom-[-7%] hidden md:block", rotate: 10, origin: "bottom center" },
                { class: "right-[-8%] sm:right-[-4%] md:right-[-2%] lg:right-[0%] bottom-[-5%]", rotate: 15, origin: "bottom right" },
              ];
              const conf = configs[index];
              if (!conf) return null;

              return (
                <motion.div
                  key={movie.id}
                  initial={{ opacity: 0, y: 60, rotate: conf.rotate + (index < 3 ? -8 : index > 3 ? 8 : 0) }}
                  animate={{ opacity: 1, y: 0, rotate: conf.rotate }}
                  transition={{ type: "spring", stiffness: 180, damping: 24, delay: 0 + index * 0.005 }}
                  whileHover={{ rotate: conf.rotate * 0.4, scale: 1.05, y: -16, zIndex: 10 }}
                  className={`cinematic-shadow pointer-events-auto absolute w-48 origin-bottom overflow-hidden rounded-2xl border border-white/10 sm:w-56 md:w-64 lg:w-[19rem] ${conf.class}`}
                  style={{ transformOrigin: conf.origin }}
                >
                  <div className="relative aspect-[2/3]">
                    <img
                      src={movie.image_url}
                      alt={movie.title}
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5">
                      <span
                        className="mb-0.5 block font-label text-[8px] uppercase tracking-[0.2em] text-primary/90 sm:text-[10px]"
                        style={{ textShadow: "0 1px 6px rgba(0,0,0,1)" }}
                      >
                        IMDb Rank #{movie.rank}
                      </span>
                      <h3
                        className="font-headline text-sm font-bold leading-tight text-white sm:text-base md:text-lg"
                        style={{ textShadow: "0 2px 12px rgba(0,0,0,1)" }}
                      >
                        {movie.title}
                      </h3>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}

        {/* Skeleton cards while loading */}
        {!heroMovies && (
          <>
            <div className="absolute bottom-[-6%] left-[-2%] w-48 origin-bottom-left -rotate-12 rounded-2xl sm:w-56 md:w-64 lg:w-[19rem]">
              <div className="aspect-[2/3] animate-pulse rounded-2xl bg-surface-container-high" />
            </div>
            <div className="absolute bottom-[-6%] right-[-2%] w-48 origin-bottom-right rotate-12 rounded-2xl sm:w-56 md:w-64 lg:w-[19rem]">
              <div className="aspect-[2/3] animate-pulse rounded-2xl bg-surface-container-highest" />
            </div>
          </>
        )}

        {/* Top nav fade */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />

        {/* ── Centre overlay: headline + VS + CTA ── */}
        <div className="relative z-8 flex flex-col items-center gap-12 px-4 text-center">
          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-kern-tight mb-10 font-headline text-4xl font-bold italic text-on-surface sm:text-5xl md:text-6xl lg:text-7xl">
              Test your taste.
            </h1>
            <p className="font-body text-base font-light tracking-wide text-on-surface-variant sm:text-lg md:text-xl">
              Which one ranks higher?
            </p>
          </motion.div>

          {/* VS pill */}
          <motion.div
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: heroMovies ? 1 : 0, scale: heroMovies ? 1 : 0.75 }}
            transition={{ type: "spring", stiffness: 240, damping: 22, delay: 0.2 }}
            className="flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant/30 bg-surface-container-low font-headline text-xl font-bold italic text-primary shadow-[0_0_28px_rgba(214,221,230,0.2)]"
          >
            VS
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
            className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link
              to="/game"
              className="group flex w-full items-center justify-center gap-3 rounded-lg bg-primary-container px-8 py-4 text-center font-label text-xs font-bold uppercase tracking-[0.15em] text-on-primary-container shadow-neon transition-all hover:opacity-90 active:scale-95 sm:w-auto sm:px-10"
            >
              Play Now
              <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1">
                arrow_forward
              </span>
            </Link>
            <Link
              to="/vault"
              className="group flex w-full items-center justify-center gap-3 rounded-lg bg-primary-container px-8 py-4 text-center font-label text-xs font-bold uppercase tracking-[0.15em] text-on-primary-container shadow-neon transition-all hover:opacity-90 active:scale-95 sm:w-auto sm:px-10"
            >
              Explore Vault
            </Link>
          </motion.div>
        </div>
      </section>


      {/* ── Tagline ──────────────────────────────── */}
      <section className="bg-surface-container-lowest px-4 py-20 sm:px-5 md:py-24 lg:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mx-auto max-w-3xl font-headline text-3xl font-light italic leading-tight text-on-surface md:text-4xl lg:text-5xl">
            "Not a quiz. <span className="text-tertiary">A battleground</span> of
            taste."
          </h2>
        </div>
      </section>

      {/* ── How it works ─────────────────────────── */}
      <section className="relative bg-surface-container-low px-4 py-16 sm:px-5 md:py-20 lg:px-6">
        <div className="mx-auto max-w-[58rem]">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="group flex flex-col gap-6">
                <div className={`${step.accent} flex items-center gap-4`}>
                  <span className="font-headline text-5xl font-bold opacity-20">
                    {step.number}
                  </span>
                  <span className="material-symbols-outlined text-4xl">
                    {step.icon}
                  </span>
                </div>
                <div>
                  <h4 className="mb-3 font-headline text-2xl text-on-surface">
                    {step.title}
                  </h4>
                  <p className="font-body leading-relaxed text-on-surface-variant">
                    {step.description}
                  </p>
                </div>
                <div
                  className={`h-1 w-0 transition-all duration-700 group-hover:w-full ${step.bar}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature bento ────────────────────────── */}
      <section className="bg-surface-container-lowest px-4 py-20 sm:px-5 md:py-24 lg:px-6">
        <div className="mx-auto grid max-w-[58rem] grid-cols-1 gap-4 md:grid-cols-12 md:grid-rows-2">
          <div className="relative overflow-hidden rounded-[1.25rem] border border-white/5 bg-surface-container-low p-6 sm:p-7 md:col-span-8">
            <div className="relative z-10 max-w-md">
              <span className="mb-4 block font-label text-xs tracking-[0.25em] text-primary">
                EXPERIENCE
              </span>
              <h3 className="mb-3 font-headline text-2xl text-on-surface sm:text-3xl">
                Solo Journeys
              </h3>
              <p className="font-body text-base text-on-surface-variant sm:text-lg">
                Dive deep into curated genres, from New Wave French Cinema to
                Cyberpunk Dystopias.
              </p>
            </div>
            {/* Use a real movie poster here too if available */}
            <div className="pointer-events-none mt-8 h-56 overflow-hidden rounded-2xl md:absolute md:bottom-0 md:right-0 md:mt-0 md:h-full md:w-1/2 md:rounded-none md:opacity-30">
              {heroA ? (
                    <img
                  src={heroA.image_url}
                  alt={heroA.title}
                  className="h-full w-full object-cover object-top"
                      loading="lazy"
                />
              ) : (
                <div className="h-full w-full animate-pulse bg-surface-container-high" />
              )}
            </div>
          </div>

          <div className="flex flex-col rounded-[1.25rem] border border-white/5 bg-surface-container-highest p-6 md:col-span-4">
            <h4 className="mb-6 font-label text-xs tracking-[0.25em] text-tertiary">
              TOP PROJECTIONISTS
            </h4>
            <p className="font-body text-on-surface-variant mb-6">
              View the global rankings of the best projectionist talents.
            </p>
            <Link
              to="/leaderboard"
              className="mt-8 text-center font-label text-xs uppercase tracking-[0.25em] text-primary transition-colors hover:text-on-surface"
            >
              View Rankings
            </Link>
          </div>

          <div className="rounded-[1.25rem] border border-primary/10 bg-gradient-to-br from-primary-container/20 to-secondary-container/10 p-6 sm:p-7 md:col-span-5">
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container text-on-primary-container shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined">auto_awesome</span>
            </div>
            <h3 className="mb-2 font-headline text-2xl text-on-surface">
              Airin AI
            </h3>
            <p className="font-body text-on-surface-variant">
              Your personal AI curator. Learn why certain films resonate through
              deep semiotic analysis.
            </p>
          </div>

          <div className="group flex flex-col justify-between gap-6 rounded-[1.25rem] border border-white/5 bg-surface-container-high p-6 sm:p-7 md:col-span-7 md:flex-row md:items-center">
            <div className="max-w-xs">
              <h3 className="mb-2 font-headline text-2xl text-on-surface">
                Ranking Mixer
              </h3>
              <p className="font-body text-on-surface-variant">
                Create your personal top-5/10/15/20 lists and test your memory against them. Challenge yourself.
              </p>
              <Link
                to="/ranking-mixer"
                className="mt-6 inline-flex items-center gap-2 font-label text-xs uppercase tracking-[0.2em] text-tertiary transition-all duration-300 group-hover:gap-4"
              >
                Start Mixing
                <span className="material-symbols-outlined text-sm">
                  trending_flat
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────── */}
      <section className="relative overflow-hidden bg-surface-container-lowest px-4 py-24 sm:px-5 md:py-28 lg:px-6">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(214,221,230,0.06)_0%,transparent_70%)]" />
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <h2 className="text-kern-tight mb-6 font-headline text-3xl italic text-on-surface sm:text-4xl md:text-5xl lg:text-6xl">
            Ready to prove your taste?
          </h2>
          <div className="flex flex-col items-center gap-8">
            <Link
              to="/game"
              className="rounded-lg bg-primary-container px-10 py-5 font-label text-base font-bold uppercase tracking-[0.2em] text-on-primary-container shadow-2xl shadow-primary/20 transition-transform duration-300 hover:scale-105 sm:px-16 sm:py-6 sm:text-lg"
            >
              Play Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="w-full border-t border-neutral-900 bg-neutral-950 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6">
          <div className="font-headline text-lg italic text-neutral-200">Cahier</div>
          <div className="flex flex-wrap justify-center gap-6 font-label text-[10px] uppercase tracking-[0.2em] text-neutral-500 sm:gap-8">
            {["Terms", "Privacy", "Press", "Contact"].map((label) => (
              <a
                key={label}
                className="text-neutral-600 transition-colors hover:text-zinc-200"
                href="#"
              >
                {label}
              </a>
            ))}
          </div>
          <div className="text-center font-label text-[10px] uppercase tracking-[0.2em] text-neutral-500">
            {"\u00A9"} 2024 Cahier. The Digital Projectionist.
          </div>
        </div>
      </footer>
    </div>
  );
}
