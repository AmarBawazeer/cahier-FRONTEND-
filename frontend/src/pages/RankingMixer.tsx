import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { isAuthenticated } from "../api/client";
import {
  getUserRankings,
  getRankingItems,
  reorderRankingItem,
  removeRankingItem,
  type UserRanking,
  type RankingItem,
} from "../api/vault";
import { getActiveUserId } from "../api/users";
import PageLayout from "../components/PageLayout";

type GameMode = "solo" | "multiplayer";
type GameState = "mode-select" | "setup" | "edit" | "playing" | "results";

type RoundResult = {
  itemA: RankingItem;
  itemB: RankingItem;
  playerAnswer: "a" | "b";
  isCorrect: boolean;
  correctAnswer: "a" | "b";
};

export default function RankingMixer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rankingIdParam = searchParams.get("rankingId");
  const [mode, setMode] = useState<GameMode | null>(null);
  const [gameState, setGameState] = useState<GameState>("mode-select");
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [selectedRanking, setSelectedRanking] = useState<UserRanking | null>(null);
  const [rankingItems, setRankingItems] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Game state
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  const [score, setScore] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);

  // Load user rankings on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    let active = true;

    async function load() {
      try {
        const userId = getActiveUserId();
        if (!userId) throw new Error("Not authenticated");

        const response = await getUserRankings(userId);
        if (!active) return;

        setRankings(response.rankings);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load rankings");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [navigate]);

  // If opened with ?rankingId=..., auto-select that collection (so Top 5/10/15/20 is chosen in profile).
  useEffect(() => {
    if (!rankingIdParam) return;
    if (rankings.length === 0) return;
    if (gameState !== "mode-select" && gameState !== "setup") return;

    const target = rankings.find((r) => r.id === rankingIdParam);
    if (!target) return;

    setMode("solo");
    void handleSelectRanking(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankingIdParam, rankings]);

  const handleSelectRanking = async (ranking: UserRanking) => {
    setSelectedRanking(ranking);
    setLoading(true);
    setError(null);

    try {
      const items = await getRankingItems(ranking.id);
      if (items.items.length < 2) {
        throw new Error("Ranking must have at least 2 items to play");
      }
      setRankingItems(items.items);
      // Reset round/game state before entering edit step
      setRoundResults([]);
      setRoundsPlayed(0);
      setCurrentRoundIndex(0);
      setScore(0);
      setGameState("edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load ranking");
      setSelectedRanking(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshRankingItems = async () => {
    if (!selectedRanking) return;
    const items = await getRankingItems(selectedRanking.id);
    setRankingItems(items.items);
  };

  const generateRound = () => {
    if (rankingItems.length < 2) return null;

    const idx1 = Math.floor(Math.random() * rankingItems.length);
    let idx2 = Math.floor(Math.random() * rankingItems.length);
    while (idx2 === idx1 && rankingItems.length > 1) {
      idx2 = Math.floor(Math.random() * rankingItems.length);
    }

    return {
      itemA: rankingItems[idx1],
      itemB: rankingItems[idx2],
    };
  };

  const getCurrentRound = () => {
    if (roundResults.length > 0) return roundResults[currentRoundIndex];
    return generateRound();
  };

  const handleAnswer = (answer: "a" | "b") => {
    const round = getCurrentRound();
    if (!round) return;

    const itemAPos = round.itemA.rank_position;
    const itemBPos = round.itemB.rank_position;

    // Lower position number = higher ranking
    const correctAnswer = itemAPos < itemBPos ? "a" : "b";
    const isCorrect = answer === correctAnswer;

    const result: RoundResult = {
      itemA: round.itemA,
      itemB: round.itemB,
      playerAnswer: answer,
      isCorrect,
      correctAnswer,
    };

    const newResults = [...roundResults, result];
    setRoundResults(newResults);
    setRoundsPlayed(roundsPlayed + 1);

    if (isCorrect) {
      setScore(score + 1);
    }

    // Check if game should continue or end
    if (newResults.length >= 10) {
      // Game ends after 10 rounds
      setGameState("results");
    } else {
      setCurrentRoundIndex(newResults.length);
    }
  };

  const handlePlayAgain = () => {
    setRoundResults([]);
    setScore(0);
    setRoundsPlayed(0);
    setCurrentRoundIndex(0);
    setGameState("setup");
    setSelectedRanking(null);
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  // SOLO MODE - MAIN GAME
  if (mode === "solo" && gameState === "edit" && selectedRanking) {
    const sorted = [...rankingItems].sort((a, b) => a.rank_position - b.rank_position);
    return (
      <PageLayout>
        <main className="mx-auto max-w-3xl px-4 py-16">
          <div className="mb-10 text-center">
            <h1 className="font-headline text-4xl font-bold mb-2">
              Edit Your Collection
            </h1>
            <p className="font-body text-on-surface-variant">
              {selectedRanking.category} • Top {selectedRanking.max_size}
            </p>
          </div>

          {sorted.length < 2 ? (
            <div className="bg-error/10 p-6 text-center rounded-lg">
              <p className="font-body text-error">You need at least 2 items to play.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 mb-8">
                {sorted.map((ri) => (
                  <div
                    key={`${ri.item_type}:${ri.item_id}:${ri.rank_position}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant/30 bg-surface-container-low p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-label text-[10px] uppercase tracking-widest text-primary">
                        #{ri.rank_position} • {ri.item_type}
                      </p>
                      <p className="font-body text-on-surface-variant truncate">
                        {ri.item_id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        disabled={editing || ri.rank_position <= 1}
                        onClick={async () => {
                          if (!selectedRanking) return;
                          setEditing(true);
                          setError(null);
                          try {
                            await reorderRankingItem(
                              selectedRanking.id,
                              ri.item_id,
                              ri.rank_position - 1,
                            );
                            await refreshRankingItems();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Could not reorder item");
                          } finally {
                            setEditing(false);
                          }
                        }}
                        className="rounded-lg border border-outline-variant/30 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:border-primary disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        disabled={editing || ri.rank_position >= sorted.length}
                        onClick={async () => {
                          if (!selectedRanking) return;
                          setEditing(true);
                          setError(null);
                          try {
                            await reorderRankingItem(
                              selectedRanking.id,
                              ri.item_id,
                              ri.rank_position + 1,
                            );
                            await refreshRankingItems();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Could not reorder item");
                          } finally {
                            setEditing(false);
                          }
                        }}
                        className="rounded-lg border border-outline-variant/30 px-3 py-2 text-xs font-bold uppercase tracking-widest hover:border-primary disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        disabled={editing}
                        onClick={async () => {
                          if (!selectedRanking) return;
                          if (!window.confirm("Remove this item from your ranking?")) return;
                          setEditing(true);
                          setError(null);
                          try {
                            await removeRankingItem(selectedRanking.id, ri.item_id);
                            await refreshRankingItems();
                          } catch (e) {
                            setError(e instanceof Error ? e.message : "Could not remove item");
                          } finally {
                            setEditing(false);
                          }
                        }}
                        className="rounded-lg bg-error/20 px-3 py-2 text-xs font-bold uppercase tracking-widest text-error hover:bg-error/30 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-error/10 p-5 text-center rounded-lg mb-6">
                  <p className="font-body text-error">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setSelectedRanking(null);
                    setGameState("setup");
                  }}
                  className="flex-1 border border-outline-variant bg-transparent px-6 py-3 font-label text-xs font-bold uppercase tracking-widest hover:border-primary"
                  disabled={editing}
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    setRoundResults([]);
                    setRoundsPlayed(0);
                    setCurrentRoundIndex(0);
                    setScore(0);
                    setGameState("playing");
                  }}
                  className="flex-1 bg-primary px-6 py-3 font-label text-xs font-bold uppercase tracking-widest text-on-primary transition-all hover:opacity-90 disabled:opacity-40"
                  disabled={editing || sorted.length < 2}
                >
                  Start Battle
                </button>
              </div>
            </>
          )}
        </main>
      </PageLayout>
    );
  }

  if (mode === "solo" && gameState === "playing" && rankingItems.length > 0) {
    const round = getCurrentRound();
    if (!round) {
      return (
        <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center">
          <p>Loading game...</p>
        </div>
      );
    }

    return (
      <PageLayout>

        <main className="mx-auto max-w-4xl px-4 py-16">
          {/* Progress */}
          <div className="mb-12 text-center">
            <p className="font-label text-xs uppercase tracking-widest text-primary mb-2">
              Round {roundsPlayed + 1} / 10
            </p>
            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((roundsPlayed + 1) / 10) * 100}%` }}
              />
            </div>
            <div className="mt-4 flex justify-between">
              <p className="font-body text-on-surface-variant">
                Score: <strong>{score}</strong>
              </p>
              <p className="font-body text-on-surface-variant">
                Accuracy: <strong>{roundsPlayed > 0 ? ((score / roundsPlayed) * 100).toFixed(0) : 0}%</strong>
              </p>
            </div>
          </div>

          {/* Question */}
          <div className="mb-12 text-center">
            <h2 className="font-headline text-2xl md:text-4xl font-bold mb-4">
              Which did you rank HIGHER?
            </h2>
            <p className="font-body text-on-surface-variant">
              Remember: {round.itemA.rank_position} vs {round.itemB.rank_position}
            </p>
          </div>

          {/* Item Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Item A */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group cursor-pointer"
              onClick={() => handleAnswer("a")}
            >
              <div className="relative bg-surface-container-low hover:bg-surface-container transition-all h-96 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-primary/10 to-transparent group-hover:from-primary/20">
                  <div className="text-center">
                    <p className="font-headline text-5xl font-bold text-primary mb-2">
                      #{round.itemA.rank_position}
                    </p>
                    <p className="font-body text-lg text-on-surface">
                      {round.itemA.item_id.substring(0, 30)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAnswer("a")}
                className="w-full mt-4 bg-primary text-on-primary py-3 font-label font-bold uppercase tracking-widest hover:opacity-90"
              >
                This One
              </button>
            </motion.div>

            {/* Item B */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="group cursor-pointer"
              onClick={() => handleAnswer("b")}
            >
              <div className="relative bg-surface-container-low hover:bg-surface-container transition-all h-96 rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-secondary/10 to-transparent group-hover:from-secondary/20">
                  <div className="text-center">
                    <p className="font-headline text-5xl font-bold text-secondary mb-2">
                      #{round.itemB.rank_position}
                    </p>
                    <p className="font-body text-lg text-on-surface">
                      {round.itemB.item_id.substring(0, 30)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleAnswer("b")}
                className="w-full mt-4 bg-secondary text-on-secondary py-3 font-label font-bold uppercase tracking-widest hover:opacity-90"
              >
                This One
              </button>
            </motion.div>
          </div>
        </main>

        <footer className="bg-neutral-950 px-4 py-8 text-center">
          <p className="font-label text-xs uppercase tracking-widest text-neutral-500">
            Rank Mixer • Solo Mode
          </p>
        </footer>
      </PageLayout>
    );
  }

  // RESULTS SCREEN
  if (gameState === "results") {
    const accuracy = roundsPlayed > 0 ? ((score / roundsPlayed) * 100).toFixed(1) : 0;

    return (
      <PageLayout>

        <main className="mx-auto max-w-2xl px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="font-headline text-5xl font-bold mb-4">Round Complete!</h2>
            <p className="font-body text-lg text-on-surface-variant">
              You completed {selectedRanking?.name}
            </p>
          </div>

          {/* Stats Card */}
          <div className="bg-surface-container-low p-8 mb-12 rounded-lg">
            <div className="grid grid-cols-3 gap-6 text-center mb-8">
              <div>
                <p className="font-label text-xs uppercase tracking-widest text-primary mb-2">
                  Score
                </p>
                <p className="font-headline text-4xl font-bold">{score}</p>
              </div>
              <div>
                <p className="font-label text-xs uppercase tracking-widest text-primary mb-2">
                  Rounds
                </p>
                <p className="font-headline text-4xl font-bold">{roundsPlayed}</p>
              </div>
              <div>
                <p className="font-label text-xs uppercase tracking-widest text-primary mb-2">
                  Accuracy
                </p>
                <p className="font-headline text-4xl font-bold">{accuracy}%</p>
              </div>
            </div>
          </div>

          {/* Round Breakdown */}
          <div className="mb-12">
            <h3 className="font-headline text-xl font-bold mb-4">Round Breakdown</h3>
            <div className="space-y-3">
              {roundResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-4 flex items-center justify-between ${
                    result.isCorrect ? "bg-success/10" : "bg-error/10"
                  }`}
                >
                  <div>
                    <p className="font-body text-sm">
                      Round {idx + 1}: {result.itemA.item_id.substring(0, 20)} vs{" "}
                      {result.itemB.item_id.substring(0, 20)}
                    </p>
                    <p className="font-label text-xs text-on-surface-variant">
                      Your answer: <strong>#{result.itemA.rank_position}</strong> vs{" "}
                      <strong>#{result.itemB.rank_position}</strong>
                    </p>
                  </div>
                  <p className={result.isCorrect ? "text-success font-bold" : "text-error font-bold"}>
                    {result.isCorrect ? "✓" : "✗"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handlePlayAgain}
              className="flex-1 bg-primary text-on-primary py-4 font-label font-bold uppercase tracking-widest hover:opacity-90"
            >
              Play Again
            </button>
            <button
              onClick={handleBackToHome}
              className="flex-1 border border-outline-variant bg-transparent py-4 font-label font-bold uppercase tracking-widest hover:border-primary"
            >
              Home
            </button>
          </div>
        </main>

        <footer className="bg-neutral-950 px-4 py-8 text-center mt-12">
          <p className="font-label text-xs uppercase tracking-widest text-neutral-500">
            Rank Mixer • Solo Mode
          </p>
        </footer>
      </PageLayout>
    );
  }

  // SETUP / RANKING SELECTION
  if ((mode === "solo" && gameState === "setup") || (mode === "solo" && gameState === "mode-select")) {
    return (
      <PageLayout>

        <main className="mx-auto max-w-3xl px-4 py-16">
          <div className="mb-12 text-center">
            <h1 className="font-headline text-5xl font-bold mb-4">
              {gameState === "mode-select" ? "Ranking Mixer" : "Select Your Collection"}
            </h1>
            <p className="font-body text-lg text-on-surface-variant mb-4">
              {gameState === "mode-select"
                ? "Test your memory against your personal rankings"
                : "Choose a collection to play with"}
            </p>
          </div>

          {gameState === "mode-select" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  setMode("solo");
                  setGameState("setup");
                }}
                className="bg-surface-container-low hover:bg-surface-container p-8 rounded-lg text-center transition-all"
              >
                <p className="font-headline text-3xl font-bold mb-2">Solo</p>
                <p className="font-body text-on-surface-variant">
                  Challenge yourself against your own rankings
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                onClick={() => setMode("multiplayer")}
                className="bg-surface-container-low hover:bg-surface-container p-8 rounded-lg text-center transition-all opacity-50 cursor-not-allowed"
              >
                <p className="font-headline text-3xl font-bold mb-2">Multiplayer</p>
                <p className="font-body text-on-surface-variant">
                  Battle 8-10 players (Coming Soon)
                </p>
              </motion.button>
            </div>
          )}

          {mode === "solo" && gameState === "setup" && (
            <>
              {loading ? (
                <div className="text-center py-12">
                  <p className="font-body">Loading rankings...</p>
                </div>
              ) : error ? (
                <div className="bg-error/10 p-6 text-center mb-8 rounded-lg">
                  <p className="font-body text-error">{error}</p>
                </div>
              ) : rankings.length === 0 ? (
                <div className="bg-surface-container-low p-12 text-center rounded-lg">
                  <p className="font-label text-sm uppercase tracking-widest text-primary mb-4">
                    No Collections Yet
                  </p>
                  <p className="font-body text-on-surface-variant mb-6">
                    Create a collection first to play!
                  </p>
                  <button
                    onClick={() => navigate("/collections")}
                    className="bg-primary text-on-primary px-6 py-3 font-label font-bold uppercase tracking-widest hover:opacity-90"
                  >
                    Create Collection
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rankings.map((ranking) => (
                    <motion.button
                      key={ranking.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleSelectRanking(ranking)}
                      disabled={loading}
                      className="bg-surface-container-low hover:bg-surface-container p-6 rounded-lg text-left transition-all disabled:opacity-50"
                    >
                      <p className="font-headline text-lg font-bold mb-1">{ranking.name}</p>
                      <p className="font-label text-xs uppercase tracking-widest text-primary mb-2">
                        {ranking.category}
                      </p>
                      <p className="font-label text-xs text-on-surface-variant">
                        Top {ranking.max_size}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}

              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setMode(null);
                    setGameState("mode-select");
                  }}
                  className="border border-outline-variant bg-transparent px-6 py-2 font-label text-xs uppercase tracking-widest hover:border-primary"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </main>

        <footer className="bg-neutral-950 px-4 py-8 text-center mt-12">
          <p className="font-label text-xs uppercase tracking-widest text-neutral-500">
            Rank Mixer • Test Your Rankings
          </p>
        </footer>
      </PageLayout>
    );
  }

  // DEFAULT / HOME
  return (
    <PageLayout>

      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-headline text-5xl font-bold mb-4">Ranking Mixer</h1>
          <p className="font-body text-lg text-on-surface-variant">
            Test your memory against your personal rankings
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => {
              setMode("solo");
              setGameState("setup");
            }}
            className="bg-surface-container-low hover:bg-surface-container p-8 rounded-lg text-center transition-all"
          >
            <p className="font-headline text-3xl font-bold mb-2">Solo</p>
            <p className="font-body text-on-surface-variant mb-4">
              Challenge yourself against your own rankings
            </p>
            <p className="font-label text-xs uppercase tracking-widest text-primary">
              Play Now →
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="bg-surface-container-low p-8 rounded-lg text-center opacity-50 cursor-not-allowed"
          >
            <p className="font-headline text-3xl font-bold mb-2">Multiplayer</p>
            <p className="font-body text-on-surface-variant mb-4">
              Battle 8-10 players
            </p>
            <p className="font-label text-xs uppercase tracking-widest text-primary">
              Coming Soon
            </p>
          </motion.button>
        </div>
      </main>

      <footer className="bg-neutral-950 px-4 py-8 text-center mt-12">
        <p className="font-label text-xs uppercase tracking-widest text-neutral-500">
          Rank Mixer • Test Your Rankings
        </p>
      </footer>
    </PageLayout>
  );
}
