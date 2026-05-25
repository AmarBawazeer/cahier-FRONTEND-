import { type ReactNode, useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { isAuthenticated } from "../api/client";
import { getActiveUserId, logoutUser } from "../api/users";
import AuthModal from "./AuthModal";

type SiteNavProps = {
  brand?: string;
  action?: ReactNode;
};

const desktopLinks = [
  { label: "Home", to: "/" },
  { label: "Play", to: "/game" },
  { label: "Battles", to: "/battles" },
  { label: "Vault", to: "/vault" },
  { label: "Leaderboard", to: "/leaderboard" },
  { label: "Airin", to: "/airin" },
  { label: "Profile", to: "/profile" },
];

const mobileLinks = [
  { label: "Home", to: "/", icon: "home" },
  { label: "Vault", to: "/vault", icon: "inventory_2" },
  { label: "Play", to: "/game", icon: "play_circle" },
  { label: "Battles", to: "/battles", icon: "stadia_controller" },
  { label: "Airin", to: "/airin", icon: "auto_awesome" },
  { label: "Profile", to: "/profile", icon: "person" },
];

export default function SiteNav({ brand = "Cahier", action }: SiteNavProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());

    const handleLogout = () => setAuthenticated(false);
    const handleLogin = () => setAuthenticated(isAuthenticated());

    window.addEventListener("logout", handleLogout);
    window.addEventListener("login", handleLogin);
    return () => {
      window.removeEventListener("logout", handleLogout);
      window.removeEventListener("login", handleLogin);
    };
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    setAuthenticated(false);
  };

  const handleAuthSuccess = () => {
    setAuthenticated(true);
  };

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-zinc-950/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl">
          <div className="m-nav-inner">
          <Link to="/" className="font-headline text-2xl italic tracking-tighter text-zinc-100">
            {brand}
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {desktopLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive
                    ? "border-b border-zinc-300 pb-1 font-label text-[12px] uppercase tracking-[0.1em] text-zinc-100"
                    : "font-label text-[12px] uppercase tracking-[0.1em] text-zinc-400 transition-colors hover:text-zinc-100"
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {action}
            {authenticated ? (
              <button
                onClick={handleLogout}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 font-label text-[11px] uppercase tracking-[0.14em] text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="rounded-lg bg-zinc-100 px-4 py-2 font-label text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-900 transition-colors hover:bg-white"
              >
                Login
              </button>
            )}
          </div>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-900 bg-zinc-950/80 px-3 py-3 backdrop-blur-xl md:hidden">
        <div className="grid grid-cols-6 gap-1">
          {mobileLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `m-mobile-tab ${
                  /* Keep active/inactive colors as before */
                  isActive ? "bg-zinc-200/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-200"
                }`
              }
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em]">
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
