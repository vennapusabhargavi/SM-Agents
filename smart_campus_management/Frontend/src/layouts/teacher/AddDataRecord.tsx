// src/layouts/teacher/mou/AddDataRecord.tsx
import React, { useMemo, useRef, useState } from "react";

type PageKey = "MOU" | "MOA" | "NDA" | "OTHER";
type OrgType = "University" | "Industry";
type ScopeType = "National" | "International";

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="text-sm text-slate-700 dark:text-slate-200 text-right pr-3">
      <span className="whitespace-nowrap">{children}</span>
      {required && <span className="text-rose-500 ml-1">*</span>}
    </div>
  );
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-10 w-full rounded-none px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "border border-slate-200 dark:border-slate-800",
        "placeholder:text-slate-400 dark:placeholder:text-slate-500",
        "focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:focus:ring-teal-300/40",
        className
      )}
    />
  );
}

function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
}) {
  return (
    <select
      {...props}
      className={cn(
        "h-10 w-full rounded-none px-3 text-sm",
        "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
        "border border-slate-200 dark:border-slate-800",
        "focus:outline-none focus:ring-2 focus:ring-teal-500/40 dark:focus:ring-teal-300/40",
        className
      )}
    >
      {children}
    </select>
  );
}

function Radio({
  checked,
  onChange,
  label,
  name,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  name: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-teal-600"
      />
      {label}
    </label>
  );
}

function InlineError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div className="mt-1 text-xs text-rose-600 dark:text-rose-300">{msg}</div>;
}

