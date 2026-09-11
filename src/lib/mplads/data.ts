// Deterministic seeded mock dataset for the MPLADS Risk Intelligence Platform.
// Numbers are stable across reloads so demo figures always match.

export type RiskTier = "Critical" | "High" | "Medium" | "Low";

export const TIER_COUNTS: Record<RiskTier, number> = {
  Critical: 120,
  High: 510,
  Medium: 1530,
  Low: 7840,
};

export const TOTAL_WORKS = 10000;
export const TOP100_PRECISION = 72;

export interface SignalDetail {
  key: string;
  label: string;
  score: number; // 0-100 contribution intensity
  weight: number; // share of final score
  verdict: "Flagged" | "Watch" | "Normal";
  headline: string;
  evidence: string[];
}

export interface Work {
  id: string;
  name: string;
  workType: string;
  state: string;
  district: string;
  constituency: string;
  agency: string;
  sanctionedLakh: number;
  spentLakh: number;
  physicalProgress: number; // %
  financialProgress: number; // %
  sanctionDate: string;
  dueDate: string;
  delayDays: number;
  riskScore: number;
  tier: RiskTier;
  confidence: number;
  dataQuality: number;
  lat: number;
  lng: number;
  signals: SignalDetail[];
}

export interface DistrictRollup {
  district: string;
  state: string;
  lat: number;
  lng: number;
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  avgRisk: number;
}

export interface AgencyRollup {
  name: string;
  works: number;
  completed: number;
  completionRate: number;
  avgDelayDays: number;
  delayFrequency: number;
  behaviourScore: number; // 0-100, higher = riskier
  flagged: number;
}

