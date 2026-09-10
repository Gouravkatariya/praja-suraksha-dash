import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Activity,
  ClipboardCheck,
  Copy,
  Building2,
  LayoutDashboard,
  Map as MapIcon,
  Menu,
  Radar,
  Server,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { PERSONAS, usePlatform, type Persona } from "@/lib/mplads/platform-context";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/map", label: "Risk Map", icon: MapIcon },
  { to: "/projects", label: "Flagged Works", icon: Radar },
  { to: "/duplicates", label: "Duplicate / Ghost", icon: Copy },
  { to: "/agencies", label: "Agency Analytics", icon: Building2 },
  { to: "/brief", label: "Investigation Brief", icon: ClipboardCheck },
] as const;

function HealthDot() {
  const { health, mode } = usePlatform();
  const color =
    mode === "mock"
      ? "bg-[var(--saffron)]"
      : health === "online"
        ? "bg-[var(--risk-low)]"
        : health === "offline"
          ? "bg-[var(--risk-critical)]"
          : "bg-muted-foreground";
  return <span className={cn("inline-block size-2 rounded-full", color)} />;
}

function BackendPanel() {
  const { endpoint, setEndpoint, mode, setMode, health, checkHealth, latencyMs, lastChecked } =
    usePlatform();
  const [draft, setDraft] = useState(endpoint);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-white/25 bg-white/10 text-navy-foreground hover:bg-white/20 hover:text-navy-foreground"
        >
          <HealthDot />
          <Server className="size-4" />
          <span className="hidden sm:inline">
            {mode === "mock" ? "Hackathon Mock Mode" : "Live Backend"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Backend connection</DialogTitle>
          <DialogDescription>
            Point the platform at your FastAPI service, or run entirely on the bundled demo dataset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
            <div>
              <p className="text-sm font-semibold">
                {mode === "live" ? "Live Backend" : "Hackathon Mock Mode"}
              </p>
              <p className="text-xs text-muted-foreground">
                {mode === "live"
                  ? "Reads scores and works from the FastAPI endpoint."
                  : "Uses the deterministic 10,000-work demo dataset."}
              </p>
            </div>
            <Switch
              checked={mode === "live"}
              onCheckedChange={(v) => setMode(v ? "live" : "mock")}
              aria-label="Toggle live backend"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endpoint">FastAPI base URL</Label>
            <div className="flex gap-2">
              <Input
                id="endpoint"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => setEndpoint(draft.trim() || "http://127.0.0.1:8000")}
                placeholder="http://127.0.0.1:8000"
                className="font-mono text-sm"
              />
              <Button
                variant="secondary"
                onClick={() => {
                  setEndpoint(draft.trim() || "http://127.0.0.1:8000");
                  void checkHealth();
                }}
              >
                <Activity className="mr-1 size-4" /> Ping
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Health check calls <span className="font-mono">GET {draft.replace(/\/$/, "")}/health</span>
            </p>
          </div>

          <div className="rounded-md border p-3 text-sm">
            <div className="flex items-center gap-2">
              <HealthDot />
              <span className="font-semibold capitalize">{health}</span>
              {latencyMs !== null && (
                <span className="font-mono text-xs text-muted-foreground">{latencyMs} ms</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {lastChecked ? `Last checked at ${lastChecked}` : "No health check run yet."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { persona, setPersona } = usePlatform();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="gov-stripe h-1 w-full no-print" />
      <header className="sticky top-0 z-40 bg-navy text-navy-foreground no-print">
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-sm bg-saffron text-saffron-foreground">
              <Radar className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-lg font-bold uppercase leading-none tracking-wide">
                MPLADS Risk Intelligence
              </p>
              <p className="truncate text-[11px] text-navy-foreground/70">
                Ministry of Statistics &amp; Programme Implementation · SIH26102
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Select value={persona} onValueChange={(v) => setPersona(v as Persona)}>
              <SelectTrigger className="hidden w-[270px] border-white/25 bg-white/10 text-navy-foreground md:flex">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONAS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <BackendPanel />
            <Button
              variant="ghost"
              size="icon"
              className="text-navy-foreground hover:bg-white/15 hover:text-navy-foreground lg:hidden"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle navigation"
            >
              <Menu className="size-5" />
            </Button>
          </div>
        </div>

        <nav
          className={cn(
            "border-t border-white/10 bg-navy/95",
            open ? "block" : "hidden lg:block",
          )}
        >
          <div className="mx-auto flex max-w-[1600px] flex-col gap-1 px-2 py-1 lg:flex-row lg:items-center">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                activeOptions={{ exact: item.to === "/" }}
                activeProps={{ className: "bg-white/15 text-saffron" }}
                className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium text-navy-foreground/85 transition-colors hover:bg-white/10"
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            ))}
            <div className="hidden flex-1 lg:block" />
            <span className="px-3 py-2 text-[11px] uppercase tracking-widest text-navy-foreground/50 md:hidden">
              {persona}
            </span>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-bold uppercase tracking-wide">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2 no-print">{actions}</div>}
        </div>
        {children}
      </main>

      <footer className="mt-10 border-t bg-muted/50 py-6 no-print">
        <div className="mx-auto max-w-[1600px] px-4 text-xs text-muted-foreground">
          Decision-support prototype for Smart India Hackathon 2026. All risk scores are advisory and
          require human verification; no output establishes fraud.
        </div>
      </footer>
    </div>
  );
}
