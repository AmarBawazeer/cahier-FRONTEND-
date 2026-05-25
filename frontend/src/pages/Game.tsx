import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  endGameSession,
  GameCard,
  GameRound,
  getGameRound,
  startGameSession,
  submitGameAnswer,
  type GameMode,
} from "../api/game";
import { ensureDemoUser } from "../api/users";

type AnswerState = "idle" | "correct" | "wrong" | "revealing";

type DuelCardProps = {
  item: GameCard;
  answerState: AnswerState;
  isChosen: boolean;
  isCorrectCard: boolean;
  compareDirection: "higher" | "lower";
  onClick: () => void;
  disabled: boolean;
};

function DuelCard({
  item,
  answerState,
  isChosen,
  isCorrectCard,
  compareDirection,
  onClick,
  disabled,
}: DuelCardProps) {
  const revealed =
    answerState === "revealing" ||
    answerState === "correct" ||
    answerState === "wrong";

  let overlayClass = "";
  if (revealed && isChosen) {
    overlayClass = isCorrectCard ? "bg-emerald-500/30" : "bg-red-500/30";
  } else if (revealed && isCorrectCard) {
    overlayClass = "bg-emerald-500/20";
  }

  let borderClass = "border-outline-variant/15";
  if (revealed && isChosen) {
    borderClass = isCorrectCard ? "ring-2 ring-emerald-400/80" : "ring-2 ring-red-500/80";
  } else if (revealed && isCorrectCard) {
    borderClass = "ring-2 ring-emerald-400/40";
  }

  return (
    <motion.button
      id={`duel-card-${item.id}`}
      whileHover={!disabled ? { y: -10, scale: 1.015 } : {}}
      whileTap={!disabled ? { scale: 0.975 } : {}}
      transition={{ type: "spring", stiffness: 240, damping: 22 }}
      onClick={!disabled ? onClick : undefined}
      className={`group relative aspect-[2/3] w-full max-w-[16rem] cursor-pointer text-left md:max-w-[17rem] lg:max-w-[18rem] ${disabled ? "pointer-events-none" : ""}`}
    >
      <div
        className={`neon-glow-hover cinematic-shadow relative flex h-full w-full overflow-hidden rounded-lg transition-all duration-500 ease-out ${borderClass}`}
      >
        <img
          alt={item.title}
          src={item.imageUrl}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-8">
          <h2 className="mb-2 font-headline text-2xl font-bold leading-none text-on-surface sm:text-3xl">
            {item.title}
          </h2>

          <AnimatePresence>
            {revealed && (
              <motion.div
                initial={{ opacity: 0, y: 12, scale: 0.88 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.88 }}
                transition={{ type: "spring", stiffness: 280, damping: 24 }}
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  isCorrectCard ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {compareDirection === "higher"
                  ? isCorrectCard
                    ? "Higher Score"
                    : "Lower Score"
                  : isCorrectCard
                    ? "Lower Score"
                    : "Higher Score"}
                <span className="opacity-60">
                  {item.metricLabel}: {item.metric.toFixed(1)}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className={`pointer-events-none absolute inset-0 transition-all duration-500 ${overlayClass}`}
        />

        {!revealed && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <span className="rounded-full bg-white/10 px-4 py-2 font-label text-xs uppercase tracking-widest text-white backdrop-blur-sm">
              Pick This
            </span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

function ResultsScreen({
  score,
  total,
  onRestart,
}: {
  score: number;
  total: number;
  onRestart: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const label =
    pct === 100
      ? "Perfect Score!"
      : pct >= 70
        ? "Great Job!"
        : pct >= 40
          ? "Not Bad"
          : "Keep Watching";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 210, damping: 26, delay: 0.1 }}
      className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center"
    >
      <div className="glass-panel cinematic-shadow max-w-md rounded-2xl border border-outline-variant/20 p-10">
        <p className="mb-2 font-label text-xs uppercase tracking-[0.2em] text-primary/80">
          Game Over
        </p>
        <h1 className="mb-6 font-headline text-4xl italic tracking-tight md:text-5xl">
          {label}
        </h1>
        <div className="mb-6 flex items-end justify-center gap-2">
          <span className="font-headline text-7xl font-bold text-primary">{score}</span>
          <span className="mb-2 font-label text-2xl text-on-surface-variant">/ {total}</span>
        </div>
        <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-surface-container-highest">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.45 }}
            className="h-full rounded-full bg-gradient-to-r from-primary-container to-inverse-primary"
          />
        </div>
        <div className="flex flex-col gap-3">
          <button
            id="play-again-btn"
            onClick={onRestart}
            className="rounded-md bg-gradient-to-r from-primary-container to-inverse-primary px-8 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-primary-container shadow-[0_0_20px_rgba(214,221,230,0.22)] transition-all hover:scale-105 active:scale-95"
          >
            Play Again
          </button>
          <Link
            to="/"
            className="rounded-md border border-outline-variant/20 px-8 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-surface-variant transition-all hover:bg-surface-container hover:text-on-surface"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

const TOTAL_ROUNDS = 10;
const REVEAL_DELAY_MS = 1800;

export default function Game() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [chosenSide, setChosenSide] = useState<"A" | "B" | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [compareDirection, setCompareDirection] = useState<"higher" | "lower">("higher");
  const [selectedMode, setSelectedMode] = useState<GameMode>("movies");
  const [gameState, setGameState] = useState<"setup" | "playing">("setup");

  const loadRound = useCallback(async (activeSessionId: string) => {
    const nextRound = await getGameRound(activeSessionId);
    setCurrentRound(nextRound);
    // Randomize per round whether question is "higher" or "lower"
    setCompareDirection(Math.random() < 0.5 ? "higher" : "lower");
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const user = await ensureDemoUser();
      const { session } = await startGameSession(user.id, selectedMode, TOTAL_ROUNDS);
      setSessionId(session.id);
      await loadRound(session.id);
      setRound(0);
      setScore(0);
      setAnswerState("idle");
      setChosenSide(null);
      setGameOver(false);
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : "Could not reach the game server. Is it running on port 8080?",
      );
    } finally {
      setLoading(false);
    }
  }, [loadRound, selectedMode]);

  useEffect(() => {
    if (gameState === "playing") {
      void fetchQuestions();
    }
  }, [fetchQuestions, gameState]);

  const current = currentRound;

  function getCorrectSide(q: GameRound): "A" | "B" {
    if (compareDirection === "higher") {
      return q.itemA.metric >= q.itemB.metric ? "A" : "B";
    }
    return q.itemA.metric <= q.itemB.metric ? "A" : "B";
  }

  const finishGame = useCallback(async (activeSessionId: string) => {
    try {
      await endGameSession(activeSessionId);
    } catch {
      // Allow the UI to finish even if the close request fails.
    }
    setGameOver(true);
  }, []);

  const handlePick = async (side: "A" | "B") => {
    if (answerState !== "idle" || !current || !sessionId) return;

    const correctSide = getCorrectSide(current);
    const correctId = correctSide === "A" ? current.itemA.id : current.itemB.id;

    setChosenSide(side);
    setAnswerState("revealing");

    try {
      const result = await submitGameAnswer(
        sessionId,
        current.itemA.id,
        current.itemB.id,
        side === "A" ? "a" : "b",
        correctId,
      );

      if (result.correct) {
        setScore((value) => value + 1);
      }

      window.setTimeout(() => {
        setAnswerState(result.correct ? "correct" : "wrong");

        window.setTimeout(() => {
          const nextRoundIndex = round + 1;
          if (nextRoundIndex >= TOTAL_ROUNDS) {
            void finishGame(sessionId);
            return;
          }

          setRound(nextRoundIndex);
          setAnswerState("idle");
          setChosenSide(null);
          void loadRound(sessionId).catch((roundError: unknown) => {
            setError(
              roundError instanceof Error
                ? roundError.message
                : "Could not load the next round.",
            );
          });
        }, 600);
      }, REVEAL_DELAY_MS);
    } catch (submitError: unknown) {
      setAnswerState("idle");
      setChosenSide(null);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not submit your answer.",
      );
    }
  };

  const handleSkip = async () => {
    if (answerState !== "idle" || !sessionId) return;

    const nextRoundIndex = round + 1;
    if (nextRoundIndex >= TOTAL_ROUNDS) {
      await finishGame(sessionId);
      return;
    }

    setRound(nextRoundIndex);
    setChosenSide(null);
    setAnswerState("idle");

    try {
      await loadRound(sessionId);
    } catch (roundError: unknown) {
      setError(
        roundError instanceof Error ? roundError.message : "Could not load the next round.",
      );
    }
  };

  const progressDots = Array.from({ length: TOTAL_ROUNDS }, (_, i) => i < round);

  return (
    <div className="relative min-h-screen overflow-hidden bg-surface-container-lowest text-on-surface">
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-[#0e0e0e]/60 px-3 py-3 backdrop-blur-xl sm:px-6 sm:py-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <span className="font-headline text-base font-bold tracking-tighter text-[#e5e2e1] sm:text-lg">
            The Digital Projectionist
          </span>
          {gameState === "playing" && !loading && !error && !gameOver && (
            <div className="hidden gap-4 md:flex">
              <span className="font-label text-[11px] font-medium uppercase tracking-widest text-zinc-200">
                Score: {score}
              </span>
              <span className="font-label text-[11px] uppercase tracking-widest text-[#e5e2e1]/70">
                Round {round + 1}/{TOTAL_ROUNDS}
              </span>
            </div>
          )}
        </div>
        <Link
          to="/"
          id="close-game-btn"
          className="material-symbols-outlined rounded-full p-2 text-[#e5e2e1]/70 transition-colors duration-200 hover:bg-[#353534]/40 active:scale-95"
        >
          close
        </Link>
      </header>

      <main className="relative flex min-h-screen w-full flex-col items-center justify-center px-3 pb-6 pt-16 sm:px-6 md:px-8">
        <div className="pointer-events-none absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 bg-primary-container/5 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 bg-primary-container/5 blur-[120px]" />

        {gameState === "setup" && (
          <div className="glass-panel cinematic-shadow max-w-xl w-full rounded-2xl border border-outline-variant/20 p-6 sm:p-8 md:p-10">
            <h1 className="mb-3 font-headline text-3xl italic tracking-tight text-on-surface sm:text-5xl">
              Play Mode
            </h1>
            <p className="mb-8 font-body text-on-surface-variant">
              Choose a collection. Each round is randomly either higher or lower.
            </p>

            <div className="mb-6">
              <p className="mb-3 font-label text-xs uppercase tracking-widest text-on-surface-variant/70">
                Collection
              </p>
              <div className="flex flex-wrap gap-3">
                {(["movies", "tv", "anime", "mixed"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`rounded-md border px-3 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors sm:px-4 sm:text-xs ${
                      selectedMode === mode
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-outline-variant bg-transparent text-on-surface-variant hover:border-primary hover:text-primary"
                    }`}
                  >
                    {mode === "mixed" ? "Mixed" : mode}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setGameState("playing")}
              className="w-full rounded-md bg-gradient-to-r from-primary-container to-inverse-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-primary-container shadow-[0_0_20px_rgba(214,221,230,0.22)] transition-all hover:scale-105 active:scale-95 sm:px-8"
            >
              Start
            </button>
          </div>
        )}

        {gameState === "playing" && loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
            <p className="font-label text-xs uppercase tracking-widest text-on-surface-variant/60">
              Loading round...
            </p>
          </motion.div>
        )}

        {gameState === "playing" && !loading && error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel max-w-md rounded-2xl border border-red-500/20 p-8 text-center"
          >
            <p className="mb-2 font-label text-xs uppercase tracking-widest text-red-400">
              Connection Error
            </p>
            <p className="mb-6 font-body text-sm text-on-surface-variant">{error}</p>
            <button
              id="retry-btn"
              onClick={() => void fetchQuestions()}
              className="rounded-md bg-gradient-to-r from-primary-container to-inverse-primary px-6 py-2 font-label text-xs font-bold uppercase tracking-widest text-on-primary-container transition-all hover:scale-105 active:scale-95"
            >
              Retry
            </button>
          </motion.div>
        )}

        {gameState === "playing" && !loading && !error && gameOver && (
          <ResultsScreen score={score} total={TOTAL_ROUNDS} onRestart={() => void fetchQuestions()} />
        )}

        {gameState === "playing" && !loading && !error && !gameOver && current && (
          <AnimatePresence mode="wait">
            <motion.div
              key={round}
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 210, damping: 28 }}
              className="flex w-full max-w-3xl flex-col items-center lg:max-w-4xl"
            >
              <div className="mb-4 max-w-xl text-center md:mb-6">
                <h1 className="mb-2 font-headline text-2xl italic tracking-tight md:text-4xl lg:text-5xl">
                  Which title has the{" "}
                  <span
                    className={`font-bold drop-shadow-[0_0_12px_rgba(52,211,153,0.2)] ${
                      compareDirection === "higher"
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {compareDirection} {current.itemA.metricLabel.toLowerCase()}
                  </span>
                  ?
                </h1>
                <p className="font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant/60">
                  Live data from the Go backend
                </p>
              </div>

              <div className="relative flex w-full flex-col items-center justify-center gap-5 md:flex-row md:gap-6 lg:gap-8">
                <DuelCard
                  item={current.itemA}
                  answerState={answerState}
                  isChosen={chosenSide === "A"}
                  isCorrectCard={getCorrectSide(current) === "A"}
                  compareDirection={compareDirection}
                  onClick={() => void handlePick("A")}
                  disabled={answerState !== "idle"}
                />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="glass-panel cinematic-shadow flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/15 md:h-16 md:w-16">
                    <span className="font-headline text-lg font-bold italic tracking-widest text-primary md:text-2xl">
                      VS
                    </span>
                  </div>
                  <div className="mt-4 hidden h-16 w-px bg-gradient-to-b from-transparent via-outline-variant/30 to-transparent md:block" />
                </div>

                <DuelCard
                  item={current.itemB}
                  answerState={answerState}
                  isChosen={chosenSide === "B"}
                  isCorrectCard={getCorrectSide(current) === "B"}
                  compareDirection={compareDirection}
                  onClick={() => void handlePick("B")}
                  disabled={answerState !== "idle"}
                />
              </div>

              <div className="mt-6 flex flex-col items-center gap-4 md:mt-8">
                <AnimatePresence>
                  {answerState === "revealing" && (
                    <motion.p
                      key="feedback"
                      initial={{ opacity: 0, y: -12, scale: 0.88 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.88 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className={`font-label text-sm font-bold uppercase tracking-widest ${
                        chosenSide === getCorrectSide(current) ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {chosenSide === getCorrectSide(current) ? "+1 Correct!" : "Wrong pick"}
                    </motion.p>
                  )}
                </AnimatePresence>

                <button
                  id="skip-round-btn"
                  onClick={() => void handleSkip()}
                  disabled={answerState !== "idle"}
                  className="rounded-md bg-gradient-to-r from-primary-container to-inverse-primary px-8 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-primary-container shadow-[0_0_20px_rgba(214,221,230,0.22)] transition-all hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Skip Round
                </button>

                <div className="flex gap-2">
                  {progressDots.map((done, index) => (
                    <span
                      key={index}
                      className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                        index === round
                          ? "bg-primary"
                          : done
                            ? "bg-primary/40"
                            : "bg-surface-container-highest"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <div className="pointer-events-none fixed inset-0 opacity-[0.03] [background-image:url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
    </div>
  );
}
