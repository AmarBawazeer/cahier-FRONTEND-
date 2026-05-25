import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentToken, logoutUser } from "../api/users";
import { isAuthenticated } from "../api/client";
import { getActiveUserId } from "../api/users";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  useEffect(() => {
    // Check initial auth state
    setAuthenticated(isAuthenticated());
    setUserId(getActiveUserId());

    // Listen for logout events
    const handleLogout = () => {
      setAuthenticated(false);
      setUserId(null);
      setMenuOpen(false);
    };

    window.addEventListener("logout", handleLogout);
    return () => window.removeEventListener("logout", handleLogout);
  }, []);

  const handleLogin = () => {
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    setAuthenticated(false);
    setUserId(null);
    setMenuOpen(false);
  };

  const handleAuthSuccess = () => {
    setAuthenticated(true);
    setUserId(getActiveUserId());
  };

  return (
    <>
      <nav className="border-b border-slate-700 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-4 py-4 shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-2xl text-slate-100 hover:text-slate-200 transition-colors"
          >
            <span className="text-violet-400">⚔️</span> Cahier
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              to="/"
              className={`transition-colors ${
                isActive("/")
                  ? "text-violet-400 font-semibold border-b-2 border-violet-400"
                  : "text-slate-300 hover:text-slate-100"
              }`}
            >
              Home
            </Link>
            <Link
              to="/game"
              className={`transition-colors ${
                isActive("/game")
                  ? "text-violet-400 font-semibold border-b-2 border-violet-400"
                  : "text-slate-300 hover:text-slate-100"
              }`}
            >
              Play
            </Link>
            <Link
              to="/vault"
              className={`transition-colors ${
                isActive("/vault")
                  ? "text-violet-400 font-semibold border-b-2 border-violet-400"
                  : "text-slate-300 hover:text-slate-100"
              }`}
            >
              Vault
            </Link>
            <Link
              to="/leaderboard"
              className={`transition-colors ${
                isActive("/leaderboard")
                  ? "text-violet-400 font-semibold border-b-2 border-violet-400"
                  : "text-slate-300 hover:text-slate-100"
              }`}
            >
              Leaderboard
            </Link>
            {authenticated && (
              <Link
                to="/collections"
                className={`transition-colors ${
                  isActive("/collections")
                    ? "text-violet-400 font-semibold border-b-2 border-violet-400"
                    : "text-slate-300 hover:text-slate-100"
                }`}
              >
                Collections
              </Link>
            )}
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            {authenticated ? (
              <div className="relative group">
                <button className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-slate-100 hover:bg-violet-700 transition-colors">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>{userId ? userId.slice(0, 8) : "User"}</span>
                </button>
                <div className="absolute right-0 mt-0 hidden w-48 rounded-lg bg-slate-800 shadow-lg group-hover:block">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-slate-100 first:rounded-t-lg"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/collections"
                    className="block px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                  >
                    Collections
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-slate-100 last:rounded-b-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLogin}
                className="rounded-lg bg-violet-600 px-6 py-2 font-semibold text-white hover:bg-violet-700 transition-colors"
              >
                Login
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="sm:hidden rounded-lg p-2 hover:bg-slate-700 transition-colors"
            >
              <svg
                className="h-6 w-6 text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <div className="mt-4 sm:hidden space-y-2 border-t border-slate-700 pt-4">
            <Link
              to="/"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive("/")
                  ? "bg-violet-600/20 text-violet-400 font-semibold"
                  : "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
              }`}
            >
              Home
            </Link>
            <Link
              to="/game"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive("/game")
                  ? "bg-violet-600/20 text-violet-400 font-semibold"
                  : "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
              }`}
            >
              Play
            </Link>
            <Link
              to="/vault"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive("/vault")
                  ? "bg-violet-600/20 text-violet-400 font-semibold"
                  : "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
              }`}
            >
              Vault
            </Link>
            <Link
              to="/leaderboard"
              className={`block px-4 py-2 rounded-lg transition-colors ${
                isActive("/leaderboard")
                  ? "bg-violet-600/20 text-violet-400 font-semibold"
                  : "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
              }`}
            >
              Leaderboard
            </Link>
            {authenticated && (
              <Link
                to="/collections"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  isActive("/collections")
                    ? "bg-violet-600/20 text-violet-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                }`}
              >
                Collections
              </Link>
            )}
            {authenticated && (
              <Link
                to="/profile"
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  isActive("/profile")
                    ? "bg-violet-600/20 text-violet-400 font-semibold"
                    : "text-slate-300 hover:bg-slate-700 hover:text-slate-100"
                }`}
              >
                Profile
              </Link>
            )}
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </>
  );
}
