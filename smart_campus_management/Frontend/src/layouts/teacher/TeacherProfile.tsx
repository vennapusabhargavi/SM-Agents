// src/layouts/teacher/profile/TeacherProfile.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  PencilIcon,
  Building2Icon,
  UserIcon,
  CalendarIcon,
  PhoneIcon,
  BadgeCheckIcon,
  LayersIcon,
  BookOpenIcon,
  FileTextIcon,
  EyeIcon,
  FileDownIcon,
  Trash2Icon,
  CopyIcon,
  XCircleIcon,
  CheckCircle2Icon,
  Clock3Icon,
} from "lucide-react";

const API_BASE = "http://localhost:5000";
const TEACHER_API = `${API_BASE}/api/teacher`;

type TabKey = "Pending" | "Approved" | "Duplicates" | "Rejected" | "Deleted";

type TeacherProfile = {
  name: string;
  dob: string;
  speciality: string;
  department: string;
  ugUniversity: string;
  pgUniversity: string;
  empId: string;
  appointmentDate: string;
  designation: string;
  mobile: string;
  ugYear: string;
  pgYear: string;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

type OverviewGroup = { label: string; value: number };

type RecordRow = {
  id: string;
  details: string;
  type: string;
  datedOn: string;
  status: TabKey;
};

function StatusChip({ tab }: { tab: TabKey }) {
  const cfg =
    tab === "Approved"
      ? { cls: "text-emerald-700 bg-emerald-50 border-emerald-200", Icon: CheckCircle2Icon }
      : tab === "Pending"
      ? { cls: "text-amber-700 bg-amber-50 border-amber-200", Icon: Clock3Icon }
      : tab === "Duplicates"
      ? { cls: "text-sky-700 bg-sky-50 border-sky-200", Icon: CopyIcon }
      : tab === "Rejected"
      ? { cls: "text-rose-700 bg-rose-50 border-rose-200", Icon: XCircleIcon }
      : { cls: "text-slate-700 bg-slate-50 border-slate-200", Icon: Trash2Icon };

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border", cfg.cls)}>
      <cfg.Icon size={14} />
      {tab}
    </span>
  );
}

function PillBtn({
  children,
  onClick,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-9 px-4 rounded-full text-sm font-medium transition",
        variant === "primary"
          ? "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-100 dark:border-slate-800 dark:hover:bg-slate-900"
          : "bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-800 dark:hover:bg-slate-900"
      )}
    >
      {children}
    </button>
  );
}

