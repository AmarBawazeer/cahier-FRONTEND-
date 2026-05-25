import { apiRequest, setToken, clearToken, getToken } from "./client";

const DEMO_USER_STORAGE_KEY = "cahier.demoUserId";
const ACTIVE_USER_STORAGE_KEY = "cahier.activeUserId";

export type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

export type UserPreferences = {
  user_id: string;
  preferred_mode: string;
  rounds_per_game: number;
};

export type GameHistorySession = {
  id: string;
  user_id: string;
  mode: string;
  score: number;
  rounds: number;
  created_at: string;
  ended_at?: string;
};

type UserResponse = {
  user: User;
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
};

type PreferencesResponse = {
  preferences: UserPreferences;
};

type GameHistoryResponse = {
  sessions: GameHistorySession[];
};

// Authentication methods
export async function registerUser(
  username: string,
  email: string,
  password: string,
) {
  const response = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: { username, email, password },
  });
  
  if (response.token) {
    setToken(response.token);
    setActiveUserId(response.user.id);
  }
  
  return response;
}

export async function loginUser(email: string, password: string) {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
  
  if (response.token) {
    setToken(response.token);
    setActiveUserId(response.user.id);
  }
  
  return response;
}

export async function logoutUser() {
  clearToken();
  localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  localStorage.removeItem(DEMO_USER_STORAGE_KEY);
}

export function getCurrentToken(): string | null {
  return getToken();
}

// Legacy methods for demo user compatibility
export function registerUserLegacy(username: string, email: string) {
  return apiRequest<UserResponse>("/users/register", {
    method: "POST",
    body: { username, email },
  });
}

export function getUser(id: string) {
  return apiRequest<UserResponse>(`/users/${id}`);
}

export async function getUserPreferences(id: string) {
  try {
    return await apiRequest<PreferencesResponse>(`/users/${id}/preferences`);
  } catch (err) {
    // Gracefully handle missing preferences by returning sensible defaults
    if (err && typeof err === "object" && "name" in err && (err as any).name === "ApiError" && (err as any).status === 404) {
      const fallback = {
        preferences: {
          user_id: id,
          preferred_mode: "movies",
          rounds_per_game: 5,
        },
      };
      // Warm up server-side preferences so subsequent profile loads don't hit 404 again.
      try {
        await updateUserPreferences(id, fallback.preferences.preferred_mode, fallback.preferences.rounds_per_game);
      } catch {
        // Keep fallback local even if persistence fails.
      }
      return fallback;
    }
    throw err;
  }
}

export function updateUserPreferences(
  id: string,
  preferredMode: string,
  roundsPerGame: number,
) {
  return apiRequest<PreferencesResponse>(`/users/${id}/preferences`, {
    method: "PUT",
    body: {
      preferred_mode: preferredMode,
      rounds_per_game: roundsPerGame,
    },
  });
}

export function getUserGameHistory(id: string, limit = 10) {
  return apiRequest<GameHistoryResponse>(`/game/history/${id}?limit=${limit}`);
}

export function getActiveUserId() {
  return window.localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
}

export function setActiveUserId(id: string) {
  window.localStorage.setItem(ACTIVE_USER_STORAGE_KEY, id);
}

export function clearActiveUser() {
  window.localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
}

export async function getActiveUser() {
  const activeId = getActiveUserId();
  if (!activeId) {
    return null;
  }

  try {
    const response = await getUser(activeId);
    return response.user;
  } catch {
    clearActiveUser();
    return null;
  }
}

export async function registerAndSetActiveUser(username: string, email: string, password = "default-password") {
  const response = await registerUser(username, email, password);
  setActiveUserId(response.user.id);
  return response.user;
}

export async function ensureDemoUser() {
  const activeUser = await getActiveUser();
  if (activeUser) {
    return activeUser;
  }

  const existingId = window.localStorage.getItem(DEMO_USER_STORAGE_KEY);
  if (existingId) {
    try {
      const response = await getUser(existingId);
      return response.user;
    } catch {
      window.localStorage.removeItem(DEMO_USER_STORAGE_KEY);
    }
  }

  const suffix = Math.random().toString(36).slice(2, 8);
  const username = `projectionist_${suffix}`;
  const email = `${username}@cahier.local`;
  const password = `demo-${suffix}`;
  const response = await registerUser(username, email, password);
  window.localStorage.setItem(DEMO_USER_STORAGE_KEY, response.user.id);
  return response.user;
}
