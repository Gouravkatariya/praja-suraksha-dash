import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, X } from "lucide-react";

import { AppShell } from "@/components/mplads/AppShell";
import { RiskBadge } from "@/components/mplads/risk-ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getDistrictRollups,
  getStateRollups,
  getWorks,
  tierColor,
  type RiskTier,
} from "@/lib/mplads/data";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Geospatial Risk Map · MPLADS Risk Intelligence" },
      {
        name: "description",
        content:
          "State and district risk heatmap with colour-coded clusters and a district drawer listing flagged MPLADS works.",
      },
      { property: "og:title", content: "Geospatial Risk Map · MPLADS Risk Intelligence" },
      {
        property: "og:description",
        content: "Colour-coded district clusters and flagged-work drill-down across India.",
      },
    ],
  }),
  component: RiskMap,
});

const TIERS: RiskTier[] = ["Critical", "High", "Medium", "Low"];

// Simple equirectangular projection over India's bounding box.
const BOUNDS = { minLat: 7, maxLat: 36, minLng: 68, maxLng: 98 };
function project(lat: number, lng: number) {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = (1 - (lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x, y };
}

// Coarse India landmass outline [lat, lng] for orientation only (not survey-accurate).
const INDIA_OUTLINE: Array<[number, number]> = [
  [35.4, 77.0],
  [34.1, 78.9],
  [32.6, 79.1],
  [30.4, 81.0],
  [28.6, 84.0],
  [27.5, 88.2],
  [27.9, 89.3],
  [26.9, 92.1],
  [27.9, 95.4],
  [27.0, 97.4],
  [25.2, 94.6],
  [23.4, 93.4],
  [22.0, 92.6],
  [23.7, 91.0],
  [25.2, 89.8],
  [22.6, 88.9],
  [21.5, 87.0],
  [19.9, 85.5],
  [17.7, 83.3],
  [15.9, 80.9],
  [13.1, 80.3],
  [10.3, 79.9],
  [8.1, 77.5],
  [9.9, 76.2],
  [12.8, 74.8],
  [15.9, 73.6],
  [19.0, 72.8],
  [21.7, 72.6],
  [22.3, 69.0],
  [23.7, 68.2],
  [25.2, 70.9],
  [27.9, 70.6],
  [30.0, 74.5],
  [32.3, 75.3],
  [34.5, 74.1],
  [35.4, 77.0],
];



function dominantTier(d: { critical: number; high: number; medium: number }): RiskTier {
  if (d.critical >= 8) return "Critical";
  if (d.critical > 0 || d.high >= 25) return "High";
  if (d.high > 0 || d.medium > 0) return "Medium";
  return "Low";
}

function RiskMap() {
  const districts = useMemo(() => getDistrictRollups(), []);
  const states = useMemo(() => getStateRollups(), []);
  const [selected, setSelected] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<RiskTier | "All">("All");

  const selectedDistrict = districts.find((d) => `${d.state}|${d.district}` === selected) ?? null;

  const drawerWorks = useMemo(() => {
    if (!selectedDistrict) return [];
    return getWorks()
      .filter(
        (w) =>
          w.district === selectedDistrict.district &&
          w.state === selectedDistrict.state &&
          (tierFilter === "All" ? w.tier === "Critical" || w.tier === "High" : w.tier === tierFilter),
      )
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 40);
  }, [selectedDistrict, tierFilter]);

  const maxRisk = Math.max(...states.map((s) => s.avgRisk));

  return (
    <AppShell
      title="Interactive Geospatial Risk Map"
      subtitle="District clusters sized by work volume and coloured by dominant risk tier. Select a district to review flagged works."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
            <CardTitle>Cluster map — India</CardTitle>
            <div className="flex flex-wrap gap-2">
              {TIERS.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: tierColor[t] }} />
                  {t}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-hidden rounded-md border bg-[oklch(0.96_0.02_240)]">
              <div className="relative w-full" style={{ paddingTop: "92%" }}>
                <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="5" height="5" patternUnits="userSpaceOnUse">
                      <path d="M 5 0 L 0 0 0 5" fill="none" stroke="var(--border)" strokeWidth="0.15" />
                    </pattern>
                  </defs>
                  <rect width="100" height="100" fill="url(#grid)" />
                  <polygon
                    points={INDIA_OUTLINE.map(([lat, lng]) => {
                      const p = project(lat, lng);
                      return `${p.x},${p.y}`;
                    }).join(" ")}
                    fill="oklch(0.98 0.01 240)"
                    stroke="var(--navy)"
                    strokeWidth="0.4"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {districts.map((d) => {
                  const { x, y } = project(d.lat, d.lng);
                  const tier = dominantTier(d);
                  const size = Math.max(14, Math.min(40, 10 + d.total / 22));
                  const key = `${d.state}|${d.district}`;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(key)}
                      title={`${d.district}, ${d.state} — ${d.total} works`}
                      className={cn(
                        "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/80 font-mono text-[10px] font-bold text-white shadow-md transition-transform hover:scale-110",
                        selected === key && "ring-3 ring-navy",
                      )}
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: size,
                        height: size,
                        background: tierColor[tier],
                      }}
                    >
                      {d.critical > 0 ? d.critical : ""}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Marker size reflects the number of sanctioned works; the label shows critical-tier count.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>State risk heatmap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {states.map((s) => (
                <div key={s.state} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{s.state}</p>
                    <div className="mt-1 h-2 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(s.avgRisk / maxRisk) * 100}%`,
                          background: `color-mix(in oklab, var(--risk-critical) ${Math.round((s.avgRisk / maxRisk) * 100)}%, var(--risk-low))`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {s.avgRisk} · {s.critical}C
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          {selectedDistrict && (
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="size-4" />
                    <span className="truncate">{selectedDistrict.district}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selectedDistrict.state} · {selectedDistrict.total} works · avg risk{" "}
                    {selectedDistrict.avgRisk}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelected(null)} aria-label="Close">
                  <X className="size-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {(["All", ...TIERS] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTierFilter(t)}
                      className={cn(
                        "rounded-sm border px-2 py-1 text-xs font-medium transition-colors",
                        tierFilter === t ? "bg-navy text-navy-foreground" : "hover:bg-muted",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                  {drawerWorks.length === 0 && (
                    <p className="text-sm text-muted-foreground">No works match this filter.</p>
                  )}
                  {drawerWorks.map((w) => (
                    <Link
                      key={w.id}
                      to="/projects/$id"
                      params={{ id: w.id }}
                      className="flex items-center gap-2 rounded-md border p-2 transition-colors hover:bg-muted/50"
                    >
                      <span
                        className="grid size-8 shrink-0 place-items-center rounded-sm font-mono text-xs font-bold text-white"
                        style={{ background: tierColor[w.tier] }}
                      >
                        {w.riskScore}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{w.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {w.id} · ₹{w.sanctionedLakh} lakh
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
