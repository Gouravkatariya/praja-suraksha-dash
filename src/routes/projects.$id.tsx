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
import { FileText, ShieldAlert } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { Disclaimer, MetricBar, RiskBadge, RiskGauge } from "@/components/mplads/risk-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RISK_DISCLAIMER, getPeers, getWork, tierColor } from "@/lib/mplads/data";

export const Route = createFileRoute("/projects/$id")({
  loader: ({ params }) => {
    const work = getWork(params.id);
    if (!work) throw notFound();
    return { id: work.id, name: work.name };
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

function RiskProfile() {
  const { id } = Route.useParams();
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
      actions={
        <>
          <Button asChild variant="secondary">
            <Link to="/projects">Back to register</Link>
          </Button>
          <Button asChild>
            <Link to="/brief/$id" params={{ id: work.id }}>
              <FileText className="mr-1 size-4" /> One-click investigation brief
            </Link>
          </Button>
        </>
      }
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
