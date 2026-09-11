import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Persona = "MoSPI Central Monitoring Officer" | "District Authority" | "Risk Analyst";

export const PERSONAS: Persona[] = [
  "MoSPI Central Monitoring Officer",
  "District Authority",
  "Risk Analyst",
];

export type BackendMode = "mock" | "live";
export type HealthState = "unknown" | "checking" | "online" | "offline";

interface PlatformState {
  persona: Persona;
  setPersona: (p: Persona) => void;
  mode: BackendMode;
  setMode: (m: BackendMode) => void;
  endpoint: string;
  setEndpoint: (e: string) => void;
  health: HealthState;
  latencyMs: number | null;
  lastChecked: string | null;
  checkHealth: () => Promise<void>;
}

const DEFAULT_ENDPOINT = "http://127.0.0.1:8000";
const STORAGE_KEY = "mplads.platform.settings";

const Ctx = createContext<PlatformState | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [persona, setPersona] = useState<Persona>("MoSPI Central Monitoring Officer");
  const [mode, setMode] = useState<BackendMode>("mock");
  const [endpoint, setEndpoint] = useState(DEFAULT_ENDPOINT);
  const [health, setHealth] = useState<HealthState>("unknown");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<{ persona: Persona; mode: BackendMode; endpoint: string }>;
      if (saved.persona && PERSONAS.includes(saved.persona)) setPersona(saved.persona);
      if (saved.mode === "live" || saved.mode === "mock") setMode(saved.mode);
      if (typeof saved.endpoint === "string" && saved.endpoint) setEndpoint(saved.endpoint);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ persona, mode, endpoint }));
    } catch {
      /* ignore */
    }
  }, [persona, mode, endpoint]);

  const value = useMemo<PlatformState>(
    () => ({
      persona,
      setPersona,
      mode,
      setMode,
      endpoint,
      setEndpoint,
      health,
      latencyMs,
      lastChecked,
      checkHealth: async () => {
        setHealth("checking");
        const started = performance.now();
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          const res = await fetch(`${endpoint.replace(/\/$/, "")}/health`, {
            signal: controller.signal,
          });
          clearTimeout(timer);
          setLatencyMs(Math.round(performance.now() - started));
          setHealth(res.ok ? "online" : "offline");
        } catch {
          setLatencyMs(null);
          setHealth("offline");
        } finally {
          setLastChecked(new Date().toLocaleTimeString());
        }
      },
    }),
    [persona, mode, endpoint, health, latencyMs, lastChecked],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatform() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlatform must be used inside PlatformProvider");
  return ctx;
}
