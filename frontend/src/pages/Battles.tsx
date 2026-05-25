import PageLayout from "../components/PageLayout";
import { Link } from "react-router-dom";

export default function Battles() {
  return (
    <PageLayout>
      <div className="mx-auto min-h-screen max-w-4xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">
            Multiplayer
          </p>
          <h1 className="mt-2 font-headline text-4xl font-bold tracking-tighter text-on-surface sm:text-5xl">
            Battles
          </h1>
          <p className="mt-4 max-w-2xl font-body text-on-surface-variant">
            Face off against other players. Create a lobby or join an existing one.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/game/comp/public"
            className="group rounded-lg border border-outline-variant/30 bg-surface-container-low p-6 transition-colors hover:bg-surface-container"
          >
            <h2 className="font-headline text-2xl text-on-surface">Quick Match</h2>
            <p className="mt-2 font-body text-on-surface-variant">
              Jump into a public lobby and start ranking.
            </p>
          </Link>
          <Link
            to="/game/comp/create"
            className="group rounded-lg border border-outline-variant/30 bg-surface-container-low p-6 transition-colors hover:bg-surface-container"
          >
            <h2 className="font-headline text-2xl text-on-surface">Create Lobby</h2>
            <p className="mt-2 font-body text-on-surface-variant">
              Generate a code and invite friends to battle.
            </p>
          </Link>
        </section>
      </div>
    </PageLayout>
  );
}
