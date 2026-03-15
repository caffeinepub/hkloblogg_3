/**
 * AuthContext - handles alias+password login/register using Ed25519 identities.
 *
 * IMPORTANT: This file does NOT use useActor. It creates actors directly via
 * createAuthenticatedActor so it is not affected when useActor.ts is
 * overwritten by the platform on new builds.
 */
import { Ed25519KeyIdentity } from "@dfinity/identity";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import type { UserProfile } from "../backend.d";
import { createActorWithConfig } from "../config";
import { useIdentityStore } from "../stores/identityStore";
import {
  deriveIdentityFromCredentials,
  generateSalt,
  hashPasswordWithSalt,
} from "../utils/crypto";
import { getSecretParameter } from "../utils/urlParams";

interface AuthUser {
  alias: string;
  profile: UserProfile;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  isLoading: boolean;
  login: (alias: string, password: string) => Promise<void>;
  register: (alias: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_KEY = "hkloblogg_session";

async function createAuthenticatedActor(identity: Ed25519KeyIdentity) {
  const actor = await createActorWithConfig({ agentOptions: { identity } });
  try {
    const adminToken = getSecretParameter("caffeineAdminToken") ?? "";
    await actor._initializeAccessControlWithSecret(adminToken);
  } catch {
    // Not admin -- that's fine
  }
  return actor;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const setStoredIdentity = useIdentityStore((s) => s.setIdentity);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount (no dependency on useActor)
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }

    (async () => {
      try {
        const parsed = JSON.parse(stored) as {
          alias: string;
          identityJson: string;
        };
        const identity = Ed25519KeyIdentity.fromParsedJson(
          JSON.parse(parsed.identityJson) as [string, string],
        );
        const tempActor = await createAuthenticatedActor(identity);
        const profile = await tempActor
          .getCallerUserProfile()
          .catch((sessionErr: unknown) => {
            console.error(
              "[AuthContext] Session restore - getCallerUserProfile failed:",
              sessionErr,
            );
            console.error(
              "[AuthContext] Session restore error type:",
              typeof sessionErr,
              sessionErr instanceof Error ? "is Error" : "not Error",
            );
            console.error(
              "[AuthContext] Session restore error message:",
              (sessionErr as any)?.message,
            );
            console.error(
              "[AuthContext] Session restore error string:",
              String(sessionErr),
            );
            try {
              console.error(
                "[AuthContext] Session restore error JSON:",
                JSON.stringify(sessionErr),
              );
            } catch {}
            return null;
          });
        if (profile) {
          setStoredIdentity(identity);
          setCurrentUser({ alias: parsed.alias, profile });
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      } catch (sessionErr: unknown) {
        console.error("[AuthContext] Session restore failed:", sessionErr);
        console.error(
          "[AuthContext] Session restore error type:",
          typeof sessionErr,
          sessionErr instanceof Error ? "is Error" : "not Error",
        );
        console.error(
          "[AuthContext] Session restore error message:",
          (sessionErr as any)?.message,
        );
        console.error(
          "[AuthContext] Session restore error string:",
          String(sessionErr),
        );
        try {
          console.error(
            "[AuthContext] Session restore error JSON:",
            JSON.stringify(sessionErr),
          );
        } catch {}
        localStorage.removeItem(SESSION_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [setStoredIdentity]);

  const login = async (alias: string, password: string) => {
    const identity = await deriveIdentityFromCredentials(alias, password);
    const tempActor = await createAuthenticatedActor(identity);

    try {
      const hash = new Uint8Array(32);
      await tempActor.login(hash);
    } catch (e: unknown) {
      // --- Detailed error logging ---
      console.error("[AuthContext] login() caught error:", e);
      console.error(
        "[AuthContext] Error type:",
        typeof e,
        e instanceof Error ? "is Error" : "not Error",
      );
      console.error("[AuthContext] Error message:", (e as any)?.message);
      console.error("[AuthContext] Error string:", String(e));
      try {
        console.error("[AuthContext] Error JSON:", JSON.stringify(e));
      } catch {}
      // --- End detailed error logging ---

      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("User not found")) {
        throw new Error(
          "Anv\u00e4ndare hittades inte. Kontrollera uppgifterna eller registrera dig.",
        );
      }
      if (msg.includes("blocked")) {
        throw new Error("Ditt konto \u00e4r blockerat.");
      }
      // Show the actual error detail on screen so it can be reported
      const detail = e instanceof Error ? e.message : String(e);
      throw new Error(`Inloggning misslyckades: ${detail}`);
    }

    const profile = await tempActor.getCallerUserProfile().catch(() => null);
    if (!profile) throw new Error("Profil kunde inte h\u00e4mtas.");

    setStoredIdentity(identity);
    const identityJson = JSON.stringify(identity.toJSON());
    localStorage.setItem(SESSION_KEY, JSON.stringify({ alias, identityJson }));
    setCurrentUser({ alias: profile.alias, profile });
  };

  const register = async (alias: string, password: string) => {
    const identity = await deriveIdentityFromCredentials(alias, password);
    const tempActor = await createAuthenticatedActor(identity);

    const salt = generateSalt();
    const hash = await hashPasswordWithSalt(password, salt);
    await tempActor.register(alias, hash, salt);

    const profile = await tempActor.getCallerUserProfile().catch(() => null);
    if (!profile) throw new Error("Profil kunde inte h\u00e4mtas.");

    setStoredIdentity(identity);
    const identityJson = JSON.stringify(identity.toJSON());
    localStorage.setItem(SESSION_KEY, JSON.stringify({ alias, identityJson }));
    setCurrentUser({ alias: profile.alias, profile });
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setStoredIdentity(null);
    setCurrentUser(null);
  };

  const refreshProfile = async () => {
    const storedIdentity = useIdentityStore.getState().identity;
    if (!storedIdentity || !currentUser) return;
    try {
      const tempActor = await createAuthenticatedActor(storedIdentity);
      const profile = await tempActor.getCallerUserProfile();
      if (profile) {
        setCurrentUser({ alias: profile.alias, profile });
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
