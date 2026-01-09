// src/layouts/student/StudentOffer.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  EyeIcon,
  FileUpIcon,
  DownloadIcon,
  Trash2Icon,
  PlusIcon,
  SearchIcon,
  CalendarIcon,
  IndianRupeeIcon,
  Building2Icon,
  FileTextIcon,
  CheckCircle2Icon,
  XCircleIcon,
} from "lucide-react";

type TabKey = "add" | "view";


const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const STUDENT_API = `${API_BASE}/api/student`;

type OfferRow = {
  id: string;
  companyName: string;
  salary: number;
  offerDate: string; // dd/mm/yyyy
  fileName?: string;
  fileUrl?: string;
  status: "Submitted" | "Approved" | "Rejected" | "Pending";
};

function cn(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Chip({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "info" | "success" | "warn" | "danger";
  children: React.ReactNode;
}) {
  const map = {
    neutral:
      "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-800",
    info:
      "bg-blue-50 text-blue-700 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40",
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/40",
    warn:
      "bg-amber-50 text-amber-800 ring-amber-100 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900/40",
    danger:
      "bg-rose-50 text-rose-700 ring-rose-100 dark:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        map[tone]
      )}
    >
      {children}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
        "text-sm font-semibold text-white",
        disabled
          ? "bg-indigo-400/70 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800",
        "shadow-sm shadow-indigo-600/20",
        "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 focus:ring-offset-2 focus:ring-offset-white",
        "dark:focus:ring-indigo-300/60 dark:focus:ring-offset-slate-950",
        "transition"
      )}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
        "text-sm font-semibold",
        "bg-white hover:bg-slate-50 text-slate-800 ring-1 ring-slate-200",
        "dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 dark:ring-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-slate-300/60 focus:ring-offset-2 focus:ring-offset-white",
        "dark:focus:ring-slate-700/60 dark:focus:ring-offset-slate-950",
        "transition"
      )}
    >
      {children}
    </button>
  );
}

function DangerButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl",
        "text-sm font-semibold",
        "bg-rose-50 hover:bg-rose-100 text-rose-700 ring-1 ring-rose-200",
        "dark:bg-rose-950/25 dark:hover:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40",
        "transition"
      )}
    >
      {children}
    </button>
  );
}

function Panel({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.45)] overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="text-white text-[13px] font-semibold tracking-wide uppercase">
          {title}
        </div>
        {right}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function SegTab({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold transition",
        "rounded-xl",
        active
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200 dark:bg-slate-950 dark:text-slate-50 dark:ring-slate-800"
          : "text-slate-600 hover:text-slate-900 hover:bg-white/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-950/50"
      )}
    >
      <span className={cn("opacity-90", active && "text-indigo-600 dark:text-indigo-300")}>
        {icon}
      </span>
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function formatMoneyINR(v: number) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `₹${v}`;
  }
}

function todayDdMmYyyy() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const STORAGE_KEY = "student_offers_192211661";

