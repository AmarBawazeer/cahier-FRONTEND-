import { Navigate, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import CompLobby from "./pages/CompLobby";
import Game from "./pages/Game";
import Vault from "./pages/Vault";
import VaultItem from "./pages/VaultItem";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import Airin from "./pages/Airin";
import Battles from "./pages/Battles";
import Collections from "./pages/Collections";
import RankingMixer from "./pages/RankingMixer";

const PlaceholderPage = ({ title }: { title: string }) => (
  <main className="flex min-h-screen items-center justify-center bg-surface-container-lowest px-6 py-24 text-center text-on-surface">
    <div>
      <p className="font-label text-xs uppercase tracking-[0.3em] text-primary">
        Cahier
      </p>
      <h1 className="mt-4 font-headline text-4xl italic">{title}</h1>
      <p className="mt-4 font-body text-on-surface-variant">
        This page is scaffolded and ready for the next Stitch screen.
      </p>
    </div>
  </main>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/game" element={<Game />} />
      <Route path="/game/comp/:lobby" element={<CompLobby />} />
      <Route path="/vault" element={<Vault />} />
      <Route path="/vault/:id" element={<VaultItem />} />
      <Route path="/airin" element={<Airin />} />
      <Route path="/battles" element={<Battles />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/collections" element={<Collections />} />
      <Route path="/ranking-mixer" element={<RankingMixer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