function MetricCard({
  title,
  value,
  withImage,
}: {
  title: string;
  value: number;
  withImage?: boolean;
}) {
  return (
    <div className="h-[120px] border border-slate-200 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/40">
      <div className="h-full grid grid-cols-[1fr_140px]">
        <div className="p-3 flex flex-col justify-between">
          <div className="text-right text-3xl font-semibold text-white/90 drop-shadow-sm">
            {value}
          </div>
          <div className="text-center text-[11px] font-semibold tracking-wide text-white/90 uppercase">
            {title}
          </div>
        </div>
        <div className={cn("h-full", withImage ? "bg-cover bg-center" : "")}
          style={
            withImage
              ? {
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=480&q=60')",
                }
              : undefined
          }
        >
          {!withImage && (
            <div className="h-full w-full flex items-center justify-center text-white/60">
              <FileTextIcon size={38} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewBox({
  items,
}: {
  items: OverviewGroup[];
}) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 rounded-lg overflow-hidden">
      <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Activity Summary</h3>
      </div>
      <div className="px-4 py-4 space-y-3">
        {items.map((it) => (
          <div key={it.label} className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-700 dark:text-slate-300 flex-1 min-w-0">
              <span className="truncate block">{it.label}</span>
            </div>
            <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md min-w-[2rem] text-center">
              {it.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabBtn({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm border border-transparent -mb-[1px] transition",
        active
          ? "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50"
          : "text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300"
      )}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        "px-3 py-3 text-left text-[13px] font-semibold text-slate-800 dark:text-slate-100",
        "border-b border-slate-200 dark:border-slate-800",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        "px-3 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800",
        className
      )}
    >
      {children}
    </td>
  );
}

export default function TeacherProfile() {
  const [profile, setProfile] = useState<TeacherProfile>({
    name: "Prof. Rajesh Kumar",
    dob: "15/08/1985",
    speciality: "Computer Science",
    department: "Computer Science",
    ugUniversity: "IIT Delhi",
    pgUniversity: "IIT Bombay",
    empId: "ssetsec123",
    appointmentDate: "15/01/2020",
    designation: "Assistant Professor",
    mobile: "9876543211",
    ugYear: "2010",
    pgYear: "2012",
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<TeacherProfile>({
    name: "Prof. Rajesh Kumar",
    dob: "15/08/1985",
    speciality: "Computer Science",
    department: "Computer Science",
    ugUniversity: "IIT Delhi",
    pgUniversity: "IIT Bombay",
    empId: "ssetsec123",
    appointmentDate: "15/01/2020",
    designation: "Assistant Professor",
    mobile: "9876543211",
    ugYear: "2010",
    pgYear: "2012",
  });

  // Hardcoded profile data based on seed.sql
  useEffect(() => {
    // No fetch, using hardcoded data
  }, []);

  // Helper function to format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Helper function to format date for input
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const [tab, setTab] = useState<TabKey>("Pending");

  const handleEditProfile = () => {
    // In a full implementation, this would fetch the latest data from the server
    // For now, we use the current profile state
    setEditForm(profile);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    // Hardcoded: just update locally
    setProfile(editForm);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const p = profile;

  // Demo rows (kept empty to match screenshot)
  const rows: RecordRow[] = useMemo(
    () => [
      // keep empty to match "No data available in table"
    ],
    []
  );

  const filtered = useMemo(() => rows.filter((r) => r.status === tab), [rows, tab]);

  const group1: OverviewGroup[] = useMemo(
    () => [
      { label: "Conferences Attended", value: 0 },
      { label: "Conferences Organised", value: 0 },
      { label: "CE/ Seminars Attended", value: 0 },
      { label: "CE/Seminars Organised", value: 0 },
      { label: "FDP Programs Attended", value: 0 },
    ],
    []
  );

  const group2: OverviewGroup[] = useMemo(
    () => [
      { label: "Non Indexed Publications", value: 0 },
      { label: "Indexed Publications", value: 0 },
      { label: "Textbooks Edited", value: 0 },
      { label: "Textbooks Chapters", value: 0 },
      { label: "Professional Membership", value: 0 },
    ],
    []
  );

  const group3: OverviewGroup[] = useMemo(
    () => [
      { label: "Examiner-ship", value: 0 },
      { label: "Inspections", value: 0 },
      { label: "Awards", value: 0 },
      { label: "Patents Registered", value: 0 },
      { label: "Patents Published", value: 0 },
    ],
    []
  );

  const group4: OverviewGroup[] = useMemo(
    () => [
      { label: "Grants Applied", value: 0 },
      { label: "Grants Awarded", value: 0 },
      { label: "Projects Guided", value: 0 },
      { label: "Additional Qualifications", value: 0 },
      { label: "MOU's Arranged", value: 0 },
    ],
    []
  );

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
        My Profile
      </div>

      {/* FACULTY PROFILE header + edit */}
      <div className="mt-4 relative">
        <div className="text-center text-sm font-semibold tracking-wide text-slate-900 dark:text-slate-50">
          FACULTY PROFILE
        </div>

        <div className="absolute right-0 top-[-4px]">
          <button
            type="button"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full border border-sky-500 text-slate-900 bg-white hover:bg-slate-50 transition dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
            onClick={handleEditProfile}
          >
            <PencilIcon size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* top info row */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* left info (two columns like screenshot) */}
        <div className="xl:col-span-7">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-slate-600 dark:border-t-slate-300 rounded-full animate-spin"></div>
              <span className="ml-2 text-slate-600 dark:text-slate-400">Loading profile...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-3">
            {/* left column */}
            <div className="space-y-3">
              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Name</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.name}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Date of Birth</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.dob}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Speciality</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.speciality}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Department</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.department}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">UG University</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.ugUniversity}
                </div>
              </div>

              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">PG University</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.pgUniversity}
                </div>
              </div>
            </div>

            {/* right column */}
            <div className="space-y-3">
              <div className="grid grid-cols-[170px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Emp Id</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.empId}
                </div>
              </div>

              <div className="grid grid-cols-[170px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Appointment Date</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.appointmentDate}
                </div>
              </div>

              <div className="grid grid-cols-[170px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Designation</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.designation}
                </div>
              </div>

              <div className="grid grid-cols-[170px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Mobile No.</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.mobile}
                </div>
              </div>

              <div className="grid grid-cols-[170px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Year Of Completion</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.ugYear}
                </div>
              </div>

              <div className="grid grid-cols-[170px_1fr] items-center gap-3">
                <div className="text-sm text-slate-700 dark:text-slate-200">Year Of Completion</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {p.pgYear}
                </div>
              </div>
            </div>
            </div>
          )}
        </div>

        {/* right metrics (image + 2 score cards like screenshot) */}
        <div className="xl:col-span-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch">
            <div className="hidden lg:block border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden rounded-lg">
              <img
                src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=520&q=60"
                alt="Cover"
                className="h-[120px] w-full object-cover"
              />
            </div>

            <MetricCard title="CURRENT YEAR CAFE SCORE" value={0} />
            <MetricCard title="LIFETIME CAFE SCORE" value={0} />
          </div>
        </div>
      </div>

      {/* divider line */}
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800" />

      {/* FACULTY RECORD OVERVIEW */}
      <div className="mt-5 text-center text-sm font-semibold text-slate-900 dark:text-slate-50">
        FACULTY RECORD OVERVIEW
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <OverviewBox items={group1} />
        <OverviewBox items={group2} />
        <OverviewBox items={group3} />
        <OverviewBox items={group4} />
      </div>

      {/* divider line */}
      <div className="mt-6 border-t border-slate-200 dark:border-slate-800" />

      {/* FACULTY RECORD DETAILS + buttons */}
      <div className="mt-5 relative">
        <div className="text-center text-sm font-semibold text-slate-900 dark:text-slate-50">
          FACULTY RECORD DETAILS
        </div>

        <div className="absolute right-0 top-[-6px] flex items-center gap-2 flex-wrap justify-end">
          <button
            type="button"
            className="h-9 px-3 sm:px-5 rounded-full border border-sky-500 bg-white text-slate-900 hover:bg-slate-50 transition dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 text-sm"
            onClick={() => alert("Demo: Department Record")}
          >
            <span className="hidden sm:inline">Department Record</span>
            <span className="sm:hidden">Dept Record</span>
          </button>
          <button
            type="button"
            className="h-9 px-3 sm:px-5 rounded-full border border-sky-500 bg-white text-slate-900 hover:bg-slate-50 transition dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900 text-sm"
            onClick={() => alert("Demo: Add Record")}
          >
            Add Record
          </button>
        </div>
      </div>

      {/* Tabs row like screenshot */}
      <div className="mt-5 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          <TabBtn
            label="Pending List"
            active={tab === "Pending"}
            onClick={() => setTab("Pending")}
            icon={<Clock3Icon size={16} className="text-slate-500 dark:text-slate-400" />}
          />
          <TabBtn
            label="Approved List"
            active={tab === "Approved"}
            onClick={() => setTab("Approved")}
            icon={<CheckCircle2Icon size={16} className="text-sky-700 dark:text-sky-400" />}
          />
          <TabBtn
            label="Duplicates List"
            active={tab === "Duplicates"}
            onClick={() => setTab("Duplicates")}
            icon={<CopyIcon size={16} className="text-sky-700 dark:text-sky-400" />}
          />
          <TabBtn
            label="Rejected List"
            active={tab === "Rejected"}
            onClick={() => setTab("Rejected")}
            icon={<XCircleIcon size={16} className="text-sky-700 dark:text-sky-400" />}
          />
          <TabBtn
            label="Deleted List"
            active={tab === "Deleted"}
            onClick={() => setTab("Deleted")}
            icon={<Trash2Icon size={16} className="text-sky-700 dark:text-sky-400" />}
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto max-w-full">
        <TableShell>
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <Th className="w-[60px]">SNo.</Th>
                <Th>Details</Th>
                <Th className="w-[200px]">Type</Th>
                <Th className="w-[120px]">Dated On</Th>
                <Th className="w-[80px]">View</Th>
                <Th className="w-[100px]">View File</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    No data available in table
                  </Td>
                </tr>
              ) : (
                filtered.map((r, i) => (
                  <tr key={r.id} className={cn(i % 2 ? "bg-slate-50 dark:bg-slate-900/20" : "")}>
                    <Td>{i + 1}</Td>
                    <Td>
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-slate-900 dark:text-slate-50 truncate">
                            {r.details}
                          </div>
                        </div>
                        <StatusChip tab={r.status} />
                      </div>
                    </Td>
                    <Td className="text-slate-700 dark:text-slate-200">{r.type}</Td>
                    <Td className="tabular-nums">{r.datedOn}</Td>
                    <Td>
                      <button
                        type="button"
                        className="h-8 w-9 grid place-items-center border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 transition"
                        aria-label="View"
                        title="View"
                      >
                        <EyeIcon size={16} />
                      </button>
                    </Td>
                    <Td>
                      <button
                        type="button"
                        className="h-8 w-10 grid place-items-center border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 dark:bg-slate-950 dark:hover:bg-slate-900 transition"
                        aria-label="Download"
                        title="Download"
                      >
                        <FileDownIcon size={16} />
                      </button>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TableShell>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Edit Profile</h2>
              <button
                onClick={handleCancelEdit}
                className="h-8 w-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
              >
                <XCircleIcon size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Speciality
                  </label>
                  <input
                    type="text"
                    value={editForm.speciality}
                    onChange={(e) => setEditForm({ ...editForm, speciality: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={editForm.designation}
                    onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    UG University
                  </label>
                  <input
                    type="text"
                    value={editForm.ugUniversity}
                    onChange={(e) => setEditForm({ ...editForm, ugUniversity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    PG University
                  </label>
                  <input
                    type="text"
                    value={editForm.pgUniversity}
                    onChange={(e) => setEditForm({ ...editForm, pgUniversity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
