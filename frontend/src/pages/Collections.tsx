import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { isAuthenticated, getToken } from "../api/client";
import { getUserRankings, deleteRanking, type UserRanking } from "../api/vault";
import { getActiveUserId } from "../api/users";
import PageLayout from "../components/PageLayout";
import CollectionsManager from "../components/CollectionsManager";

export default function Collections() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/");
      return;
    }

    let active = true;

    async function load() {
      try {
        const userId = getActiveUserId();
        if (!userId) throw new Error("No user ID found");

        const response = await getUserRankings(userId);
        if (!active) return;

        setRankings(response.rankings);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Could not load collections");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [navigate]);

  const handleDelete = async (rankingId: string) => {
    if (!window.confirm("Delete this collection?")) return;

    setDeleting(rankingId);
    try {
      await deleteRanking(rankingId);
      setRankings((prev) => prev.filter((r) => r.id !== rankingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete collection");
    } finally {
      setDeleting(null);
    }
  };

  const handleRankingCreated = (newRanking: UserRanking) => {
    setRankings((prev) => [...prev, newRanking]);
    setShowCreateModal(false);
  };

  return (
    <PageLayout>

      <main className="mx-auto min-h-screen max-w-5xl px-4 pb-16 pt-6 sm:px-5 lg:px-6">
        <header className="mb-12 lg:mb-16">
          <h1 className="mb-6 font-headline text-4xl font-bold tracking-tighter text-on-surface sm:text-5xl md:text-6xl lg:text-7xl">
            My Collections
          </h1>
          <p className="mb-8 max-w-2xl font-body text-lg text-on-surface-variant">
            Create and manage your personal rankings. Build top-5, top-10, top-15, or top-20
            lists for movies, TV shows, anime, or a mix of all three.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary px-6 py-3 font-label text-sm font-bold uppercase tracking-widest text-on-primary transition-all hover:opacity-90"
          >
            + Create Collection
          </button>
        </header>

        {showCreateModal && (
          <CollectionsManager
            onClose={() => setShowCreateModal(false)}
            onRankingCreated={handleRankingCreated}
          />
        )}

        {loading ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="aspect-square animate-pulse bg-surface-container-low"
              />
            ))}
          </section>
        ) : error ? (
          <section className="bg-surface-container-low p-8 text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
              Error
            </p>
            <p className="mt-4 font-body text-on-surface-variant">{error}</p>
          </section>
        ) : rankings.length === 0 ? (
          <section className="bg-surface-container-low p-12 text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
              No Collections Yet
            </p>
            <p className="mt-4 font-body text-on-surface-variant">
              Create your first ranking collection to get started!
            </p>
          </section>
        ) : (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rankings.map((ranking) => (
              <motion.div
                key={ranking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative overflow-hidden bg-surface-container-low p-6 transition-all hover:bg-surface-container"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-headline text-xl font-bold text-on-surface">
                      {ranking.name}
                    </h3>
                    <p className="font-label text-xs uppercase tracking-widest text-primary">
                      {ranking.category}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/20 px-2 py-1 font-label text-xs font-bold text-primary">
                    TOP {ranking.max_size}
                  </span>
                </div>

                <p className="mb-6 font-body text-sm text-on-surface-variant">
                  Created{" "}
                  {new Date(ranking.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>

                <div className="flex gap-3">
                  <Link
                    to={`/ranking-mixer?rankingId=${ranking.id}`}
                    className="flex-1 bg-tertiary px-4 py-2 text-center font-label text-xs font-bold uppercase tracking-widest text-on-tertiary transition-all hover:opacity-90"
                  >
                    Play
                  </Link>
                  <button
                    onClick={() => handleDelete(ranking.id)}
                    disabled={deleting === ranking.id}
                    className="bg-error/20 px-4 py-2 font-label text-xs font-bold uppercase tracking-widest text-error transition-all hover:bg-error/30 disabled:opacity-50"
                  >
                    {deleting === ranking.id ? "..." : "Delete"}
                  </button>
                </div>
              </motion.div>
            ))}
          </section>
        )}
      </main>

      <div className="pointer-events-none fixed right-0 top-0 -z-10 h-[512px] w-[50vw] bg-primary-container opacity-[0.03] blur-[120px]" />
      <div className="pointer-events-none fixed bottom-0 left-0 -z-10 h-[409px] w-[40vw] bg-on-secondary-fixed-variant opacity-[0.05] blur-[150px]" />
    </PageLayout>
  );
}
