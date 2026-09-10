import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/mplads/AppShell";
import { MetricBar } from "@/components/mplads/risk-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAgencyRollups } from "@/lib/mplads/data";

export const Route = createFileRoute("/agencies")({
  head: () => ({
    meta: [
      { title: "Agency Behavioural Analytics · MPLADS Risk Intelligence" },
      {
        name: "description",
        content:
          "Implementing agency risk leaderboard with completion track record, delay frequency and behavioural scores.",
      },
      { property: "og:title", content: "Agency Behavioural Analytics · MPLADS Risk Intelligence" },
      {
        property: "og:description",
        content: "Risk leaderboard, completion records and delay frequency for implementing agencies.",
      },
    ],
  }),
  component: Agencies,
});

function riskColor(score: number) {
  if (score >= 60) return "var(--risk-critical)";
  if (score >= 50) return "var(--risk-high)";
  if (score >= 42) return "var(--risk-medium)";
  return "var(--risk-low)";
}

function Agencies() {
  const agencies = getAgencyRollups();
  const chart = agencies.map((a) => ({
    name: a.name.length > 18 ? `${a.name.slice(0, 17)}…` : a.name,
    "Delay frequency %": a.delayFrequency,
    "Behaviour score": a.behaviourScore,
  }));

  return (
    <AppShell
      title="Agency Behavioural Analytics"
      subtitle="Historical conduct of implementing agencies feeds the behavioural signal in every work's risk score."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Implementing agency risk leaderboard</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Agency</th>
                  <th className="py-2 pr-3 text-right">Works</th>
                  <th className="py-2 pr-3 text-right">Completion</th>
                  <th className="py-2 pr-3 text-right">Avg delay</th>
                  <th className="py-2 pr-3 text-right">Delay freq.</th>
                  <th className="py-2 pr-3 text-right">Flagged</th>
                  <th className="py-2 text-right">Behaviour</th>
                </tr>
              </thead>
              <tbody>
                {agencies.map((a, i) => (
                  <tr key={a.name} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2 pr-3 font-mono text-xs text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-3 font-medium">{a.name}</td>
                    <td className="py-2 pr-3 text-right font-mono">{a.works}</td>
                    <td className="py-2 pr-3 text-right font-mono">{Math.min(100, a.completionRate)}%</td>
                    <td className="py-2 pr-3 text-right font-mono">{a.avgDelayDays}d</td>
                    <td className="py-2 pr-3 text-right font-mono">{a.delayFrequency}%</td>
                    <td className="py-2 pr-3 text-right font-mono">{a.flagged}</td>
                    <td className="py-2 text-right">
                      <span
                        className="inline-grid min-w-10 place-items-center rounded-sm px-2 py-1 font-mono text-xs font-bold text-white"
                        style={{ background: riskColor(a.behaviourScore) }}
                      >
                        {a.behaviourScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Delay frequency vs behaviour score</CardTitle>
            </CardHeader>
            <CardContent className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} layout="vertical" margin={{ left: 20, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Delay frequency %" fill="var(--saffron)" />
                  <Bar dataKey="Behaviour score" fill="var(--navy)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Track record — top 4 riskiest</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {agencies.slice(0, 4).map((a) => (
                <div key={a.name} className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-semibold">{a.name}</p>
                  <MetricBar
                    label="Completion rate"
                    value={Math.min(100, a.completionRate)}
                    color="var(--risk-low)"
                  />
                  <MetricBar
                    label="Delay frequency"
                    value={a.delayFrequency}
                    color="var(--risk-high)"
                  />
                  <MetricBar
                    label="Behavioural risk"
                    value={a.behaviourScore}
                    color="var(--risk-critical)"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
