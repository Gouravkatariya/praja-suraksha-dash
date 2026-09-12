// Typed fetch client for the FastAPI backend (P0 contract).

export interface DataQuality {
  score: number | null;
  scale: string;
  interpretation: string;
  is_risk_score: false;
  basis_fields: string[];
}

export interface Priority {
  flag_count: number;
  highest_risk_level: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN" | null;
  real_detector_count: number;
  synthetic_detector_count: number;
}

export interface WorkListItem {
  work_id: number;
  unique_work_number: string | null;
  work_description: string | null;
  mp_name: string | null;
  category: string | null;
  state: string | null;
  constituency: string | null;
  ida: string | null;
  city: string | null;
  status: string | null;
  ida_approval: string | null;
  house: string | null;
  recommended_date: string | null;
  allocation_amount: number | null;
  data_quality: DataQuality;
  priority: Priority;
  real_risk_types: string[];
  synthetic_risk_types: string[];
}

export interface RiskFlagEvidence {
  signal: string;
  value?: number | null;
  threshold?: number;
  reference_date?: string;
  explanation: string;
  source_fields: string[];
}

export interface RiskFlag {
  id: number;
  work_id: number;
  risk_type: string;
  risk_flag: string | null;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  signal_origin: "REAL_MPLADS_RULE" | "SYNTHETIC_VALIDATION" | "UNKNOWN";
  days_pending: number | null;
  recommended_date: string | null;
  status: string | null;
  ida_approval: string | null;
  detected_on: string;
  requires_human_verification: true;
  rule: Record<string, unknown>;
  evidence: RiskFlagEvidence[];
}

export interface WorkDetail extends WorkListItem {
  ward: string | null;
  block: string | null;
  village: string | null;
  sanction_date: string | null;
  expected_completion_date: string | null;
  actual_completion_date: string | null;
  actual_expenditure: number | null;
  field_origins: Record<string, string>;
  risk_flags: RiskFlag[];
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface WorksResponse {
  data: WorkListItem[];
  pagination: Pagination;
}

export interface RiskFlagsForWorkResponse {
  work_id: number;
  work: Pick<WorkListItem, "work_id" | "unique_work_number" | "work_description" | "status" | "ida_approval" | "recommended_date" | "data_quality" | "priority">;
  risk_flags: RiskFlag[];
  requires_human_verification: true;
  disclaimer: string;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  service: string;
  api_version: string;
  database: "connected" | "disconnected";
}

function b(endpoint: string) {
  return endpoint.replace(/\/$/, "");
}

async function apiFetch<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json() as Promise<T>;
}

export interface WorksParams {
  page?: number;
  page_size?: number;
  state?: string;
  category?: string;
  status?: string;
  ida_approval?: string;
  constituency?: string;
  house?: string;
  q?: string;
  has_risk_flag?: boolean;
}

export function fetchHealth(endpoint: string): Promise<HealthResponse> {
  return apiFetch(`${b(endpoint)}/health`);
}

export function fetchWorks(endpoint: string, params: WorksParams = {}): Promise<WorksResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.page_size) qs.set("page_size", String(params.page_size));
  if (params.state) qs.set("state", params.state);
  if (params.category) qs.set("category", params.category);
  if (params.status) qs.set("status", params.status);
  if (params.ida_approval) qs.set("ida_approval", params.ida_approval);
  if (params.constituency) qs.set("constituency", params.constituency);
  if (params.house) qs.set("house", params.house);
  if (params.q) qs.set("q", params.q);
  if (params.has_risk_flag !== undefined) qs.set("has_risk_flag", String(params.has_risk_flag));
  const query = qs.toString();
  return apiFetch(`${b(endpoint)}/api/v1/works${query ? `?${query}` : ""}`);
}

export function fetchWorkDetail(endpoint: string, workId: number): Promise<WorkDetail> {
  return apiFetch(`${b(endpoint)}/api/v1/works/${workId}`);
}

export function fetchRiskFlagsForWork(endpoint: string, workId: number): Promise<RiskFlagsForWorkResponse> {
  return apiFetch(`${b(endpoint)}/api/v1/risk-flags/${workId}`);
}
