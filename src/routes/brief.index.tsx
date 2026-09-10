import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { RiskBadge } from "@/components/mplads/risk-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFlaggedWorks, tierColor } from "@/lib/mplads/data";

export const Route = createFileRoute("/brief/")({
  head: () => ({
    meta: [
      { title: "Investigation Briefs · MPLADS Risk Intelligence" },
      {
        name: "description",
        content:
          "Generate a printable MoSPI field investigation brief with red flags and a verification checklist for District Collectors.",
      },
      { property: "og:title", content: "Investigation Briefs · MPLADS Risk Intelligence" },
      {
        property: "og:description",
        content: "One-click official field investigation briefs for flagged MPLADS works.",
      },
    ],
  }),
  component: BriefIndex,
});

function BriefIndex() {
  const works = getFlaggedWorks().slice(0, 24);

  return (
    <AppShell
      title="One-Click Investigation Brief"
      subtitle="Select a flagged work to generate a printable field investigation brief for the District Collector."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {works.map((w) => (
          <Card key={w.id}>
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
              <CardTitle className="min-w-0 text-base">
                <span className="line-clamp-2">{w.name}</span>
              </CardTitle>
              <span
                className="grid size-10 shrink-0 place-items-center rounded-sm font-mono text-sm font-bold text-white"
                style={{ background: tierColor[w.tier] }}
              >
                {w.riskScore}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {w.id} · {w.district}, {w.state} · {w.agency}
              </p>
              <div className="flex items-center gap-2">
                <RiskBadge tier={w.tier} />
                <span className="font-mono text-xs text-muted-foreground">
                  {w.financialProgress}% funds / {w.physicalProgress}% work
                </span>
              </div>
              <Link
                to="/brief/$id"
                params={{ id: w.id }}
                className="inline-flex items-center gap-1.5 rounded-sm bg-navy px-3 py-2 text-xs font-semibold text-navy-foreground hover:bg-navy/90"
              >
                <FileText className="size-4" /> Generate brief
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