/* ------------------------------------------------------------------ */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATES: { state: string; lat: number; lng: number; districts: string[] }[] = [
  { state: "Uttar Pradesh", lat: 26.85, lng: 80.95, districts: ["Lucknow", "Varanasi", "Kanpur Nagar", "Gorakhpur", "Prayagraj", "Meerut"] },
  { state: "Maharashtra", lat: 19.75, lng: 75.71, districts: ["Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur"] },
  { state: "Bihar", lat: 25.6, lng: 85.13, districts: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur", "Darbhanga"] },
  { state: "Madhya Pradesh", lat: 23.25, lng: 77.41, districts: ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Rewa"] },
  { state: "Rajasthan", lat: 26.91, lng: 75.79, districts: ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"] },
  { state: "Tamil Nadu", lat: 11.13, lng: 78.66, districts: ["Chennai", "Coimbatore", "Madurai", "Salem", "Trichy"] },
  { state: "West Bengal", lat: 22.98, lng: 87.85, districts: ["Kolkata", "Howrah", "Darjeeling", "Malda", "Bardhaman"] },
  { state: "Karnataka", lat: 15.32, lng: 75.71, districts: ["Bengaluru Urban", "Mysuru", "Belagavi", "Kalaburagi"] },
  { state: "Gujarat", lat: 22.26, lng: 71.19, districts: ["Ahmedabad", "Surat", "Rajkot", "Vadodara"] },
  { state: "Odisha", lat: 20.95, lng: 85.1, districts: ["Khordha", "Cuttack", "Sambalpur", "Ganjam"] },
  { state: "Assam", lat: 26.2, lng: 92.94, districts: ["Kamrup", "Dibrugarh", "Silchar"] },
  { state: "Kerala", lat: 10.85, lng: 76.27, districts: ["Ernakulam", "Thiruvananthapuram", "Kozhikode"] },
];

const WORK_TYPES = [
  "Community Hall",
  "Rural Road / CC Road",
  "Drinking Water — Borewell",
  "School Building Block",
  "Public Toilet Complex",
  "Solar Street Lighting",
  "Primary Health Sub-Centre",
  "Drainage & Culvert",
  "Anganwadi Centre",
  "Sports Ground Development",
  "Bus Shelter",
  "Library Building",
];

const AGENCIES = [
  "PWD Division",
  "Zilla Parishad Works Dept",
  "Municipal Corporation Engg. Cell",
  "Rural Engineering Service",
  "Jal Nigam Sub-Division",
  "District Rural Development Agency",
  "Panchayati Raj Engg. Wing",
  "State Housing Board Unit",
  "Education Dept Civil Cell",
  "Urban Local Body Works",
];

const SIGNAL_META = [
  { key: "cost", label: "Cost Anomaly vs Peer IQR Benchmark", weight: 0.2 },
  { key: "timeline", label: "Timeline & Delay Detection", weight: 0.18 },
  { key: "mismatch", label: "Expenditure vs Physical Progress Mismatch", weight: 0.22 },
  { key: "duplicate", label: "Duplicate & Semantic Work Similarity", weight: 0.15 },
  { key: "agency", label: "Implementing Agency Behavioural Score", weight: 0.13 },
  { key: "compliance", label: "Compliance & Guideline Rule Violations", weight: 0.12 },
];

export const RISK_DISCLAIMER =
  "Potential anomaly requiring human verification. This score does not establish fraud.";

function tierFromScore(score: number): RiskTier {
  if (score >= 80) return "Critical";
  if (score >= 65) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function verdict(score: number): SignalDetail["verdict"] {
  if (score >= 70) return "Flagged";
  if (score >= 45) return "Watch";
  return "Normal";
}

function buildSignals(
  rand: () => number,
  tier: RiskTier,
  w: { sanctionedLakh: number; spentLakh: number; physicalProgress: number; delayDays: number; agency: string; workType: string },
): SignalDetail[] {
  const base = tier === "Critical" ? 72 : tier === "High" ? 58 : tier === "Medium" ? 40 : 20;
  const jitter = () => Math.max(4, Math.min(98, Math.round(base + (rand() - 0.4) * 45)));

  const fin = Math.round((w.spentLakh / w.sanctionedLakh) * 100);
  const gap = fin - w.physicalProgress;
  const peerMedian = Math.round(w.sanctionedLakh * (0.7 + rand() * 0.15));
  const iqrHigh = Math.round(peerMedian * 1.35);
  const simPct = Math.round(45 + rand() * 50);

  const scores: Record<string, number> = {
    cost: jitter(),
    timeline: Math.max(5, Math.min(98, Math.round(w.delayDays / 4 + rand() * 20))),
    mismatch: Math.max(5, Math.min(98, Math.round(gap * 1.6 + 15))),
    duplicate: tier === "Low" ? Math.round(10 + rand() * 25) : jitter(),
    agency: jitter(),
    compliance: jitter(),
  };

  const evidence: Record<string, string[]> = {
    cost: [
      `Sanctioned cost ₹${w.sanctionedLakh} lakh vs peer median ₹${peerMedian} lakh for ${w.workType}.`,
      `Peer IQR upper bound ₹${iqrHigh} lakh — this work sits ${w.sanctionedLakh > iqrHigh ? "above" : "within"} the fence.`,
      `Unit-cost deviation: ${Math.round(((w.sanctionedLakh - peerMedian) / peerMedian) * 100)}% vs district benchmark.`,
    ],
    timeline: [
      `${w.delayDays} days past the sanctioned completion milestone.`,
      `Median completion for this work type in the district is ${180 + Math.round(rand() * 120)} days.`,
      `No revised timeline uploaded on the monitoring portal.`,
    ],
    mismatch: [
      `${fin}% of funds disbursed against ${w.physicalProgress}% verified physical progress.`,
      `Disbursement-progress gap of ${gap} percentage points.`,
      `Last geo-tagged site photograph is ${20 + Math.round(rand() * 160)} days old.`,
    ],
    duplicate: [
      `${simPct}% semantic similarity with a nearby sanctioned work description.`,
      `Nearest candidate duplicate is ${Math.round(30 + rand() * 900)} m away.`,
      `Sanction windows overlap by ${Math.round(rand() * 90)} days.`,
    ],
    agency: [
      `${w.agency} carries a ${Math.round(35 + rand() * 55)}% historical delay frequency.`,
      `${Math.round(rand() * 12)} works by this agency currently flagged Critical or High.`,
      `Average cost escalation across its portfolio: ${Math.round(rand() * 28)}%.`,
    ],
    compliance: [
      `Utilisation certificate pending beyond the permitted window.`,
      `Work category requires prior district-level technical sanction — record not found.`,
      `Third instalment released before ${Math.round(50 + rand() * 20)}% progress certification.`,
    ],
  };

  return SIGNAL_META.map((m) => {
    const list = evidence[m.key] as string[];
    const score = scores[m.key] ?? 20;
    return {
      key: m.key,
      label: m.label,
      weight: m.weight,
      score,
      verdict: verdict(score),
      headline: list[0] as string,
      evidence: list,
    };
  });
}


function scoreForTier(tier: RiskTier, rand: () => number): number {
  if (tier === "Critical") return 80 + Math.round(rand() * 19);
  if (tier === "High") return 65 + Math.round(rand() * 14);
  if (tier === "Medium") return 45 + Math.round(rand() * 19);
  return 5 + Math.round(rand() * 39);
}

function buildWorks(): Work[] {
  const rand = mulberry32(26102);
  const tierPlan: RiskTier[] = [];
  (Object.keys(TIER_COUNTS) as RiskTier[]).forEach((t) => {
    for (let i = 0; i < TIER_COUNTS[t]; i++) tierPlan.push(t);
  });
  // deterministic shuffle
  for (let i = tierPlan.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tierPlan[i], tierPlan[j]] = [tierPlan[j], tierPlan[i]];
  }

  return tierPlan.map((tier, i) => {
    const st = STATES[Math.floor(rand() * STATES.length)];
    const district = st.districts[Math.floor(rand() * st.districts.length)];
    const workType = WORK_TYPES[Math.floor(rand() * WORK_TYPES.length)];
    const agency = AGENCIES[Math.floor(rand() * AGENCIES.length)];
    const sanctionedLakh = Math.round((8 + rand() * 92) * 10) / 10;

    const riskScore = scoreForTier(tier, rand);
    const physicalProgress =
      tier === "Critical"
        ? Math.round(rand() * 45)
        : tier === "High"
          ? Math.round(20 + rand() * 45)
          : Math.round(40 + rand() * 60);
    const finProgress = Math.min(
      100,
      physicalProgress + (tier === "Critical" ? 30 + Math.round(rand() * 25) : tier === "High" ? 15 + Math.round(rand() * 20) : Math.round(rand() * 12)),
    );
    const spentLakh = Math.round(sanctionedLakh * (finProgress / 100) * 10) / 10;
    const delayDays =
      tier === "Critical" ? 180 + Math.round(rand() * 400) : tier === "High" ? 60 + Math.round(rand() * 220) : Math.round(rand() * 90);

    const sYear = 2022 + Math.floor(rand() * 3);
    const sMonth = 1 + Math.floor(rand() * 12);
    const sDay = 1 + Math.floor(rand() * 28);
    const sanctionDate = `${sYear}-${String(sMonth).padStart(2, "0")}-${String(sDay).padStart(2, "0")}`;
    const dueDate = `${sYear + 1}-${String(sMonth).padStart(2, "0")}-${String(sDay).padStart(2, "0")}`;

    const id = `MP-${String(10000 + i)}`;
    const base = {
      sanctionedLakh,
      spentLakh,
      physicalProgress,
      delayDays,
      agency,
      workType,
    };

    return {
      id,
      name: `${workType} at ${district} Ward ${1 + Math.floor(rand() * 40)}`,
      workType,
      state: st.state,
      district,
      constituency: `${district} ${["North", "South", "East", "West", "Central"][Math.floor(rand() * 5)]}`,
      agency,
      sanctionedLakh,
      spentLakh,
      physicalProgress,
      financialProgress: finProgress,
      sanctionDate,
      dueDate,
      delayDays,
      riskScore,
      tier,
      confidence: 62 + Math.round(rand() * 36),
      dataQuality: 55 + Math.round(rand() * 44),
      lat: st.lat + (rand() - 0.5) * 2.2,
      lng: st.lng + (rand() - 0.5) * 2.2,
      signals: buildSignals(rand, tier, base),
    } satisfies Work;
  });
}

let _works: Work[] | null = null;
export function getWorks(): Work[] {
  if (!_works) _works = buildWorks();
  return _works;
}

export function getWork(id: string): Work | undefined {
  return getWorks().find((w) => w.id === id);
}

export function getFlaggedWorks(): Work[] {
  return getWorks()
    .filter((w) => w.tier === "Critical" || w.tier === "High")
    .sort((a, b) => b.riskScore - a.riskScore);
}

export function getDistrictRollups(): DistrictRollup[] {
  const map = new Map<string, DistrictRollup>();
  for (const w of getWorks()) {
    const key = `${w.state}|${w.district}`;
    let d = map.get(key);
    if (!d) {
      d = {
        district: w.district,
        state: w.state,
        lat: w.lat,
        lng: w.lng,
        total: 0,
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        avgRisk: 0,
      };
      map.set(key, d);
    }
    d.total++;
    if (w.tier === "Critical") d.critical++;
    else if (w.tier === "High") d.high++;
    else if (w.tier === "Medium") d.medium++;
    else d.low++;
    d.avgRisk += w.riskScore;
  }
  return [...map.values()]
    .map((d) => ({ ...d, avgRisk: Math.round(d.avgRisk / d.total) }))
    .sort((a, b) => b.critical - a.critical);
}

export function getStateRollups() {
  const map = new Map<string, { state: string; total: number; critical: number; high: number; avgRisk: number }>();
  for (const w of getWorks()) {
    let s = map.get(w.state);
    if (!s) {
      s = { state: w.state, total: 0, critical: 0, high: 0, avgRisk: 0 };
      map.set(w.state, s);
    }
    s.total++;
    if (w.tier === "Critical") s.critical++;
    if (w.tier === "High") s.high++;
    s.avgRisk += w.riskScore;
  }
  return [...map.values()]
    .map((s) => ({ ...s, avgRisk: Math.round(s.avgRisk / s.total) }))
    .sort((a, b) => b.avgRisk - a.avgRisk);
}

export function getAgencyRollups(): AgencyRollup[] {
  const rand = mulberry32(4242);
  const map = new Map<string, { works: number; delay: number; delayed: number; flagged: number; completed: number; risk: number }>();
  for (const w of getWorks()) {
    let a = map.get(w.agency);
    if (!a) {
      a = { works: 0, delay: 0, delayed: 0, flagged: 0, completed: 0, risk: 0 };
      map.set(w.agency, a);
    }
    a.works++;
    a.delay += w.delayDays;
    if (w.delayDays > 60) a.delayed++;
    if (w.tier === "Critical" || w.tier === "High") a.flagged++;
    if (w.physicalProgress >= 100) a.completed++;
    a.risk += w.riskScore;
  }
  return [...map.entries()]
    .map(([name, a]) => ({
      name,
      works: a.works,
      completed: a.completed + Math.round(a.works * 0.25 * rand()),
      completionRate: Math.round(((a.completed + a.works * 0.22) / a.works) * 100),
      avgDelayDays: Math.round(a.delay / a.works),
      delayFrequency: Math.round((a.delayed / a.works) * 100),
      behaviourScore: Math.round(a.risk / a.works),
      flagged: a.flagged,
    }))
    .sort((x, y) => y.behaviourScore - x.behaviourScore);
}

export interface DuplicatePair {
  id: string;
  a: Work;
  b: Work;
  similarity: number;
  distanceM: number;
  sanctionOverlapDays: number;
  photoVerification: "Identical photos detected" | "Photos differ" | "No photo uploaded";
  verdict: "Probable duplicate" | "Possible ghost work" | "Needs field check";
}

export function getDuplicatePairs(): DuplicatePair[] {
  const rand = mulberry32(909);
  const flagged = getFlaggedWorks();
  const pairs: DuplicatePair[] = [];
  for (let i = 0; i < 24; i++) {
    const a = flagged[i * 3];
    const b = flagged.find((w, idx) => idx > i * 3 && w.district === a.district && w.workType === a.workType);
    if (!a || !b) continue;
    const sim = Math.round(78 + rand() * 21);
    pairs.push({
      id: `DUP-${100 + i}`,
      a,
      b,
      similarity: sim,
      distanceM: Math.round(5 + rand() * 700),
      sanctionOverlapDays: Math.round(rand() * 120),
      photoVerification:
        sim > 92 ? "Identical photos detected" : rand() > 0.5 ? "No photo uploaded" : "Photos differ",
      verdict: sim > 93 ? "Probable duplicate" : sim > 86 ? "Possible ghost work" : "Needs field check",
    });
  }
  return pairs;
}

export function getPeers(work: Work): Work[] {
  return getWorks()
    .filter((w) => w.id !== work.id && w.workType === work.workType && w.state === work.state)
    .slice(0, 6);
}

export function portfolioTotals() {
  const works = getWorks();
  let sanctioned = 0;
  let spent = 0;
  for (const w of works) {
    sanctioned += w.sanctionedLakh;
    spent += w.spentLakh;
  }
  return {
    sanctionedCr: Math.round(sanctioned / 100),
    spentCr: Math.round(spent / 100),
    utilisation: Math.round((spent / sanctioned) * 100),
  };
}

export function mismatchAlerts(limit = 8) {
  return getWorks()
    .filter((w) => w.financialProgress - w.physicalProgress > 35)
    .sort((a, b) => b.financialProgress - b.physicalProgress - (a.financialProgress - a.physicalProgress))
    .slice(0, limit);
}

export const tierColor: Record<RiskTier, string> = {
  Critical: "var(--risk-critical)",
  High: "var(--risk-high)",
  Medium: "var(--risk-medium)",
  Low: "var(--risk-low)",
};

export const tierClass: Record<RiskTier, string> = {
  Critical: "bg-[var(--risk-critical)]/12 text-[var(--risk-critical)] border-[var(--risk-critical)]/35",
  High: "bg-[var(--risk-high)]/12 text-[var(--risk-high)] border-[var(--risk-high)]/35",
  Medium: "bg-[var(--risk-medium)]/15 text-[var(--risk-medium)] border-[var(--risk-medium)]/35",
  Low: "bg-[var(--risk-low)]/12 text-[var(--risk-low)] border-[var(--risk-low)]/35",
};
