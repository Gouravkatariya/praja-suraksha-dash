import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { RiskBadge } from "@/components/mplads/risk-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getWorks, tierColor, type RiskTier } from "@/lib/mplads/data";
import { useWorksLive } from "@/lib/mplads/live-data";
import { usePlatform } from "@/lib/mplads/platform-context";
import type { WorkListItem } from "@/lib/mplads/api-client";

export const Route = createFileRoute("/projects/")({
  head: () => ({
    meta: [
      { title: "Flagged Works Register · MPLADS Risk Intelligence" },
      {
        name: "description",
        content:
          "Searchable register of risk-scored MPLADS works with tier filters, expenditure and physical progress.",
      },
      { property: "og:title", content: "Flagged Works Register · MPLADS Risk Intelligence" },
      {
        property: "og:description",
        content: "Search and filter risk-scored MPLADS works by tier, district and agency.",
      },
    ],
  }),
  component: ProjectsList,
});

const TIERS: RiskTier[] = ["Critical", "High", "Medium", "Low"];

function riskLevelToTier(level: string | null): RiskTier {
  if (level === "HIGH") return "High";
  if (level === "MEDIUM") return "Medium";
  if (level === "LOW") return "Low";
  return "Low";
}

function LiveRow({ w }: { w: WorkListItem }) {
  const tier = riskLevelToTier(w.priority.highest_risk_level ?? null);
  const riskTypes = [...w.real_risk_types, ...w.synthetic_risk_types].join(", ") || "—";
  return (
    <tr className="border-b last:border-0 hover:bg-muted/40">
      <td className="py-2 pr-3">
        <span
          className="inline-grid min-w-[36px] place-items-center rounded-sm px-1 py-0.5 font-mono text-xs font-bold text-white"
          style={{ background: tierColor[tier] }}
        >
          {w.priority.flag_count}
        </span>
      </td>
      <td className="max-w-[300px] py-2 pr-3">
        <Link
          to="/projects/$id"
          params={{ id: String(w.work_id) }}
          className="font-medium text-navy underline-offset-2 hover:underline"
        >
          {w.work_description ?? `Work #${w.work_id}`}
        </Link>
        <div className="font-mono text-xs text-muted-foreground">
          {w.unique_work_number ?? `#${w.work_id}`}
        </div>
      </td>
      <td className="py-2 pr-3">
        {w.constituency ?? "—"}
        <div className="text-xs text-muted-foreground">{w.state ?? "—"}</div>
      </td>
      <td className="py-2 pr-3 text-xs">{w.ida ?? "—"}</td>
      <td className="py-2 pr-3 text-right font-mono">
        {w.allocation_amount != null ? `₹${(w.allocation_amount / 100000).toFixed(1)}L` : "—"}
      </td>
      <td className="py-2 pr-3 text-xs">{riskTypes}</td>
      <td className="py-2 pr-3 text-xs">{w.status ?? "—"}</td>
      <td className="py-2"><RiskBadge tier={tier} /></td>
    </tr>
  );
}

function ProjectsList() {
  const { mode } = usePlatform();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<RiskTier | "All">("Critical");
  const [livePage, setLivePage] = useState(1);
  const isLive = mode === "live";

  const liveQuery = useWorksLive(
    isLive ? { q: q || undefined, has_risk_flag: true, page: livePage, page_size: 50 } : {},
  );

  const mockRows = useMemo(() => {
    if (isLive) return [];
    const needle = q.trim().toLowerCase();
    return getWorks()
      .filter((w) => (tier === "All" ? true : w.tier === tier))
      .filter(
        (w) =>
          !needle ||
          w.name.toLowerCase().includes(needle) ||
          w.id.toLowerCase().includes(needle) ||
          w.district.toLowerCase().includes(needle) ||
          w.agency.toLowerCase().includes(needle),
      )
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 100);
  }, [q, tier, isLive]);

  const liveTotal = liveQuery.data?.pagination.total;
  const liveTotalPages = liveQuery.data?.pagination.total_pages ?? 1;

  return (
    <AppShell
      title="Flagged Works Register"
      subtitle={
        isLive
          ? `Live database · ${liveTotal != null ? liveTotal.toLocaleString("en-IN") : "…"} flagged works`
          : "Top 100 matches, ranked by risk score. Select a work to open its explainable risk profile."
      }
    >
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
            <div className="relative min-w-0 sm:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setLivePage(1); }}
                placeholder={isLive ? "Search description or work number" : "Search work, ID, district or agency"}
                className="pl-9"
              />
            </div>
            {!isLive && (
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {(["All", ...TIERS] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTier(t)}
                    className={cn(
                      "rounded-sm border px-3 py-1.5 text-xs font-semibold transition-colors",
                      tier === t ? "bg-navy text-navy-foreground" : "hover:bg-muted",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLive && liveQuery.isLoading && (
            <div className="mt-8 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {isLive && liveQuery.isError && (
            <p className="mt-4 text-sm text-destructive">Backend error: {String(liveQuery.error)}</p>
          )}

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  {isLive ? (
                    <>
                      <th className="py-2 pr-3">Flags</th>
                      <th className="py-2 pr-3">Work</th>
                      <th className="py-2 pr-3">Constituency</th>
                      <th className="py-2 pr-3">IDA</th>
                      <th className="py-2 pr-3 text-right">Allocation</th>
                      <th className="py-2 pr-3">Risk Types</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2">Level</th>
                    </>
                  ) : (
                    <>
                      <th className="py-2 pr-3">Score</th>
                      <th className="py-2 pr-3">Work</th>
                      <th className="py-2 pr-3">District</th>
                      <th className="py-2 pr-3">Agency</th>
                      <th className="py-2 pr-3 text-right">Sanctioned</th>
                      <th className="py-2 pr-3 text-right">Funds / Physical</th>
                      <th className="py-2 pr-3 text-right">Delay</th>
                      <th className="py-2">Tier</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {isLive
                  ? (liveQuery.data?.data ?? []).map((w) => <LiveRow key={w.work_id} w={w} />)
                  : mockRows.map((w) => (
                      <tr key={w.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="py-2 pr-3">
                          <span
                            className="inline-grid size-9 place-items-center rounded-sm font-mono text-xs font-bold text-white"
                            style={{ background: tierColor[w.tier] }}
                          >
                            {w.riskScore}
                          </span>
                        </td>
                        <td className="max-w-[300px] py-2 pr-3">
                          <Link
                            to="/projects/$id"
                            params={{ id: w.id }}
                            className="font-medium text-navy underline-offset-2 hover:underline"
                          >
                            {w.name}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">{w.id}</div>
                        </td>
                        <td className="py-2 pr-3">
                          {w.district}
                          <div className="text-xs text-muted-foreground">{w.state}</div>
                        </td>
                        <td className="py-2 pr-3 text-xs">{w.agency}</td>
                        <td className="py-2 pr-3 text-right font-mono">₹{w.sanctionedLakh}L</td>
                        <td className="py-2 pr-3 text-right font-mono">
                          {w.financialProgress}% / {w.physicalProgress}%
                        </td>
                        <td className="py-2 pr-3 text-right font-mono">{w.delayDays}d</td>
                        <td className="py-2"><RiskBadge tier={w.tier} /></td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {isLive && liveTotalPages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Page {livePage} of {liveTotalPages}</span>
              <div className="flex gap-2">
                <button disabled={livePage <= 1} onClick={() => setLivePage((p) => p - 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Previous</button>
                <button disabled={livePage >= liveTotalPages} onClick={() => setLivePage((p) => p + 1)} className="rounded border px-3 py-1 text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
