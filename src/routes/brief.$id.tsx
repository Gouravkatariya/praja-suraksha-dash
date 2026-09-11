import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Printer } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { Disclaimer, RiskBadge } from "@/components/mplads/risk-ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlatform } from "@/lib/mplads/platform-context";
import { RISK_DISCLAIMER, getPeers, getWork, tierColor } from "@/lib/mplads/data";

export const Route = createFileRoute("/brief/$id")({
  loader: ({ params }) => {
    const work = getWork(params.id);
    if (!work) throw notFound();
    return { id: work.id, name: work.name };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `Field Investigation Brief · ${loaderData.id}` },
          {
            name: "description",
            content: `Official MoSPI field investigation brief for MPLADS work ${loaderData.id}, with red flags and a verification checklist.`,
          },
          { property: "og:title", content: `Field Investigation Brief · ${loaderData.id}` },
          {
            property: "og:description",
            content: "Red flags, evidence and a recommended verification checklist for field officers.",
          },
        ]
      : [{ title: "Brief unavailable" }, { name: "robots", content: "noindex" }],
  }),
  component: Brief,
});


const CHECKLIST = [
  "Physically verify the work site and record GPS-tagged photographs from three angles.",
  "Obtain the measurement book (MB) and reconcile recorded quantities with site measurements.",
  "Verify utilisation certificates and instalment release dates against progress certification.",
  "Cross-check the sanction order against the district register for a duplicate entry of the same asset.",
  "Record statements of the beneficiary panchayat / ward committee on asset existence and usage.",
  "Compare unit rates applied with the current district schedule of rates.",
  "Confirm the implementing agency's technical sanction and tender documentation are on record.",
  "Photograph the display board showing MPLADS funding, work name and sanctioned cost.",
];

function Brief() {
  const { id } = Route.useParams();
  const work = getWork(id)!;
  const peers = getPeers(work);
  const { persona } = usePlatform();
  const redFlags = work.signals.filter((s) => s.verdict !== "Normal");
  const peerMedian =
    Math.round(
      ([...peers].map((p) => p.sanctionedLakh).sort((a, b) => a - b)[Math.floor(peers.length / 2)] ??
        work.sanctionedLakh) * 10,
    ) / 10;

  return (
    <AppShell
      title="Field Investigation Brief"
      subtitle={`${work.id} · prepared for the District Collector, ${work.district}`}
      actions={
        <>
          <Button asChild variant="secondary">
            <Link to="/projects/$id" params={{ id: work.id }}>
              Back to risk profile
            </Link>
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="mr-1 size-4" /> Print / export PDF
          </Button>
        </>
      }
    >
      <Card className="print-plain mx-auto max-w-4xl">
        <CardContent className="space-y-6 p-8">
          <header className="border-b pb-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="min-w-0">
                <p className="font-display text-xl font-bold uppercase tracking-wide">
                  Government of India
                </p>
                <p className="text-sm">Ministry of Statistics &amp; Programme Implementation</p>
                <p className="text-sm text-muted-foreground">
                  Members of Parliament Local Area Development Scheme (MPLADS)
                </p>
              </div>
              <div className="shrink-0 text-right text-xs">
                <p className="font-mono">Ref: MoSPI/MPLADS/RI/{work.id}</p>
                <p className="font-mono">Date: {new Date().toLocaleDateString("en-IN")}</p>
                <p className="mt-1">Issued by: {persona}</p>
              </div>
            </div>
            <p className="mt-4 font-display text-lg font-bold uppercase">
              Field Investigation Brief — Risk-Flagged Work
            </p>
          </header>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              1. Work particulars
            </h2>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ["Work ID", work.id],
                  ["Work name", work.name],
                  ["Category", work.workType],
                  ["Constituency", work.constituency],
                  ["District / State", `${work.district}, ${work.state}`],
                  ["Implementing agency", work.agency],
                  ["Sanctioned amount", `₹${work.sanctionedLakh} lakh`],
                  ["Expenditure booked", `₹${work.spentLakh} lakh (${work.financialProgress}%)`],
                  ["Physical progress", `${work.physicalProgress}%`],
                  ["Sanction date / due date", `${work.sanctionDate} → ${work.dueDate}`],
                  ["Delay", `${work.delayDays} days beyond schedule`],
                  ["Peer median cost", `₹${peerMedian} lakh for comparable works`],
                ].map(([k, v]) => (
                  <tr key={k} className="border-b last:border-0">
                    <td className="w-56 py-1.5 pr-4 align-top text-muted-foreground">{k}</td>
                    <td className="py-1.5 font-medium">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              2. Risk assessment
            </h2>
            <div className="flex flex-wrap items-center gap-4 rounded-md border p-4">
              <span
                className="grid size-16 place-items-center rounded-sm font-display text-2xl font-bold text-white"
                style={{ background: tierColor[work.tier] }}
              >
                {work.riskScore}
              </span>
              <div className="text-sm">
                <div className="flex items-center gap-2">
                  <RiskBadge tier={work.tier} />
                  <span className="font-mono text-xs text-muted-foreground">
                    confidence {work.confidence}% · data quality {work.dataQuality}%
                  </span>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {redFlags.length} of 6 anomaly signals raised for this work.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              3. Red flags observed
            </h2>
            <ol className="space-y-3">
              {redFlags.map((s, i) => (
                <li key={s.key} className="rounded-md border p-3">
                  <p className="text-sm font-semibold">
                    {i + 1}. {s.label}{" "}
                    <span className="font-mono text-xs text-muted-foreground">
                      (intensity {s.score}/100)
                    </span>
                  </p>
                  <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                    {s.evidence.map((e) => (
                      <li key={e}>• {e}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
              4. Recommended verification checklist
            </h2>
            <ul className="space-y-2 text-sm">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex gap-3">
                  <span className="mt-0.5 inline-block size-4 shrink-0 border border-foreground" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <Disclaimer text={RISK_DISCLAIMER} />
          </section>

          <footer className="grid gap-8 border-t pt-8 text-xs sm:grid-cols-2">
            <div>
              <div className="h-12 border-b border-dashed" />
              <p className="mt-1">Signature — Verifying Officer</p>
            </div>
            <div>
              <div className="h-12 border-b border-dashed" />
              <p className="mt-1">Signature — District Collector / Authorised Officer</p>
            </div>
          </footer>
        </CardContent>
      </Card>
    </AppShell>
  );
}
