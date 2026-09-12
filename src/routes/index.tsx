import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ArrowUpRight, IndianRupee, Target, TrendingUp } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { RiskBadge } from "@/components/mplads/risk-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePlatform } from "@/lib/mplads/platform-context";
import {
  TIER_COUNTS,
  TOP100_PRECISION,
  TOTAL_WORKS,
  getFlaggedWorks,
  getStateRollups,
  mismatchAlerts,
  portfolioTotals,
  tierColor,
  type RiskTier,
} from "@/lib/mplads/data";
import { useTotalWorksCount } from "@/lib/mplads/live-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Executive Risk Dashboard · MPLADS Risk Intelligence" },
      {
        name: "description",
        content:
          "Portfolio risk overview of 10,000 MPLADS works: risk tiers, inspection precision, expenditure utilisation and progress-mismatch alerts.",
      },
      { property: "og:title", content: "Executive Risk Dashboard · MPLADS Risk Intelligence" },
      {
        property: "og:description",
        content: "Risk tiers, inspection precision and early-warning alerts for MPLADS works.",
      },
    ],
  }),
  component: Dashboard,
});

const TIERS: RiskTier[] = ["Critical", "High", "Medium", "Low"];

function Stat({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Target;
  accent?: string;
}) {
  return (
    <Card className="print-plain">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
            <p
              className="mt-2 font-display text-4xl font-bold leading-none"
              style={accent ? { color: accent } : undefined}
            >
              {value}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
          </div>
          <Icon className="size-5 shrink-0 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { persona, mode } = usePlatform();
  const totals = portfolioTotals();
  const states = getStateRollups().slice(0, 8);
  const alerts = mismatchAlerts(6);
  const topRisk = getFlaggedWorks().slice(0, 8);
  const liveTotal = useTotalWorksCount();
  const displayTotal = typeof liveTotal === "number" ? liveTotal : TOTAL_WORKS;

  const stateChart = states.map((s) => ({
    state: s.state.length > 12 ? `${s.state.slice(0, 11)}…` : s.state,
    Critical: s.critical,
    High: s.high,
  }));

  const pie = TIERS.map((t) => ({ name: t, value: TIER_COUNTS[t] }));

  return (
    <AppShell
      title="Executive Risk Dashboard"
      subtitle={`${persona} · ${mode === "mock" ? "Hackathon Mock Mode" : "Live Backend"} · ${displayTotal.toLocaleString("en-IN")} works under monitoring`}
      actions={
        <Button asChild variant="secondary">
          <Link to="/projects">
            Open flagged works <ArrowUpRight className="ml-1 size-4" />
          </Link>
        </Button>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Top-100 Inspection Precision"
          value={`${TOP100_PRECISION}%`}
          hint="Of the 100 highest-scored works, 72 were confirmed anomalous on field verification."
          icon={Target}
          accent="var(--navy)"
        />
        <Stat
          label="Total Sanctioned"
          value={`₹${totals.sanctionedCr.toLocaleString("en-IN")} Cr`}
          hint="Across all sanctioned MPLADS works in scope."
          icon={IndianRupee}
        />
        <Stat
          label="Actual Expenditure"
          value={`₹${totals.spentCr.toLocaleString("en-IN")} Cr`}
          hint={`${totals.utilisation}% utilisation against sanctioned amount.`}
          icon={TrendingUp}
        />
        <Stat
          label="Critical Risk Works"
          value={TIER_COUNTS.Critical.toString()}
          hint="Recommended for immediate district-level verification."
          icon={AlertTriangle}
          accent="var(--risk-critical)"
        />
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-4">
        {TIERS.map((t) => (
          <Card key={t} className="overflow-hidden">
            <div className="h-1.5 w-full" style={{ background: tierColor[t] }} />
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <RiskBadge tier={t} />
                <span className="font-mono text-xs text-muted-foreground">
                  {((TIER_COUNTS[t] / TOTAL_WORKS) * 100).toFixed(1)}%
                </span>
              </div>
              <p className="mt-3 font-display text-4xl font-bold" style={{ color: tierColor[t] }}>
                {TIER_COUNTS[t].toLocaleString("en-IN")}
              </p>
              <p className="text-xs text-muted-foreground">works in this risk tier</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Critical &amp; high-risk works by state</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stateChart} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="state" tick={{ fontSize: 11 }} interval={0} angle={-18} dy={10} height={50} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Critical" stackId="a" fill="var(--risk-critical)" />
                <Bar dataKey="High" stackId="a" fill="var(--risk-high)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Portfolio risk distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={58} outerRadius={95} paddingAngle={2}>
                  {pie.map((p) => (
                    <Cell key={p.name} fill={tierColor[p.name as RiskTier]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-[var(--risk-critical)]" />
              Expenditure vs physical progress mismatch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((w) => (
              <Link
                key={w.id}
                to="/projects/$id"
                params={{ id: w.id }}
                className="block rounded-md border p-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{w.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {w.district}, {w.state} · {w.agency}
                    </p>
                  </div>
                  <RiskBadge tier={w.tier} />
                </div>
                <p className="mt-2 font-mono text-xs">
                  <span className="text-[var(--risk-high)]">{w.financialProgress}% funds disbursed</span>{" "}
                  vs <span className="text-[var(--risk-critical)]">{w.physicalProgress}% physical work</span>{" "}
                  · gap {w.financialProgress - w.physicalProgress} pts
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Highest-scored works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topRisk.map((w) => (
              <Link
                key={w.id}
                to="/projects/$id"
                params={{ id: w.id }}
                className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-sm font-mono text-sm font-bold text-white"
                  style={{ background: tierColor[w.tier] }}
                >
                  {w.riskScore}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.id} · {w.district}, {w.state}
                  </p>
                </div>
                <RiskBadge tier={w.tier} />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
