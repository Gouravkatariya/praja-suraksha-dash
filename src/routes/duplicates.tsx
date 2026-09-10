import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, CalendarClock, Ruler, TextSearch } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { Disclaimer, RiskBadge } from "@/components/mplads/risk-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RISK_DISCLAIMER, getDuplicatePairs, type Work } from "@/lib/mplads/data";

export const Route = createFileRoute("/duplicates")({
  head: () => ({
    meta: [
      { title: "Duplicate & Ghost Work Detector · MPLADS Risk Intelligence" },
      {
        name: "description",
        content:
          "Side-by-side duplicate detection using semantic text similarity, geospatial distance, sanction-date overlap and photo verification.",
      },
      { property: "og:title", content: "Duplicate & Ghost Work Detector · MPLADS Risk Intelligence" },
      {
        property: "og:description",
        content: "Semantic similarity, distance, date overlap and photo checks for suspected duplicate works.",
      },
    ],
  }),
  component: Duplicates,
});

function Side({ w, label }: { w: Work; label: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{w.name}</p>
      <p className="font-mono text-xs text-muted-foreground">{w.id}</p>
      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Agency</dt>
          <dd className="text-right">{w.agency}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Sanctioned</dt>
          <dd className="font-mono">₹{w.sanctionedLakh} lakh</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Sanction date</dt>
          <dd className="font-mono">{w.sanctionDate}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Physical progress</dt>
          <dd className="font-mono">{w.physicalProgress}%</dd>
        </div>
      </dl>
      <Link
        to="/projects/$id"
        params={{ id: w.id }}
        className="mt-2 inline-block text-xs font-semibold text-navy underline-offset-2 hover:underline"
      >
        Open risk profile →
      </Link>
    </div>
  );
}

function Duplicates() {
  const pairs = getDuplicatePairs();

  return (
    <AppShell
      title="Duplicate / Ghost Work Detector"
      subtitle="Candidate pairs where description, location and sanction timing suggest the same work may have been funded twice."
    >
      <div className="mb-4">
        <Disclaimer text={RISK_DISCLAIMER} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {pairs.map((p) => (
          <Card key={p.id}>
            <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">
                  {p.id} · {p.a.district}, {p.a.state}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{p.a.workType}</p>
              </div>
              <span
                className="rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase"
                style={{
                  color:
                    p.verdict === "Probable duplicate" ? "var(--risk-critical)" : "var(--risk-high)",
                  borderColor: "currentColor",
                }}
              >
                {p.verdict}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Side w={p.a} label="Record A" />
                <Side w={p.b} label="Record B" />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-md bg-muted/60 p-2 text-xs">
                  <TextSearch className="size-4 shrink-0 text-navy" />
                  <span>
                    Semantic text similarity <strong className="font-mono">{p.similarity}%</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted/60 p-2 text-xs">
                  <Ruler className="size-4 shrink-0 text-navy" />
                  <span>
                    Geospatial distance <strong className="font-mono">{p.distanceM} m</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted/60 p-2 text-xs">
                  <CalendarClock className="size-4 shrink-0 text-navy" />
                  <span>
                    Sanction date overlap{" "}
                    <strong className="font-mono">{p.sanctionOverlapDays} days</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-md bg-muted/60 p-2 text-xs">
                  <Camera className="size-4 shrink-0 text-navy" />
                  <span>{p.photoVerification}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <RiskBadge tier={p.a.tier} />
                <RiskBadge tier={p.b.tier} />
                <Link
                  to="/brief/$id"
                  params={{ id: p.a.id }}
                  className="ml-auto text-xs font-semibold text-navy underline-offset-2 hover:underline"
                >
                  Generate investigation brief →
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