export default function AddDataRecord() {
  const pages = useMemo(
    () =>
      [
        { key: "MOU", label: "MOU" },
        { key: "MOA", label: "MOA" },
        { key: "NDA", label: "NDA" },
        { key: "OTHER", label: "Other" },
      ] as Array<{ key: PageKey; label: string }>,
    []
  );

  const [page, setPage] = useState<PageKey>("MOU");
  const [dateOfSigning, setDateOfSigning] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");
  const [orgType, setOrgType] = useState<OrgType>("University");
  const [scope, setScope] = useState<ScopeType>("National");
  const [file, setFile] = useState<File | null>(null);

  const [touched, setTouched] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!dateOfSigning.trim()) e.dateOfSigning = "Date of Signing is required.";
    if (!orgName.trim()) e.orgName = "Name is required.";
    if (!file) e.file = "PDF file is required.";
    if (file) {
      const isPdf =
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!isPdf) e.file = "Upload only PDF file.";
      const max = 5 * 1024 * 1024;
      if (file.size > max) e.file = "Max file size is 5 MB.";
    }
    return e;
  }, [dateOfSigning, orgName, file]);

  const canSubmit = Object.keys(errors).length === 0;

  const onClear = () => {
    setTouched(false);
    setDateOfSigning("");
    setOrgName("");
    setOrgType("University");
    setScope("National");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setFlash("Cleared");
    window.setTimeout(() => setFlash(null), 1600);
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;

    // ✅ Demo-only: replace with API call later
    setFlash("Saved");
    window.setTimeout(() => setFlash(null), 2000);
  };

  return (
    <div className="w-full">
      {/* Title (top-left like screenshot) */}
      <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
        MOU
      </div>

      {/* Top row: Select Page + mandatory note */}
      <div className="mt-5 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-12 items-center gap-3">
            <div className="col-span-3 text-right text-sm text-slate-700 dark:text-slate-200 pr-3">
              Select Page
            </div>

            <div className="col-span-5">
              <Select value={page} onChange={(e) => setPage(e.target.value as PageKey)}>
                {pages.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="col-span-4 text-left">
              <div className="text-xs text-rose-500">
                Marked &quot;*&quot; are mandatory fields
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-200 dark:border-slate-800" />

          <div className="mt-3 text-center text-sm text-slate-800 dark:text-slate-100 font-semibold">
            Note: Please enter only if you have organised the MOU
          </div>

          {/* Form */}
          <form onSubmit={onSave} className="mt-4">
            <div className="grid grid-cols-12 gap-y-4 items-center">
              <div className="col-span-4">
                <Label required>Date of Signing</Label>
              </div>
              <div className="col-span-5">
                <Input
                  type="text"
                  placeholder="Date of Signing"
                  value={dateOfSigning}
                  onChange={(e) => setDateOfSigning(e.target.value)}
                  onBlur={() => setTouched(true)}
                />
                <InlineError msg={touched ? errors.dateOfSigning : undefined} />
              </div>
              <div className="col-span-3" />

              <div className="col-span-4">
                <Label required>Name of University / Industrial</Label>
              </div>
              <div className="col-span-5">
                <Input
                  type="text"
                  placeholder="Name of University / Industrial"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  onBlur={() => setTouched(true)}
                />
                <InlineError msg={touched ? errors.orgName : undefined} />
              </div>
              <div className="col-span-3" />

              <div className="col-span-4">
                <Label required>Type</Label>
              </div>
              <div className="col-span-5">
                <div className="flex items-center gap-4 py-1">
                  <Radio
                    name="orgType"
                    label="University"
                    checked={orgType === "University"}
                    onChange={() => setOrgType("University")}
                  />
                  <Radio
                    name="orgType"
                    label="Industry"
                    checked={orgType === "Industry"}
                    onChange={() => setOrgType("Industry")}
                  />
                </div>
              </div>
              <div className="col-span-3" />

              <div className="col-span-4">
                <Label required>National / International</Label>
              </div>
              <div className="col-span-5">
                <div className="flex items-center gap-4 py-1">
                  <Radio
                    name="scope"
                    label="National"
                    checked={scope === "National"}
                    onChange={() => setScope("National")}
                  />
                  <Radio
                    name="scope"
                    label="International"
                    checked={scope === "International"}
                    onChange={() => setScope("International")}
                  />
                </div>
              </div>
              <div className="col-span-3" />

              <div className="col-span-4">
                <Label required>File Upload</Label>
              </div>
              <div className="col-span-5">
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    setTouched(true);
                  }}
                  className={cn(
                    "block w-full text-sm",
                    "file:h-10 file:px-3 file:rounded-none file:border file:border-slate-200 dark:file:border-slate-800",
                    "file:bg-white dark:file:bg-slate-950 file:text-slate-900 dark:file:text-slate-50",
                    "text-slate-700 dark:text-slate-200",
                    "focus:outline-none"
                  )}
                />
                <InlineError msg={touched ? errors.file : undefined} />
                <div className="mt-2 text-xs text-rose-500">
                  Note: Upload only pdf file &amp; max file size 5MB
                </div>
              </div>
              <div className="col-span-3" />

              {/* Actions */}
              <div className="col-span-12 flex items-center justify-center gap-3 pt-2">
                <button
                  type="submit"
                  className={cn(
                    "h-9 px-4 rounded-none text-sm font-semibold",
                    "bg-teal-500 hover:bg-teal-600 text-white",
                    "active:translate-y-[0.5px] transition",
                    !canSubmit && touched && "opacity-80"
                  )}
                >
                  Save
                </button>

                <button
                  type="button"
                  onClick={onClear}
                  className={cn(
                    "h-9 px-4 rounded-none text-sm font-semibold",
                    "bg-amber-400 hover:bg-amber-500 text-white",
                    "active:translate-y-[0.5px] transition"
                  )}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* tiny bottom helper like classic pages */}
            <div className="mt-3 text-center text-[11px] text-slate-500 dark:text-slate-400">
              {page === "MOU" ? "MOU entry form" : "Entry form"}
            </div>
          </form>
        </div>
      </div>

      {/* tiny flash */}
      {flash && (
        <div className="fixed bottom-5 right-5 z-[90]">
          <div className="rounded-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2 text-sm text-slate-800 dark:text-slate-100 shadow-lg">
            {flash}
          </div>
        </div>
      )}
    </div>
  );
}
