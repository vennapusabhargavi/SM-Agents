/// <reference types="vite/client" />
import React, { useEffect, useMemo, useState } from "react";
import {
  PlusIcon,
  SearchIcon,
  ReceiptIcon,
  WalletIcon,
  BadgePercentIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XIcon,
  Trash2Icon,
  Edit3Icon,
  RefreshCwIcon,
  DownloadIcon,
  FilterIcon,
  BotIcon, // ✅ AI symbol
  MessageCircleIcon,
  PrinterIcon,
} from "lucide-react";
import { AIAssistantModal } from "../../components/ai/AIAssistantModal";

type DueStatus = "Pending" | "Paid" | "Overdue";
type PayMode = "Online" | "Cash" | "Card" | "UPI";

type DueRow = {
  id: string;
  feeType: string;
  amount: number;
  dueDate: string; // dd/mm/yyyy
  status: DueStatus;
};

type PaymentRow = {
  id: string;
  feeType: string;
  amount: number;
  mode: PayMode;
  reference: string;
  datedOn: string; // e.g., "Jun 27 2025 8:56PM"
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

function isoNow() {
  return new Date().toISOString();
}
function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
function safeParse<T>(s: string | null, fallback: T): T {
  try {
    if (!s) return fallback;
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
}
function fmtDt(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

function getAuthHeaders() {
  const token = localStorage.getItem("authToken");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as any;
}

async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${STUDENT_API}${path}`, {
    ...init,
    headers: { ...getAuthHeaders(), ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  return (await res.json()) as T;
}

// -------------------- Premium Panel --------------------
function Panel({
  title,
  tone = "navy",
  icon,
  right,
  children,
}: {
  title: string;
  tone?: "navy" | "steel" | "crimson";
  icon?: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  const header =
    tone === "navy"
      ? "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600"
      : tone === "steel"
      ? "bg-gradient-to-r from-slate-600 via-slate-500 to-slate-400"
      : "bg-gradient-to-r from-red-700 via-red-600 to-red-500";

  return (
    <div className="rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 backdrop-blur shadow-[0_8px_25px_-12px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col min-h-0">
      <div className={cn(header, "px-4 py-3 flex items-center justify-between")}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-2.5 w-2.5 rounded-full bg-white/90" />
          {icon}
          <div className="text-white font-semibold text-sm tracking-wide uppercase truncate">
            {title}
          </div>
        </div>
        <div className="flex items-center gap-2">{right}</div>
      </div>
      <div className="p-4 flex-1 min-h-0">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  icon,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ring-1",
        "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
        "dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900",
        active && "ring-2 ring-indigo-400/70 dark:ring-indigo-300/60"
      )}
    >
      {icon}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">{children}</div>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-xl px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-300 dark:ring-slate-700",
        "focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400",
        "transition",
        props.className
      )}
    />
  );
}
function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-xl px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "ring-1 ring-slate-300 dark:ring-slate-700",
        "focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400",
        "transition",
        props.className
      )}
    />
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
  leftIcon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition active:scale-[0.99]",
        "bg-slate-900 text-white hover:bg-slate-800",
        "dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {leftIcon}
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 h-10 px-4 rounded-xl text-sm font-semibold transition",
        "border border-slate-200 bg-white hover:bg-slate-50 text-slate-800",
        "dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100"
      )}
    >
      {children}
    </button>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">{title}</div>
              {subtitle && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</div>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800 grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition"
              aria-label="Close"
            >
              <XIcon size={16} />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Toast({
  msg,
  tone = "success",
  onClose,
}: {
  msg: string;
  tone?: "success" | "danger";
  onClose: () => void;
}) {
  return (
    <div className="fixed bottom-5 right-5 z-[95]">
      <div
        className={cn(
          "rounded-2xl shadow-xl px-4 py-3 ring-1 min-w-[280px]",
          tone === "success" ? "bg-emerald-700 text-white ring-white/10" : "bg-rose-700 text-white ring-white/10"
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <div className="h-8 w-8 rounded-xl bg-white/10 grid place-items-center">
              {tone === "success" ? <CheckCircle2Icon size={16} /> : <AlertTriangleIcon size={16} />}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{tone === "success" ? "Saved" : "Action Required"}</div>
            <div className="text-xs text-white/80 mt-0.5">{msg}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-xl hover:bg-white/10 grid place-items-center transition"
            aria-label="Close toast"
          >
            <XIcon size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------- CSV Export (demo) ---------------
function downloadCsv(filename: string, rows: Array<Record<string, any>>) {
  const headers = Object.keys(rows[0] ?? {});
  const escape = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// -------------------- Page --------------------
export const StudentFinancialRecord: React.FC = () => {
  const [dues, setDues] = useState<DueRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);

  const [loading, setLoading] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  const demoPayments: PaymentRow[] = useMemo(
    () => [
      { id: "p1", feeType: "AMENITY FEE", amount: 150000, mode: "Online", reference: "E2506270I8V9XO", datedOn: "Jun 27 2025 8:56PM" },
      { id: "p2", feeType: "AMENITY FEE", amount: 150000, mode: "Online", reference: "371537129", datedOn: "Jul 3 2024 10:59PM" },
      { id: "p3", feeType: "AMENITY FEE", amount: 150000, mode: "Online", reference: "55605181", datedOn: "Jun 16 2023 3:03PM" },
      { id: "p4", feeType: "COLLEGE COMMON BREAKAGE", amount: 200, mode: "Online", reference: "E2506090HDM7KC", datedOn: "Jun 9 2025 4:23PM" },
      { id: "p5", feeType: "COLLEGE COMMON BREAKAGE", amount: 100, mode: "Online", reference: "229401104", datedOn: "Feb 8 2024 9:50PM" },
      { id: "p6", feeType: "COLLEGE COMMON BREAKAGE", amount: 150, mode: "Online", reference: "176758977", datedOn: "Dec 1 2023 4:16PM" },
      { id: "p7", feeType: "COLLEGE COMMON BREAKAGE", amount: 100, mode: "Online", reference: "E2511280PWC47L", datedOn: "Nov 28 2025 9:56PM" },
      { id: "p8", feeType: "COLLEGE COMMON BREAKAGE", amount: 200, mode: "Online", reference: "53206272", datedOn: "Jun 14 2023 6:35PM" },
      { id: "p9", feeType: "COURSE STUDY MATERIAL FEES", amount: 1500, mode: "Online", reference: "55887093", datedOn: "Jun 16 2023 7:25PM" },
      { id: "p10", feeType: "COURSE STUDY MATERIAL FEES", amount: 1500, mode: "Online", reference: "405248040", datedOn: "Aug 12 2024 7:05AM" },
      { id: "p11", feeType: "COURSE STUDY MATERIAL FEES", amount: 1500, mode: "Online", reference: "290020623", datedOn: "Apr 5 2024 1:46AM" },
      { id: "p12", feeType: "COURSE STUDY MATERIAL FEES", amount: 650, mode: "Online", reference: "511447506", datedOn: "Dec 4 2024 11:37PM" },
      { id: "p13", feeType: "COURSE STUDY MATERIAL FEES", amount: 1500, mode: "Online", reference: "114184483", datedOn: "Sep 1 2023 4:35PM" },
      { id: "p14", feeType: "CULTURAL FEE", amount: 1500, mode: "Online", reference: "371541796", datedOn: "Jul 3 2024 11:07PM" },
      { id: "p15", feeType: "CULTURAL FEE", amount: 2500, mode: "Online", reference: "E2506270I8VI2D", datedOn: "Jun 27 2025 8:59PM" },
      { id: "p16", feeType: "EXAM FEES DUE", amount: 9000, mode: "Online", reference: "182810296", datedOn: "Dec 9 2023 10:44PM" },
    ],
    []
  );

  // Load dummy data
  useEffect(() => {
    const storedDues = localStorage.getItem('student_fees_dues');
    const storedPayments = localStorage.getItem('student_fees_payments');
    if (storedDues) {
      setDues(JSON.parse(storedDues));
    } else {
      const dummyDues: DueRow[] = [
        {
          id: "d1",
          feeType: "TUITION FEES",
          amount: 50000,
          dueDate: "15/01/2026",
          status: "Pending",
        },
        {
          id: "d2",
          feeType: "HOSTEL FEES",
          amount: 25000,
          dueDate: "20/01/2026",
          status: "Pending",
        },
        {
          id: "d3",
          feeType: "EXAMINATION FEES",
          amount: 5000,
          dueDate: "10/01/2026",
          status: "Overdue",
        },
        {
          id: "d4",
          feeType: "TRANSPORTATION FEES",
          amount: 3000,
          dueDate: "25/01/2026",
          status: "Pending",
        },
        {
          id: "d5",
          feeType: "LIBRARY FEES",
          amount: 1000,
          dueDate: "05/01/2026",
          status: "Paid",
        },
      ];
      setDues(dummyDues);
      localStorage.setItem('student_fees_dues', JSON.stringify(dummyDues));
    }

    if (storedPayments) {
      setPayments(JSON.parse(storedPayments));
    } else {
      setPayments(demoPayments);
      localStorage.setItem('student_fees_payments', JSON.stringify(demoPayments));
    }
    setLoading(false);
  }, []);

  // ---------- Toast ----------
  const [toast, setToast] = useState<{ msg: string; tone: "success" | "danger" } | null>(null);
  const showToast = (msg: string, tone: "success" | "danger" = "success") => {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 2600);
  };

  // ---------- Reload ----------
  const refreshFees = async () => {
    // Simulate reload - in real app would fetch fresh data
    showToast("Fees data refreshed", "success");
  };

  // ---------- Filters ----------
  const [q, setQ] = useState("");
  const baseSearch = q.trim().toLowerCase();

  // Payment History table controls
  const [paySortKey, setPaySortKey] = useState<"feeType" | "amount" | "mode" | "reference" | "datedOn">("feeType");
  const [paySortDir, setPaySortDir] = useState<"asc" | "desc">("asc");
  const [payPageSize, setPayPageSize] = useState<number>(10);
  const [paySearch, setPaySearch] = useState("");
  const [payPage, setPayPage] = useState(1);

  const payFiltered = useMemo(() => {
    const query = paySearch.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter((r) =>
      [r.feeType, String(r.amount), r.mode, r.reference, r.datedOn]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [payments, paySearch]);

  const paySorted = useMemo(() => {
    const arr = [...payFiltered];
    arr.sort((a, b) => {
      const va = a[paySortKey] as any;
      const vb = b[paySortKey] as any;
      if (paySortKey === "amount") return Number(va) - Number(vb);

      const sa = String(va).toLowerCase();
      const sb = String(vb).toLowerCase();
      if (sa === sb) return 0;
      return sa < sb ? -1 : 1;
    });
    return paySortDir === "asc" ? arr : arr.reverse();
  }, [payFiltered, paySortKey, paySortDir]);

  const payTotal = paySorted.length;
  const payTotalPages = Math.max(1, Math.ceil(payTotal / payPageSize));
  const paySafePage = Math.min(payPage, payTotalPages);

  const payPaged = useMemo(() => {
    const start = (paySafePage - 1) * payPageSize;
    return paySorted.slice(start, start + payPageSize);
  }, [paySorted, paySafePage, payPageSize]);

  useEffect(() => {
    setPayPage(1);
  }, [paySearch, payPageSize]);

  const dueTotal = useMemo(() => dues.reduce((sum, r) => sum + (r.status !== "Paid" ? r.amount : 0), 0), [dues]);

  const togglePaySort = (k: "feeType" | "amount" | "mode" | "reference" | "datedOn") => {
    if (paySortKey === k) setPaySortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setPaySortKey(k);
      setPaySortDir("asc");
    }
  };

  function toISOFromDMY(dmy: string): string {
    const m = dmy.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return "";
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  function Th({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) {
    return (
      <th
        onClick={onClick}
        className={cn(
          "px-3 py-2.5 text-left text-[13px] font-semibold",
          "text-slate-700 dark:text-slate-200",
          "border-b border-slate-200 dark:border-slate-800",
          "bg-white dark:bg-slate-900",
          onClick && "cursor-pointer select-none"
        )}
      >
        <span className="inline-flex items-center gap-1">{children}</span>
      </th>
    );
  }

  function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
      <td className={cn("px-3 py-3 text-[13px] text-slate-700 dark:text-slate-200", className)}>
        {children}
      </td>
    );
  }

  function SortIcon({
    active,
    dir,
  }: {
    active: boolean;
    dir: "asc" | "desc";
  }) {
    if (!active) return <PrinterIcon size={14} className="opacity-30" />;
    return dir === "asc" ? <PrinterIcon size={14} className="opacity-80" /> : <PrinterIcon size={14} className="opacity-80" />;
  }

  function DuePill({ s }: { s: DueStatus }) {
    const cls =
      s === "Paid"
        ? "bg-green-600"
        : s === "Overdue"
        ? "bg-red-600"
        : "bg-yellow-500";
    return (
      <span className={cn("inline-flex rounded-full px-3 py-1 text-[12px] font-semibold text-white", cls)}>
        {s}
      </span>
    );
  }

  function PrintPill({ onClick }: { onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 rounded-full",
          "bg-slate-600 hover:bg-slate-700",
          "text-white text-[12px] font-semibold",
          "px-3 py-1.5 transition shadow-sm"
        )}
      >
        <PrinterIcon size={14} />
        Print
      </button>
    );
  }

  function printReceipt(row: PaymentRow) {
    // simple demo: open a printable window
    const html = `
      <html>
        <head><title>Receipt</title></head>
        <body style="font-family: Arial, sans-serif; padding: 24px;">
          <h2>Payment Receipt</h2>
          <p><b>Fee Type:</b> ${row.feeType}</p>
          <p><b>Amount:</b> ${row.amount}</p>
          <p><b>Mode:</b> ${row.mode}</p>
          <p><b>Reference:</b> ${row.reference}</p>
          <p><b>Dated On:</b> ${row.datedOn}</p>
          <hr/>
          <p style="color:#64748b">Demo receipt print.</p>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const w = window.open("", "_blank", "width=720,height=720");
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  return (
    <div className="w-full space-y-4">
      {/* Title */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[28px] font-light text-slate-900 dark:text-slate-50 leading-none">Financial Record</div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            View your fees, dues, and payment history.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GhostBtn onClick={refreshFees}>
            <RefreshCwIcon size={16} />
            Reload
          </GhostBtn>
        </div>
      </div>

      {/* DUE LIST */}
      <Panel
        title="DUE LIST"
        tone="crimson"
        icon={<WalletIcon size={16} className="text-white/95" />}
        right={
          <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
            Total Due: ₹{fmtMoney(dueTotal)}
          </span>
        }
      >
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead>
                <tr>
                  <Th>
                    Fee Type
                  </Th>
                  <Th>
                    Amount
                  </Th>
                  <Th>
                    Due Date
                  </Th>
                  <Th>
                    Status
                  </Th>
                </tr>
              </thead>
              <tbody>
                {dues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-[13px] text-slate-600 dark:text-slate-300">
                      No data available in table
                    </td>
                  </tr>
                ) : (
                  dues.map((r) => (
                    <tr
                      key={r.id}
                      className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <Td>{r.feeType}</Td>
                      <Td>₹{fmtMoney(r.amount)}</Td>
                      <Td>{r.dueDate}</Td>
                      <Td><DuePill s={r.status} /></Td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Panel>

      {/* PAYMENT HISTORY */}
      <Panel
        title="PAYMENT HISTORY"
        tone="navy"
        icon={<ReceiptIcon size={16} className="text-white/95" />}
        right={
          <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-1 rounded-xl border border-white/30 text-white/95">
            Rows: {payTotal}
          </span>
        }
      >
        <div className="mb-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-2">
            <select
              value={payPageSize}
              onChange={(e) => setPayPageSize(Number(e.target.value))}
              className={cn(
                "rounded-lg border border-slate-200 dark:border-slate-800",
                "bg-white dark:bg-slate-900",
                "px-2 py-1.5 text-[13px]"
              )}
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="text-[13px] text-slate-700 dark:text-slate-200">
              records
            </span>
          </div>

          <div className="flex items-center gap-2 justify-start lg:justify-end">
            <span className="text-[13px] text-slate-700 dark:text-slate-200">
              Search:
            </span>
            <div className="relative">
              <input
                value={paySearch}
                onChange={(e) => setPaySearch(e.target.value)}
                className={cn(
                  "w-[220px] rounded-lg border border-slate-200 dark:border-slate-800",
                  "bg-white dark:bg-slate-900",
                  "pl-9 pr-3 py-2 text-[13px]",
                  "focus:outline-none focus:ring-2 focus:ring-slate-400/30 dark:focus:ring-slate-500/30"
                )}
                placeholder=""
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon size={16} />
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full border-collapse">
              <thead>
                <tr>
                  <Th onClick={() => togglePaySort("feeType")}>
                    Fee Type{" "}
                    <SortIcon active={paySortKey === "feeType"} dir={paySortDir} />
                  </Th>
                  <Th onClick={() => togglePaySort("amount")}>
                    Amount{" "}
                    <SortIcon active={paySortKey === "amount"} dir={paySortDir} />
                  </Th>
                  <Th onClick={() => togglePaySort("mode")}>
                    Mode of Payment{" "}
                    <SortIcon active={paySortKey === "mode"} dir={paySortDir} />
                  </Th>
                  <Th onClick={() => togglePaySort("reference")}>
                    Reference{" "}
                    <SortIcon active={paySortKey === "reference"} dir={paySortDir} />
                  </Th>
                  <Th onClick={() => togglePaySort("datedOn")}>
                    Dated On{" "}
                    <SortIcon active={paySortKey === "datedOn"} dir={paySortDir} />
                  </Th>
                  <Th>Action</Th>
                </tr>
              </thead>

              <tbody>
                {payPaged.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-200/70 dark:border-slate-800 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <Td>{r.feeType}</Td>
                    <Td>₹{fmtMoney(r.amount)}</Td>
                    <Td>{r.mode}</Td>
                    <Td>{r.reference}</Td>
                    <Td>{r.datedOn}</Td>
                    <Td>
                      <PrintPill onClick={() => printReceipt(r)} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
            <div className="text-[12px] text-slate-600 dark:text-slate-300">
              Showing{" "}
              <span className="font-semibold">
                {payTotal === 0 ? 0 : (paySafePage - 1) * payPageSize + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold">
                {Math.min(paySafePage * payPageSize, payTotal)}
              </span>{" "}
              of <span className="font-semibold">{payTotal}</span> entries
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPayPage(1)}
                disabled={paySafePage === 1}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                  "bg-white dark:bg-slate-900",
                  "ring-slate-200 dark:ring-slate-800",
                  "disabled:opacity-50"
                )}
              >
                First
              </button>
              <button
                type="button"
                onClick={() => setPayPage((p) => Math.max(1, p - 1))}
                disabled={paySafePage === 1}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                  "bg-white dark:bg-slate-900",
                  "ring-slate-200 dark:ring-slate-800",
                  "disabled:opacity-50"
                )}
              >
                Prev
              </button>

              <div className="text-[13px] text-slate-700 dark:text-slate-200">
                Page <span className="font-semibold">{paySafePage}</span> /{" "}
                <span className="font-semibold">{payTotalPages}</span>
              </div>

              <button
                type="button"
                onClick={() => setPayPage((p) => Math.min(payTotalPages, p + 1))}
                disabled={paySafePage === payTotalPages}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                  "bg-white dark:bg-slate-900",
                  "ring-slate-200 dark:ring-slate-800",
                  "disabled:opacity-50"
                )}
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => setPayPage(payTotalPages)}
                disabled={paySafePage === payTotalPages}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[13px] ring-1",
                  "bg-white dark:bg-slate-900",
                  "ring-slate-200 dark:ring-slate-800",
                  "disabled:opacity-50"
                )}
              >
                Last
              </button>
            </div>
          </div>
        </div>
      </Panel>

      {/* Floating Chatbot Button */}
      <button
        onClick={() => setIsChatbotOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-600 hover:bg-slate-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
        aria-label="Open Fees & Finance Chatbot"
      >
        <MessageCircleIcon size={24} />
      </button>

      {/* AI Assistant Modal */}
      <AIAssistantModal
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        context="fees"
        userRole="STUDENT"
      />

      {toast && <Toast msg={toast.msg} tone={toast.tone} onClose={() => setToast(null)} />}
    </div>
  );
};

export default StudentFinancialRecord;
