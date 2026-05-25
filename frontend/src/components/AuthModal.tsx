import { useState } from "react";
import { loginUser, registerUser } from "../api/users";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess?: () => void;
  title?: string;
};

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  title = "Join the Game",
}: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  if (!isOpen) return null;

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!loginForm.email || !loginForm.password) {
        setError("Email and password are required");
        return;
      }

      await loginUser(loginForm.email, loginForm.password);
      setLoginForm({ email: "", password: "" });
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (
        !registerForm.username ||
        !registerForm.email ||
        !registerForm.password
      ) {
        setError("All fields are required");
        return;
      }

      if (registerForm.password !== registerForm.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      if (registerForm.password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      await registerUser(
        registerForm.username,
        registerForm.email,
        registerForm.password,
      );
      setRegisterForm({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      onAuthSuccess?.();
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-gradient-to-b from-zinc-900 to-zinc-950 p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-200"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
          <p className="mt-1 text-sm text-slate-400">
            {tab === "login"
              ? "Sign in to your account"
              : "Create a new account"}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-slate-700">
          <button
            onClick={() => {
              setTab("login");
              setError("");
            }}
            className={`flex-1 pb-3 text-center font-medium transition-colors ${
              tab === "login"
                ? "border-b-2 border-zinc-300 text-zinc-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => {
              setTab("register");
              setError("");
            }}
            className={`flex-1 pb-3 text-center font-medium transition-colors ${
              tab === "register"
                ? "border-b-2 border-zinc-300 text-zinc-100"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-500 bg-opacity-20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={loginForm.email}
                onChange={handleLoginChange}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={handleLoginChange}
                placeholder="••••••"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-100 text-zinc-900 px-4 py-2 font-semibold text-white transition-colors hover:bg-white disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={registerForm.username}
                onChange={handleRegisterChange}
                placeholder="your_username"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={registerForm.email}
                onChange={handleRegisterChange}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={registerForm.password}
                onChange={handleRegisterChange}
                placeholder="••••••"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={registerForm.confirmPassword}
                onChange={handleRegisterChange}
                placeholder="••••••"
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-slate-100 placeholder-slate-500 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-opacity-20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-zinc-100 text-zinc-900 px-4 py-2 font-semibold text-white transition-colors hover:bg-white disabled:bg-slate-600 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        {/* Footer info */}
        <p className="mt-6 text-center text-xs text-slate-400">
          {tab === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            onClick={() => setTab(tab === "login" ? "register" : "login")}
            className="text-zinc-300 hover:text-white"
          >
            {tab === "login" ? "Register" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
