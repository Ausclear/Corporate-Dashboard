// AusClear Premium palette
export const GOLD = "#c9a84c";
export const GOLD_DIM = "rgba(201,168,76,0.15)";
export const GOLD_BORDER = "rgba(201,168,76,0.25)";
export const BG = "#07070a";
export const CARD = "#202028";
export const INPUT = "#16161c";
export const TEXT = "#e8e6e1";
export const TEXT2 = "#9a9898";
export const MUTED = "#6b6969";
export const BORDER = "rgba(255,255,255,0.06)";
export const GREEN = "#27ae60";
export const GREEN_DIM = "rgba(39,174,96,0.12)";
export const AMBER = "#e67e22";
export const AMBER_DIM = "rgba(230,126,34,0.12)";
export const RED = "#c0392b";
export const RED_DIM = "rgba(192,57,43,0.12)";

export type PersonnelRecord = {
  id: number;
  name: string;
  clearance: "Baseline" | "NV1" | "NV2";
  status: "Active" | "Pending" | "Renewal";
  expiry: string;
  role: string;
};

export type ActivityRecord = {
  date: string;
  event: string;
  type: "application" | "granted" | "renewal" | "invoice";
};

export type InvoiceRecord = {
  id: string;
  date: string;
  amount: string;
  status: "Due" | "Paid" | "Overdue";
  due: string;
};

// Mock data — will be replaced with API calls
export const COMPANY = {
  name: "Sentinel Defence Solutions",
  abn: "45 123 456 789",
  clientRef: "CORP-2024-0047",
  contractStart: "15 Mar 2024",
  contractExpiry: "14 Mar 2025",
  status: "Active",
  sponsorshipTier: "Enterprise",
  totalSponsored: 24,
  activeBaseline: 8,
  activeNV1: 12,
  activeNV2: 4,
  pendingApplications: 3,
  monthlySpend: "$4,860",
};

export const PERSONNEL: PersonnelRecord[] = [
  { id: 1, name: "Sarah Mitchell", clearance: "NV2", status: "Active", expiry: "22 Nov 2038", role: "Program Director" },
  { id: 2, name: "David Chen", clearance: "NV1", status: "Active", expiry: "08 Jun 2036", role: "Systems Engineer" },
  { id: 3, name: "Emma Thompson", clearance: "NV1", status: "Active", expiry: "14 Jan 2037", role: "Project Manager" },
  { id: 4, name: "Michael O'Brien", clearance: "Baseline", status: "Active", expiry: "30 Sep 2039", role: "IT Support" },
  { id: 5, name: "Jessica Nguyen", clearance: "NV1", status: "Pending", expiry: "—", role: "Analyst" },
  { id: 6, name: "Andrew Walker", clearance: "NV2", status: "Active", expiry: "03 Apr 2035", role: "Operations Lead" },
  { id: 7, name: "Rachel Kim", clearance: "Baseline", status: "Active", expiry: "19 Aug 2040", role: "Admin Officer" },
  { id: 8, name: "Thomas Brown", clearance: "NV1", status: "Renewal", expiry: "28 Feb 2026", role: "Security Consultant" },
  { id: 9, name: "Lisa Patel", clearance: "Baseline", status: "Active", expiry: "11 Dec 2039", role: "Finance Officer" },
  { id: 10, name: "James Wright", clearance: "NV1", status: "Pending", expiry: "—", role: "Contract Manager" },
];

export const ACTIVITY: ActivityRecord[] = [
  { date: "12 Apr 2026", event: "NV1 application submitted for Jessica Nguyen", type: "application" },
  { date: "11 Apr 2026", event: "NV1 application submitted for James Wright", type: "application" },
  { date: "10 Apr 2026", event: "Clearance granted — David Chen (NV1)", type: "granted" },
  { date: "08 Apr 2026", event: "Renewal notice sent — Thomas Brown (NV1)", type: "renewal" },
  { date: "05 Apr 2026", event: "Security briefing completed — Andrew Walker", type: "application" },
  { date: "01 Apr 2026", event: "Monthly invoice generated — $4,860.00", type: "invoice" },
  { date: "28 Mar 2026", event: "New nomination received — Lisa Patel (Baseline)", type: "application" },
  { date: "25 Mar 2026", event: "Clearance renewed — Sarah Mitchell (NV2)", type: "granted" },
];

export const INVOICES: InvoiceRecord[] = [
  { id: "INV-2026-04", date: "01 Apr 2026", amount: "$4,860.00", status: "Due", due: "30 Apr 2026" },
  { id: "INV-2026-03", date: "01 Mar 2026", amount: "$4,620.00", status: "Paid", due: "31 Mar 2026" },
  { id: "INV-2026-02", date: "01 Feb 2026", amount: "$4,620.00", status: "Paid", due: "28 Feb 2026" },
  { id: "INV-2026-01", date: "01 Jan 2026", amount: "$4,380.00", status: "Paid", due: "31 Jan 2026" },
];

// Colour helpers
export const clearanceColour = (c: string) => c === "NV2" ? GOLD : c === "NV1" ? "#7eb8da" : TEXT2;
export const statusColour = (s: string) => s === "Active" ? GREEN : s === "Pending" ? AMBER : s === "Renewal" ? "#9b59b6" : RED;
export const statusBg = (s: string) => s === "Active" ? GREEN_DIM : s === "Pending" ? AMBER_DIM : s === "Renewal" ? "rgba(155,89,182,0.12)" : RED_DIM;
export const activityIcon = (t: string) => t === "granted" ? GREEN : t === "application" ? GOLD : t === "renewal" ? AMBER : TEXT2;
