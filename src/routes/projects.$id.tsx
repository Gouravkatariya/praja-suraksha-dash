import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileText, Loader2, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { Disclaimer, MetricBar, RiskBadge, RiskGauge } from "@/components/mplads/risk-ui";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RISK_DISCLAIMER, getPeers, getWork, tierColor } from "@/lib/mplads/data";
import { useWorkDetailLive, useRiskFlagsForWorkLive } from "@/lib/mplads/live-data";
import { usePlatform } from "@/lib/mplads/platform-context";

export const Route = createFileRoute("/projects/$id")({
  pendingMs: 0,
  pendingComponent: function ProfilePending() {
    return (
      <AppShell title="Project Risk Profile" subtitle="Loading work…">
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  },
  loader: ({ params }) => {
    const isMock = params.id.startsWith("MP-");
    if (isMock) {
      const work = getWork(params.id);
      if (!work) throw notFound();
      return { id: work.id, name: work.name };
    }
    return { id: params.id, name: `Work #${params.id}` };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.name} · Risk Profile` },
          {
            name: "description",
            content: `Explainable AI risk profile for MPLADS work ${loaderData.id}, with six anomaly signals and peer comparison.`,
          },
          { property: "og:title", content: `${loaderData.name} · Risk Profile` },
          {
            property: "og:description",
            content: "Why was this work flagged? Six anomaly signals with evidence and peer benchmarks.",
          },
        ]
      : [{ title: "Work not found" }, { name: "robots", content: "noindex" }],
  }),
  component: RiskProfile,
});

const verdictColor: Record<string, string> = {
  Flagged: "var(--risk-critical)",
  Watch: "var(--risk-medium)",
  Normal: "var(--risk-low)",
};

function ProfileActions({ briefId }: { briefId: string }) {
  return (
    <>
      <Link to="/projects" activeOptions={{ exact: true }} className={buttonVariants({ variant: "secondary" })}>
        Back to register
      </Link>
      <Link to="/brief/$id" params={{ id: briefId }} className={buttonVariants()}>
        <FileText className="mr-1 size-4" /> One-click investigation brief
      </Link>
    </>
  );
}

function LiveRiskProfile({ workId }: { workId: number }) {
  const detailQ = useWorkDetailLive(workId);
  const flagsQ = useRiskFlagsForWorkLive(workId);

  if (detailQ.isLoading) {
    return (
      <AppShell
        title="Project Risk Profile"
        subtitle={`Work #${workId}`}
        actions={<ProfileActions briefId={String(workId)} />}
      >
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>
      </AppShell>
    );
  }
  if (!detailQ.data) {
    return (
      <AppShell
        title="Project Risk Profile"
        subtitle={`Work #${workId}`}
        actions={<ProfileActions briefId={String(workId)} />}
      >
        <p className="text-sm text-destructive">{detailQ.isError ? String(detailQ.error) : "Work not found."}</p>
      </AppShell>
    );
  }

  const w = detailQ.data;
  const flags = flagsQ.data?.risk_flags ?? [];
  const disclaimer = flagsQ.data?.disclaimer ?? RISK_DISCLAIMER;

  return (
    <AppShell
      title="Project Risk Profile"
      subtitle={`#${w.work_id} · ${w.work_description ?? ""}`}
      actions={<ProfileActions briefId={String(w.work_id)} />}
    >
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ShieldAlert className="size-4" /> Why was this flagged?</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <MetricBar label="Data quality score" value={w.data_quality.score ?? 0} color="var(--saffron)" />
              <p className="text-xs text-muted-foreground">Flags: {w.priority.flag_count} · Highest level: {w.priority.highest_risk_level ?? "None"}</p>
              <Disclaimer text={disclaimer} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Work particulars</CardTitle></CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {([
                  ["Category", w.category],
                  ["Constituency", w.constituency],
                  ["State", w.state],
                  ["IDA", w.ida],
                  ["Allocation", w.allocation_amount != null ? `₹${(w.allocation_amount / 100000).toFixed(2)} lakh` : null],
                  ["Actual expenditure", w.actual_expenditure != null ? `₹${(w.actual_expenditure / 100000).toFixed(2)} lakh` : null],
                  ["Sanction date", w.sanction_date],
                  ["Expected completion", w.expected_completion_date],
                  ["Status", w.status],
                  ["IDA approval", w.ida_approval],
                ] as [string, string | null | undefined][]).map(([k, v]) =>
                  v ? (
                    <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                      <dt className="text-muted-foreground">{k}</dt>
                      <dd className="text-right font-medium">{v}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Risk flags from database</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {flags.length === 0 && <p className="text-sm text-muted-foreground">No risk flags stored for this work.</p>}
              {flags.map((f) => (
                <div key={f.id} className="rounded-md border p-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold">{f.risk_type}</span>
                    <span className="rounded-sm bg-muted px-2 py-0.5 text-[11px] font-semibold uppercase">{f.risk_level}</span>
                    <span className="text-[11px] text-muted-foreground">{f.signal_origin}</span>
                  </div>
                  {f.evidence.map((e, i) => (
                    <p key={i} className="mt-2 text-xs text-muted-foreground">{e.explanation}</p>
                  ))}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function RiskProfile() {
  const { id } = Route.useParams();
  const { mode } = usePlatform();
  const numericId = Number(id);

  if (mode === "live" && !id.startsWith("MP-") && !isNaN(numericId)) {
    return <LiveRiskProfile workId={numericId} />;
  }

  const work = getWork(id)!;
  const peers = getPeers(work);

  const shortLabel: Record<string, string> = {
    cost: "Cost",
    timeline: "Timeline",
    mismatch: "Fund/Work gap",
    duplicate: "Duplicate",
    agency: "Agency",
    compliance: "Compliance",
  };
  const radar = work.signals.map((s) => ({
    signal: shortLabel[s.key] ?? s.key,
    score: s.score,
  }));

  const peerRows = [work, ...peers];
  const peerChart = peerRows.map((p) => ({
    name: p.id === work.id ? "This work" : p.id,
    Sanctioned: p.sanctionedLakh,
    "Physical %": p.physicalProgress,
    "Funds %": p.financialProgress,
  }));

  const peerMedianCost =
    Math.round(
      ([...peers].map((p) => p.sanctionedLakh).sort((a, b) => a - b)[Math.floor(peers.length / 2)] ??
        work.sanctionedLakh) * 10,
    ) / 10;

  return (
    <AppShell
      title="Project Risk Profile"
      subtitle={`${work.id} · ${work.name}`}
      actions={<ProfileActions briefId={work.id} />}
    >
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-4" /> Why was this flagged?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <RiskGauge score={work.riskScore} />
              </div>
              <div className="flex justify-center">
                <RiskBadge tier={work.tier} />
              </div>
              <MetricBar label="Model confidence" value={work.confidence} color="var(--navy)" />
              <MetricBar label="Data quality score" value={work.dataQuality} color="var(--saffron)" />
              <Disclaimer text={RISK_DISCLAIMER} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work particulars</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                {[
                  ["Work type", work.workType],
                  ["Constituency", work.constituency],
                  ["District", `${work.district}, ${work.state}`],
                  ["Implementing agency", work.agency],
                  ["Sanctioned", `₹${work.sanctionedLakh} lakh`],
                  ["Expenditure", `₹${work.spentLakh} lakh`],
                  ["Sanction date", work.sanctionDate],
                  ["Due date", work.dueDate],
                  ["Delay", `${work.delayDays} days`],
                ].map(([k, v]) => (
                  <div key={k} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="signals">
            <TabsList>
              <TabsTrigger value="signals">Anomaly signals</TabsTrigger>
              <TabsTrigger value="peers">Peer comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="signals" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Signal contribution profile</CardTitle>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radar} outerRadius="72%">
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="signal" tick={{ fontSize: 11 }} />
                      <Radar dataKey="score" stroke="var(--navy)" fill="var(--navy)" fillOpacity={0.3} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-3 md:grid-cols-2">
                {work.signals.map((s) => (
                  <Card key={s.key} className="overflow-hidden">
                    <div className="h-1 w-full" style={{ background: verdictColor[s.verdict] }} />
                    <CardContent className="p-4">
                      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                        <p className="min-w-0 text-sm font-semibold">{s.label}</p>
                        <span
                          className="shrink-0 rounded-sm px-2 py-0.5 text-[11px] font-bold uppercase text-white"
                          style={{ background: verdictColor[s.verdict] }}
                        >
                          {s.verdict}
                        </span>
                      </div>
                      <div className="mt-3">
                        <MetricBar
                          label={`Signal intensity · weight ${(s.weight * 100).toFixed(0)}%`}
                          value={s.score}
                          color={verdictColor[s.verdict] ?? "var(--navy)"}
                        />
                      </div>
                      <ul className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        {s.evidence.map((e) => (
                          <li key={e} className="flex gap-2">
                            <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="peers" className="mt-4 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Peer comparison engine</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Comparable {work.workType} works in {work.state}. Peer median sanctioned cost: ₹
                    {peerMedianCost} lakh.
                  </p>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={peerChart} margin={{ left: -20, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Sanctioned" fill="var(--navy)" />
                      <Bar dataKey="Funds %" fill="var(--saffron)" />
                      <Bar dataKey="Physical %" fill="var(--risk-low)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="overflow-x-auto p-4">
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="py-2 pr-3">Work</th>
                        <th className="py-2 pr-3">Type</th>
                        <th className="py-2 pr-3 text-right">Cost (₹L)</th>
                        <th className="py-2 pr-3 text-right">Duration</th>
                        <th className="py-2 pr-3 text-right">Physical</th>
                        <th className="py-2 pr-3 text-right">Funds</th>
                        <th className="py-2 text-right">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {peerRows.map((p) => (
                        <tr
                          key={p.id}
                          className={
                            p.id === work.id
                              ? "border-b bg-accent/50 font-semibold"
                              : "border-b last:border-0 hover:bg-muted/40"
                          }
                        >
                          <td className="py-2 pr-3">
                            <Link to="/projects/$id" params={{ id: p.id }} className="hover:underline">
                              {p.id === work.id ? "This work" : p.id}
                            </Link>
                          </td>
                          <td className="py-2 pr-3 text-xs">{p.workType}</td>
                          <td className="py-2 pr-3 text-right font-mono">{p.sanctionedLakh}</td>
                          <td className="py-2 pr-3 text-right font-mono">{365 + p.delayDays}d</td>
                          <td className="py-2 pr-3 text-right font-mono">{p.physicalProgress}%</td>
                          <td className="py-2 pr-3 text-right font-mono">{p.financialProgress}%</td>
                          <td className="py-2 text-right">
                            <span
                              className="inline-grid min-w-9 place-items-center rounded-sm px-1.5 py-0.5 font-mono text-xs font-bold text-white"
                              style={{ background: tierColor[p.tier] }}
                            >
                              {p.riskScore}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