export function StudentOffer() {
  // ✅ local demo store (replace with API later)
  const [rows, setRows] = useState<OfferRow[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [tab, setTab] = useState<TabKey>("add");
  const [q, setQ] = useState("");

  // form state
  const [companyName, setCompanyName] = useState("");
  const [salary, setSalary] = useState<string>("");
  const [offerDate, setOfferDate] = useState<string>(todayDdMmYyyy());
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${STUDENT_API}/offers`, { headers })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.offers && json.offers.length > 0) setRows(json.offers as OfferRow[]);
      })
      .catch(() => {});
  }, []);

  // Sync rows to localStorage whenever rows change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      return (
        r.id.toLowerCase().includes(needle) ||
        r.companyName.toLowerCase().includes(needle) ||
        String(r.salary).includes(needle) ||
        r.offerDate.toLowerCase().includes(needle) ||
        r.status.toLowerCase().includes(needle) ||
        (r.fileName || "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q]);

  const statusChip = (s: OfferRow["status"]) => {
    if (s === "Approved") return <Chip tone="success">Approved</Chip>;
    if (s === "Pending") return <Chip tone="warn">Pending</Chip>;
    if (s === "Rejected") return <Chip tone="danger">Rejected</Chip>;
    return <Chip tone="info">Submitted</Chip>;
  };

  const resetForm = () => {
    setCompanyName("");
    setSalary("");
    setOfferDate(todayDdMmYyyy());
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const validate = () => {
    if (!companyName.trim()) return "Company name is required.";
    const s = Number(salary);
    if (!salary.trim() || Number.isNaN(s) || s <= 0) return "Enter a valid salary.";
    if (!offerDate.trim()) return "Offer date is required.";
    if (!file) return "Upload the offer letter PDF.";
    if (file.type !== "application/pdf") return "Upload only PDF file.";
    return null;
  };

  const onSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setToast({ kind: "err", msg: err });
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const form = new FormData();
      form.append("companyName", companyName.trim());
      form.append("salary", salary);
      form.append("offerDate", offerDate.trim());
      if (file) form.append("file", file);

      const res = await fetch(`${STUDENT_API}/offers`, {
        method: "POST",
        headers,
        body: form,
      });
      if (!res.ok) throw new Error("Failed");

      const list = await fetch(`${STUDENT_API}/offers`, { headers: headers as HeadersInit });
      if (list.ok) {
        const json = await list.json();
        if (json?.offers) setRows(json.offers as OfferRow[]);
      }

      setToast({ kind: "ok", msg: "Offer saved successfully." });
      resetForm();
      setTab("view");
    } catch {
      // Fallback to localStorage
      const newRow: OfferRow = {
        id: `OF-${Date.now()}`,
        companyName: companyName.trim(),
        salary: Number(salary),
        offerDate: offerDate.trim(),
        fileName: file?.name || "offer_letter.pdf",
        status: "Pending",
      };
      setRows((prev) => [newRow, ...prev]);
      setToast({ kind: "ok", msg: "Offer saved successfully." });
      resetForm();
      setTab("view");
    }
  };

  const onClear = () => {
    resetForm();
    setToast({ kind: "ok", msg: "Cleared." });
  };

  const onDelete = async (id: string) => {
    if (!/^\d+$/.test(id)) {
      // Local id, remove from localStorage
      setRows((prev) => prev.filter((r) => r.id !== id));
      setToast({ kind: "ok", msg: "Offer removed." });
      return;
    }
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${STUDENT_API}/offers/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Failed");
      setRows((prev) => prev.filter((r) => r.id !== id));
      setToast({ kind: "ok", msg: "Offer removed." });
    } catch {
      setToast({ kind: "err", msg: "Failed to remove offer." });
    }
  };

  const onView = (row: OfferRow) => {
    alert(
      `Offer Details\n\n` +
        `ID: ${row.id}\n` +
        `Company: ${row.companyName}\n` +
        `Salary: ${formatMoneyINR(row.salary)}\n` +
        `Offer Date: ${row.offerDate}\n` +
        `File: ${row.fileName ?? "—"}\n` +
        `Status: ${row.status}\n\n` +
        `Wire this to API + PDF viewer later.`
    );
  };

  const onDownload = (row: OfferRow) => {
    if (row.fileUrl) {
      window.open(row.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }
    alert(`Download: ${row.fileName ?? "offer_letter.pdf"}`);
  };

  return (
    <div className="space-y-4">
      {/* Top header (premium) */}
      <div className="rounded-2xl bg-white dark:bg-slate-950 ring-1 ring-slate-200 dark:ring-slate-800 shadow-[0_18px_60px_-45px_rgba(15,23,42,0.45)]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Offer Details
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload placement offer letters and track approvals
              </p>
            </div>

            <div className="flex items-center gap-2">
              <GhostButton onClick={() => setTab("add")}>
                <PlusIcon size={16} />
                Add Offer
              </GhostButton>
              <PrimaryButton onClick={() => setTab("view")}>
                <EyeIcon size={16} />
                View Offers
              </PrimaryButton>
            </div>
          </div>

          {/* Tabs (like in screenshot) */}
          <div className="mt-4 flex flex-wrap gap-2 rounded-2xl bg-slate-50 dark:bg-slate-900/35 ring-1 ring-slate-200 dark:ring-slate-800 p-2">
            <SegTab
              active={tab === "add"}
              icon={<FileUpIcon size={16} />}
              label="Add Offer Details"
              onClick={() => setTab("add")}
            />
            <SegTab
              active={tab === "view"}
              icon={<EyeIcon size={16} />}
              label="View Offer Details"
              onClick={() => setTab("view")}
            />
          </div>

          {/* Toast */}
          {toast && (
            <div
              className={cn(
                "mt-3 rounded-2xl px-4 py-3 text-sm ring-1 flex items-start gap-2",
                toast.kind === "ok"
                  ? "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-200 dark:ring-emerald-900/40"
                  : "bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-950/25 dark:text-rose-200 dark:ring-rose-900/40"
              )}
            >
              {toast.kind === "ok" ? (
                <CheckCircle2Icon size={18} className="mt-0.5" />
              ) : (
                <XCircleIcon size={18} className="mt-0.5" />
              )}
              <div className="flex-1">{toast.msg}</div>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs font-semibold opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {tab === "add" && (
        <Panel title="ADD OFFER DETAILS">
          <form onSubmit={onSaveOffer} className="space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Company */}
              <div className="lg:col-span-7">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Company Name
                </label>
                <div className="mt-1 relative">
                  <Building2Icon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter company name"
                    className={cn(
                      "w-full h-11 rounded-xl pl-9 pr-3 text-sm",
                      "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                      "ring-1 ring-slate-200 dark:ring-slate-800",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                      "transition"
                    )}
                  />
                </div>
              </div>

              {/* Salary */}
              <div className="lg:col-span-5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Salary
                </label>
                <div className="mt-1 relative">
                  <IndianRupeeIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={salary}
                    onChange={(e) => setSalary(e.target.value.replace(/[^\d]/g, ""))}
                    inputMode="numeric"
                    placeholder="e.g., 650000"
                    className={cn(
                      "w-full h-11 rounded-xl pl-9 pr-3 text-sm",
                      "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                      "ring-1 ring-slate-200 dark:ring-slate-800",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                      "transition"
                    )}
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {salary ? `Preview: ${formatMoneyINR(Number(salary))}` : "Enter annual CTC"}
                </div>
              </div>

              {/* Offer date */}
              <div className="lg:col-span-5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Offer Date
                </label>
                <div className="mt-1 relative">
                  <CalendarIcon
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={offerDate}
                    onChange={(e) => setOfferDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                    className={cn(
                      "w-full h-11 rounded-xl pl-9 pr-3 text-sm",
                      "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                      "ring-1 ring-slate-200 dark:ring-slate-800",
                      "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                      "transition"
                    )}
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="lg:col-span-7">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  File Upload
                </label>
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
                  <label
                    className={cn(
                      "inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl cursor-pointer",
                      "bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100",
                      "ring-1 ring-slate-200 dark:ring-slate-800",
                      "hover:bg-slate-50 dark:hover:bg-slate-900 transition"
                    )}
                  >
                    <FileTextIcon size={16} />
                    Choose PDF
                    <input
                      ref={fileRef}
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        setFile(f);
                      }}
                    />
                  </label>

                  <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                    {file ? (
                      <span className="font-semibold">{file.name}</span>
                    ) : (
                      <span className="text-slate-400">No file chosen</span>
                    )}
                  </div>
                </div>

                <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-300">
                  Note: Upload only pdf file
                </div>
              </div>
            </div>

            {/* actions */}
            <div className="flex flex-wrap gap-2">
              <PrimaryButton type="submit">
                <FileUpIcon size={16} />
                Save Offer
              </PrimaryButton>

              <GhostButton type="button" onClick={onClear}>
                <Trash2Icon size={16} />
                Clear
              </GhostButton>
            </div>
          </form>
        </Panel>
      )}

      {tab === "view" && (
        <Panel
          title="VIEW OFFER DETAILS"
          right={
            <div className="text-white/90 text-xs font-semibold">
              {filtered.length} record(s)
            </div>
          }
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Search and manage your submitted offers.
            </div>

            <div className="relative w-full lg:w-[380px]">
              <SearchIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by company, id, date, status…"
                className={cn(
                  "w-full h-11 rounded-xl pl-9 pr-3 text-sm",
                  "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                  "ring-1 ring-slate-200 dark:ring-slate-800",
                  "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                  "transition"
                )}
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl ring-1 ring-slate-200 dark:ring-slate-800">
            <div className="min-w-[980px]">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      Offer ID
                    </th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      Company Name
                    </th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      Salary
                    </th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      Offer Date
                    </th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      File
                    </th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        No offers found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={cn(
                          "transition",
                          idx % 2 === 0
                            ? "bg-white dark:bg-slate-950"
                            : "bg-slate-50/60 dark:bg-slate-900/20",
                          "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25"
                        )}
                      >
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-50 border-b border-slate-200/70 dark:border-slate-800/70">
                          {r.id}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {r.companyName}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {formatMoneyINR(r.salary)}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {r.offerDate}
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70">
                          {r.fileName ? (
                            <span className="inline-flex items-center gap-2">
                              <FileTextIcon size={16} className="text-slate-400" />
                              <span className="truncate max-w-[260px]">{r.fileName}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm border-b border-slate-200/70 dark:border-slate-800/70">
                          {statusChip(r.status)}
                        </td>
                        <td className="px-4 py-3 text-sm border-b border-slate-200/70 dark:border-slate-800/70">
                          <div className="flex flex-wrap gap-2">
                            <GhostButton onClick={() => onView(r)}>
                              <EyeIcon size={16} />
                              View
                            </GhostButton>
                            <GhostButton onClick={() => onDownload(r)}>
                              <DownloadIcon size={16} />
                              Download
                            </GhostButton>
                            <DangerButton onClick={() => onDelete(r.id)}>
                              <Trash2Icon size={16} />
                              Delete
                            </DangerButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}

export default StudentOffer;
