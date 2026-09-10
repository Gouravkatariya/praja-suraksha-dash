import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { RiskBadge } from "@/components/mplads/risk-ui";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getWorks, tierColor, type RiskTier } from "@/lib/mplads/data";

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

function ProjectsList() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<RiskTier | "All">("Critical");

  const rows = useMemo(() => {
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
  }, [q, tier]);

  return (
    <AppShell
      title="Flagged Works Register"
      subtitle="Top 100 matches, ranked by risk score. Select a work to open its explainable risk profile."
    >
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
            <div className="relative min-w-0 sm:w-80">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search work, ID, district or agency"
                className="pl-9"
              />
            </div>
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
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">Work</th>
                  <th className="py-2 pr-3">District</th>
                  <th className="py-2 pr-3">Agency</th>
                  <th className="py-2 pr-3 text-right">Sanctioned</th>
                  <th className="py-2 pr-3 text-right">Funds / Physical</th>
                  <th className="py-2 pr-3 text-right">Delay</th>
                  <th className="py-2">Tier</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
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
                    <td className="py-2">
                      <RiskBadge tier={w.tier} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
