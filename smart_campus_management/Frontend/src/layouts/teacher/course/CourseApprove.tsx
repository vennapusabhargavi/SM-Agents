// src/layouts/teacher/course/CourseApprove.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2Icon,
  Clock3Icon,
  XCircleIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  XIcon,
  UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";

type TabKey = "Pending" | "Approved" | "Rejected" | "Enrolled";

type ApproveRow = {
  id: string;
  regNo: string;
  student: string;
  courseCode: string;
  courseName: string;
  courseSlot: string;
  availableCount: number;
  requestedOn: string; // DD/MM/YYYY
  status: TabKey;
};

type EnrolledRow = {
  id: string;
  regNo: string;
  student: string;
  courseCode: string;
  courseName: string;
  courseSlot: string;
  approvedOn: string;
};

function cn(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ---------- UI atoms ----------
function Chip({
  tone = "neutral",
  icon,
  children,
  active,
  onClick,
}: {
  tone?: "neutral" | "info" | "success" | "danger";
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const base =
    "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition ring-1";
  const map = {
    neutral:
      "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:text-slate-200 dark:ring-slate-800 dark:hover:bg-slate-900",
    info:
      "bg-blue-50 text-blue-700 ring-blue-100 hover:bg-blue-100/50 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900/40 dark:hover:bg-blue-950/55",
    success:
      "bg-emerald-50 text-emerald-700 ring-emerald-100 hover:bg-emerald-100/50 dark:bg-emerald-950/35 dark:text-emerald-200 dark:ring-emerald-900/40 dark:hover:bg-emerald-950/50",
    danger:
      "bg-rose-50 text-rose-700 ring-rose-100 hover:bg-rose-100/50 dark:bg-rose-950/35 dark:text-rose-200 dark:ring-rose-900/40 dark:hover:bg-rose-950/50",
  } as const;

  const activeRing =
    tone === "success"
      ? "ring-2 ring-emerald-400/70 dark:ring-emerald-300/60"
      : tone === "danger"
      ? "ring-2 ring-rose-400/70 dark:ring-rose-300/60"
      : tone === "info"
      ? "ring-2 ring-blue-400/70 dark:ring-blue-300/60"
      : "ring-2 ring-slate-300/70 dark:ring-slate-700/70";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(base, map[tone], active && activeRing)}
    >
      <span className={cn("opacity-90", active && "opacity-100")}>{icon}</span>
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_12px_40px_-26px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[12px] font-semibold text-slate-600 dark:text-slate-300",
        "bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800",
        "sticky top-0 z-10",
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-sm text-slate-800 dark:text-slate-100 border-b border-slate-200/70 dark:border-slate-800/70",
        className
      )}
    >
      {children}
    </td>
  );
}

function ActionBtn({
  tone,
  children,
  onClick,
  disabled,
}: {
  tone: "approve" | "reject";
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  const cls =
    tone === "approve"
      ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-600/20"
      : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-600/20";
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition active:scale-[0.99]",
        cls,
        disabled && "opacity-50 cursor-not-allowed"
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
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-3 sm:inset-6 grid place-items-center">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold text-slate-900 dark:text-slate-50 truncate">
                {title}
              </div>
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </div>
              )}
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



// ---------- utils ----------
function matches(row: ApproveRow, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    row.regNo.toLowerCase().includes(s) ||
    row.student.toLowerCase().includes(s) ||
    row.courseCode.toLowerCase().includes(s) ||
    row.courseName.toLowerCase().includes(s) ||
    row.requestedOn.toLowerCase().includes(s)
  );
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    total,
    slice: items.slice(start, end),
    start,
    end: Math.min(end, total),
  };
}

// ---------- main ----------
export default function CourseApprove() {
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
  const TEACHER_API = `${API_BASE}/api/teacher`;

  const availableSlots: string[] = ["Slot A", "Slot B", "Slot C", "Slot D", "Slot E", "Slot F", "Slot G", "Slot H", "Slot I", "Slot J", "Slot K", "Slot L", "Slot M", "Slot N", "Slot O", "Slot P", "Slot Q", "Slot R", "Slot S", "Slot T", "Slot U", "Slot V", "Slot W", "Slot X", "Slot Y", "Slot Z"];
  const [slot, setSlot] = useState<string>("Slot A");

  const dummyRows: ApproveRow[] = [
    {
      id: "1",
      regNo: "1922121212",
      student: "Alice Johnson",
      courseCode: "CS101",
      courseName: "Introduction to Computer Science",
      courseSlot: "Slot A",
      availableCount: 45,
      requestedOn: "01/01/2026",
      status: "Pending",
    },
    {
      id: "2",
      regNo: "1922121213",
      student: "Bob Smith",
      courseCode: "CS102",
      courseName: "Data Structures",
      courseSlot: "Slot B",
      availableCount: 40,
      requestedOn: "02/01/2026",
      status: "Approved",
    },
    {
      id: "3",
      regNo: "1923121214",
      student: "Charlie Brown",
      courseCode: "CS103",
      courseName: "Algorithms",
      courseSlot: "Slot C",
      availableCount: 20,
      requestedOn: "03/01/2026",
      status: "Rejected",
    },
    {
      id: "4",
      regNo: "1922121215",
      student: "Diana Prince",
      courseCode: "CS104",
      courseName: "Database Systems",
      courseSlot: "Slot A",
      availableCount: 30,
      requestedOn: "04/01/2026",
      status: "Pending",
    },
    {
      id: "5",
      regNo: "1923121216",
      student: "Eve Wilson",
      courseCode: "CS105",
      courseName: "Operating Systems",
      courseSlot: "Slot B",
      availableCount: 25,
      requestedOn: "05/01/2026",
      status: "Approved",
    },
    {
      id: "6",
      regNo: "CS006",
      student: "Frank Miller",
      courseCode: "CS106",
      courseName: "Computer Networks",
      courseSlot: "Slot C",
      availableCount: 35,
      requestedOn: "06/01/2026",
      status: "Rejected",
    },
    {
      id: "7",
      regNo: "CS007",
      student: "Grace Lee",
      courseCode: "CS107",
      courseName: "Software Engineering",
      courseSlot: "Slot A",
      availableCount: 40,
      requestedOn: "07/01/2026",
      status: "Pending",
    },
    {
      id: "8",
      regNo: "CS008",
      student: "Henry Wilson",
      courseCode: "CS108",
      courseName: "Database Management",
      courseSlot: "Slot B",
      availableCount: 38,
      requestedOn: "08/01/2026",
      status: "Approved",
    },
    {
      id: "9",
      regNo: "CS009",
      student: "Isabella Garcia",
      courseCode: "CS109",
      courseName: "Web Development",
      courseSlot: "Slot C",
      availableCount: 42,
      requestedOn: "09/01/2026",
      status: "Pending",
    },
    {
      id: "10",
      regNo: "CS010",
      student: "Jack Brown",
      courseCode: "CS110",
      courseName: "Machine Learning",
      courseSlot: "Slot D",
      availableCount: 30,
      requestedOn: "10/01/2026",
      status: "Rejected",
    },
    {
      id: "11",
      regNo: "CS011",
      student: "Katherine Davis",
      courseCode: "CS111",
      courseName: "Artificial Intelligence",
      courseSlot: "Slot A",
      availableCount: 35,
      requestedOn: "11/01/2026",
      status: "Pending",
    },
    {
      id: "12",
      regNo: "CS012",
      student: "Liam Martinez",
      courseCode: "CS112",
      courseName: "Cyber Security",
      courseSlot: "Slot B",
      availableCount: 28,
      requestedOn: "12/01/2026",
      status: "Approved",
    },
    {
      id: "13",
      regNo: "CS013",
      student: "Mia Rodriguez",
      courseCode: "CS113",
      courseName: "Cloud Computing",
      courseSlot: "Slot C",
      availableCount: 32,
      requestedOn: "13/01/2026",
      status: "Pending",
    },
    {
      id: "14",
      regNo: "CS014",
      student: "Noah Lopez",
      courseCode: "CS114",
      courseName: "Big Data",
      courseSlot: "Slot D",
      availableCount: 25,
      requestedOn: "14/01/2026",
      status: "Rejected",
    },
    {
      id: "15",
      regNo: "CS015",
      student: "Olivia Gonzalez",
      courseCode: "CS115",
      courseName: "Mobile App Development",
      courseSlot: "Slot A",
      availableCount: 45,
      requestedOn: "15/01/2026",
      status: "Pending",
    },
    {
      id: "16",
      regNo: "CS016",
      student: "Parker Anderson",
      courseCode: "CS116",
      courseName: "Game Development",
      courseSlot: "Slot B",
      availableCount: 20,
      requestedOn: "16/01/2026",
      status: "Approved",
    },
    // Add more dummy data
    {
      id: "17",
      regNo: "CS017",
      student: "Quinn Thompson",
      courseCode: "CS117",
      courseName: "Data Mining",
      courseSlot: "Slot C",
      availableCount: 25,
      requestedOn: "17/01/2026",
      status: "Pending",
    },
    {
      id: "18",
      regNo: "CS018",
      student: "Riley White",
      courseCode: "CS118",
      courseName: "Blockchain Technology",
      courseSlot: "Slot A",
      availableCount: 30,
      requestedOn: "18/01/2026",
      status: "Approved",
    },
    {
      id: "19",
      regNo: "CS019",
      student: "Sophia Harris",
      courseCode: "CS119",
      courseName: "Quantum Computing",
      courseSlot: "Slot B",
      availableCount: 15,
      requestedOn: "19/01/2026",
      status: "Rejected",
    },
    {
      id: "20",
      regNo: "CS020",
      student: "Tyler Clark",
      courseCode: "CS120",
      courseName: "IoT Systems",
      courseSlot: "Slot C",
      availableCount: 40,
      requestedOn: "20/01/2026",
      status: "Pending",
    },
    {
      id: "21",
      regNo: "CS021",
      student: "Uma Lewis",
      courseCode: "CS121",
      courseName: "Compiler Design",
      courseSlot: "Slot A",
      availableCount: 35,
      requestedOn: "21/01/2026",
      status: "Approved",
    },
    {
      id: "22",
      regNo: "CS022",
      student: "Victor Walker",
      courseCode: "CS122",
      courseName: "Parallel Computing",
      courseSlot: "Slot B",
      availableCount: 22,
      requestedOn: "22/01/2026",
      status: "Pending",
    },
    {
      id: "23",
      regNo: "CS023",
      student: "Wendy Hall",
      courseCode: "CS123",
      courseName: "Human-Computer Interaction",
      courseSlot: "Slot C",
      availableCount: 28,
      requestedOn: "23/01/2026",
      status: "Rejected",
    },
    {
      id: "24",
      regNo: "CS024",
      student: "Xander Young",
      courseCode: "CS124",
      courseName: "Software Testing",
      courseSlot: "Slot A",
      availableCount: 32,
      requestedOn: "24/01/2026",
      status: "Approved",
    },
    {
      id: "25",
      regNo: "CS025",
      student: "Yara King",
      courseCode: "CS125",
      courseName: "Information Retrieval",
      courseSlot: "Slot B",
      availableCount: 18,
      requestedOn: "25/01/2026",
      status: "Pending",
    },
    {
      id: "26",
      regNo: "CS026",
      student: "Zane Lee",
      courseCode: "CS126",
      courseName: "Natural Language Processing",
      courseSlot: "Slot C",
      availableCount: 26,
      requestedOn: "26/01/2026",
      status: "Approved",
    },
    {
      id: "27",
      regNo: "CS027",
      student: "Abby Moore",
      courseCode: "CS127",
      courseName: "Computer Vision",
      courseSlot: "Slot A",
      availableCount: 24,
      requestedOn: "27/01/2026",
      status: "Rejected",
    },
    {
      id: "28",
      regNo: "CS028",
      student: "Ben Taylor",
      courseCode: "CS128",
      courseName: "Robotics",
      courseSlot: "Slot B",
      availableCount: 20,
      requestedOn: "28/01/2026",
      status: "Pending",
    },
    {
      id: "29",
      regNo: "CS029",
      student: "Cathy Wilson",
      courseCode: "CS129",
      courseName: "Ethical Hacking",
      courseSlot: "Slot C",
      availableCount: 30,
      requestedOn: "29/01/2026",
      status: "Approved",
    },
    {
      id: "30",
      regNo: "CS030",
      student: "David Brown",
      courseCode: "CS130",
      courseName: "Augmented Reality",
      courseSlot: "Slot A",
      availableCount: 25,
      requestedOn: "30/01/2026",
      status: "Pending",
    },
    // Slot D
    {
      id: "31",
      regNo: "CS031",
      student: "Emma Davis",
      courseCode: "CS131",
      courseName: "Virtual Reality",
      courseSlot: "Slot D",
      availableCount: 20,
      requestedOn: "31/01/2026",
      status: "Approved",
    },
    {
      id: "32",
      regNo: "CS032",
      student: "Felix Evans",
      courseCode: "CS132",
      courseName: "Embedded Systems",
      courseSlot: "Slot D",
      availableCount: 15,
      requestedOn: "01/02/2026",
      status: "Pending",
    },
    {
      id: "33",
      regNo: "CS033",
      student: "Grace Foster",
      courseCode: "CS133",
      courseName: "Digital Signal Processing",
      courseSlot: "Slot D",
      availableCount: 18,
      requestedOn: "02/02/2026",
      status: "Rejected",
    },
    {
      id: "34",
      regNo: "CS034",
      student: "Hugo Green",
      courseCode: "CS134",
      courseName: "Microprocessors",
      courseSlot: "Slot D",
      availableCount: 22,
      requestedOn: "03/02/2026",
      status: "Approved",
    },
    // Slot E
    {
      id: "35",
      regNo: "CS035",
      student: "Iris Hill",
      courseCode: "CS135",
      courseName: "Analog Electronics",
      courseSlot: "Slot E",
      availableCount: 25,
      requestedOn: "04/02/2026",
      status: "Pending",
    },
    {
      id: "36",
      regNo: "CS036",
      student: "Jack Ingram",
      courseCode: "CS136",
      courseName: "Power Systems",
      courseSlot: "Slot E",
      availableCount: 20,
      requestedOn: "05/02/2026",
      status: "Approved",
    },
    {
      id: "37",
      regNo: "CS037",
      student: "Kara Jones",
      courseCode: "CS137",
      courseName: "Control Systems",
      courseSlot: "Slot E",
      availableCount: 17,
      requestedOn: "06/02/2026",
      status: "Rejected",
    },
    {
      id: "38",
      regNo: "CS038",
      student: "Liam Kelly",
      courseCode: "CS138",
      courseName: "Renewable Energy",
      courseSlot: "Slot E",
      availableCount: 23,
      requestedOn: "07/02/2026",
      status: "Pending",
    },
    // Slot F
    {
      id: "39",
      regNo: "CS039",
      student: "Maya Lopez",
      courseCode: "CS139",
      courseName: "Biomedical Engineering",
      courseSlot: "Slot F",
      availableCount: 19,
      requestedOn: "08/02/2026",
      status: "Approved",
    },
    {
      id: "40",
      regNo: "CS040",
      student: "Noah Miller",
      courseCode: "CS140",
      courseName: "Nanotechnology",
      courseSlot: "Slot F",
      availableCount: 21,
      requestedOn: "09/02/2026",
      status: "Pending",
    },
    {
      id: "41",
      regNo: "CS041",
      student: "Olivia Nelson",
      courseCode: "CS141",
      courseName: "Materials Science",
      courseSlot: "Slot F",
      availableCount: 16,
      requestedOn: "10/02/2026",
      status: "Rejected",
    },
    {
      id: "42",
      regNo: "CS042",
      student: "Piers Owen",
      courseCode: "CS142",
      courseName: "Aerospace Engineering",
      courseSlot: "Slot F",
      availableCount: 24,
      requestedOn: "11/02/2026",
      status: "Approved",
    },
    // Slot G
    {
      id: "43",
      regNo: "CS043",
      student: "Quinn Parker",
      courseCode: "CS143",
      courseName: "Marine Engineering",
      courseSlot: "Slot G",
      availableCount: 18,
      requestedOn: "12/02/2026",
      status: "Pending",
    },
    {
      id: "44",
      regNo: "CS044",
      student: "Rachel Quinn",
      courseCode: "CS144",
      courseName: "Petroleum Engineering",
      courseSlot: "Slot G",
      availableCount: 20,
      requestedOn: "13/02/2026",
      status: "Approved",
    },
    {
      id: "45",
      regNo: "CS045",
      student: "Samuel Reed",
      courseCode: "CS145",
      courseName: "Geotechnical Engineering",
      courseSlot: "Slot G",
      availableCount: 22,
      requestedOn: "14/02/2026",
      status: "Rejected",
    },
    {
      id: "46",
      regNo: "CS046",
      student: "Tina Scott",
      courseCode: "CS146",
      courseName: "Structural Engineering",
      courseSlot: "Slot G",
      availableCount: 19,
      requestedOn: "15/02/2026",
      status: "Pending",
    },
    // Slot H
    {
      id: "47",
      regNo: "CS047",
      student: "Ursula Taylor",
      courseCode: "CS147",
      courseName: "Urban Planning",
      courseSlot: "Slot H",
      availableCount: 25,
      requestedOn: "16/02/2026",
      status: "Approved",
    },
    {
      id: "48",
      regNo: "CS048",
      student: "Victor Underwood",
      courseCode: "CS148",
      courseName: "Environmental Engineering",
      courseSlot: "Slot H",
      availableCount: 21,
      requestedOn: "17/02/2026",
      status: "Pending",
    },
    {
      id: "49",
      regNo: "CS049",
      student: "Wendy Vaughn",
      courseCode: "CS149",
      courseName: "Water Resources",
      courseSlot: "Slot H",
      availableCount: 17,
      requestedOn: "18/02/2026",
      status: "Rejected",
    },
    {
      id: "50",
      regNo: "CS050",
      student: "Xander Wright",
      courseCode: "CS150",
      courseName: "Transportation Engineering",
      courseSlot: "Slot H",
      availableCount: 23,
      requestedOn: "19/02/2026",
      status: "Approved",
    },
    // Add more for density
    {
      id: "51",
      regNo: "CS051",
      student: "Yara Young",
      courseCode: "CS151",
      courseName: "Civil Engineering Design",
      courseSlot: "Slot A",
      availableCount: 30,
      requestedOn: "20/02/2026",
      status: "Pending",
    },
    {
      id: "52",
      regNo: "CS052",
      student: "Zane Zimmer",
      courseCode: "CS152",
      courseName: "Construction Management",
      courseSlot: "Slot B",
      availableCount: 28,
      requestedOn: "21/02/2026",
      status: "Approved",
    },
  ];

  const [rows, setRows] = useState<ApproveRow[]>(() => {
    const stored = localStorage.getItem("courseApproveRows_v2");
    return stored ? JSON.parse(stored) : dummyRows;
  });
  const [enrolledRows, setEnrolledRows] = useState<EnrolledRow[]>([
    {
      id: "4",
      regNo: "19221317",
      student: "Diana Prince",
      courseCode: "CS104",
      courseName: "Database Systems",
      courseSlot: "Slot A",
      approvedOn: "04/01/2026",
    },
    {
      id: "5",
      regNo: "19231318",
      student: "Eve Wilson",
      courseCode: "CS105",
      courseName: "Operating Systems",
      courseSlot: "Slot B",
      approvedOn: "05/01/2026",
    },
  ]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;

        // Fetch requests
        const requestsRes = await fetch(`${TEACHER_API}/enrollment/requests?slot=${encodeURIComponent(slot)}`, { headers });
        if (requestsRes.ok) {
          const data = await requestsRes.json();
          const mapped: ApproveRow[] = (data.requests || []).map((r: any) => ({
            id: r.id,
            regNo: r.regNo,
            student: r.studentName,
            courseCode: r.courseCode,
            courseName: r.courseName,
            courseSlot: r.courseSlot,
            availableCount: Number(r.availableCount || 0),
            requestedOn: r.requestedOn,
            status: r.status as TabKey,
          }));
          if (mapped.length > 0) setRows(mapped);
        }

        // Fetch approved enrollments
        const enrolledRes = await fetch(`${TEACHER_API}/enrollment/approved?slot=${encodeURIComponent(slot)}`, { headers });
        if (enrolledRes.ok) {
          const data = await enrolledRes.json();
          const mapped: EnrolledRow[] = (data.enrollments || []).map((r: any) => ({
            id: r.id,
            regNo: r.regNo,
            student: r.studentName,
            courseCode: r.courseCode,
            courseName: r.courseName,
            courseSlot: r.courseSlot,
            approvedOn: r.approvedOn,
          }));
          if (mapped.length > 0) setEnrolledRows(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, [slot]);

  const [tab, setTab] = useState<TabKey>("Pending");
  const [q, setQ] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);



  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [active, setActive] = useState<ApproveRow | null>(null);
  const [reason, setReason] = useState("");

  const filtered = useMemo(() => {
    if (tab === "Enrolled") {
      return enrolledRows.filter((r) => r.courseSlot === slot).filter((r) => matches({ ...r, requestedOn: r.approvedOn } as any, q));
    }
    return rows.filter((r) => r.courseSlot === slot && r.status === tab).filter((r) => matches(r, q));
  }, [rows, enrolledRows, tab, q, slot]);

  const { total, slice, start, end } = useMemo(
    () => paginate<any>(filtered, page, pageSize),
    [filtered, page, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [tab, q, pageSize]);

  const showingText =
    total === 0
      ? "Showing 0 to 0 of 0 entries"
      : `Showing ${start + 1} to ${end} of ${total} entries`;

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const openConfirm = (r: ApproveRow, action: "approve" | "reject") => {
    setActive(r);
    setConfirmAction(action);
    setReason("");
    setConfirmOpen(true);
  };

  const closeConfirm = () => {
    setConfirmOpen(false);
    setActive(null);
    setReason("");
  };

  const commit = async () => {
    if (!active) return;

    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${TEACHER_API}/enrollment/requests/${active.id}`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: confirmAction, reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update request");
      }

      setRows((prev) => {
        const updated = prev.map((r) =>
          r.id === active.id
            ? { ...r, status: (confirmAction === "approve" ? "Approved" : "Rejected") as TabKey }
            : r
        );
        localStorage.setItem("courseApproveRows_v2", JSON.stringify(updated));
        return updated;
      });

      toast.success(
        confirmAction === "approve"
          ? `Approved ${active.regNo} • ${active.courseCode}`
          : `Rejected ${active.regNo} • ${active.courseCode}${
              reason.trim() ? " (reason saved)" : ""
            }`
      );
    } catch (err: any) {
      toast.error(`Error: ${err.message}`);
    }
    closeConfirm();
  };

  const TabBar = (
    <div className="flex flex-wrap gap-2">
      <Chip
        tone="info"
        icon={<Clock3Icon size={16} />}
        active={tab === "Pending"}
        onClick={() => setTab("Pending")}
      >
        Pending
      </Chip>
      <Chip
        tone="success"
        icon={<CheckCircle2Icon size={16} />}
        active={tab === "Approved"}
        onClick={() => setTab("Approved")}
      >
        Approved
      </Chip>
      <Chip
        tone="danger"
        icon={<XCircleIcon size={16} />}
        active={tab === "Rejected"}
        onClick={() => setTab("Rejected")}
      >
        Rejected
      </Chip>
      <Chip
        tone="neutral"
        icon={<UsersIcon size={16} />}
        active={tab === "Enrolled"}
        onClick={() => setTab("Enrolled")}
      >
        Enrolled Students
      </Chip>
    </div>
  );

  return (
    <div className="w-full p-4 md:p-6 space-y-4">
      <div>
        <div className="text-[28px] font-light text-slate-700 dark:text-slate-100 leading-none">
          Enrollment - Course Approve
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">{TabBar}</div>

      {/* Slot Filter */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-[13px] font-medium text-rose-500">Filter by Slot</div>

          <div className="w-full sm:w-[300px]">
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              className={cn(
                "w-full rounded-xl border border-slate-300/90 dark:border-slate-700",
                "bg-white dark:bg-slate-950",
                "px-3 py-2.5 text-[13px]",
                "text-slate-900 dark:text-slate-100",
                "shadow-inner",
                "focus:outline-none focus:ring-2 focus:ring-slate-400/40 dark:focus:ring-slate-500/40"
              )}
            >
              {availableSlots.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className={cn(
              "h-10 rounded-xl px-3 text-sm",
              "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
              "ring-1 ring-slate-200 dark:ring-slate-800",
              "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
              "transition"
            )}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            records
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Search:
          </div>
          <div className="relative">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder=""
              className={cn(
                "h-10 w-[220px] rounded-xl pl-9 pr-3 text-sm",
                "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                "ring-1 ring-slate-200 dark:ring-slate-800",
                "focus:outline-none focus:ring-2 focus:ring-indigo-400/60 dark:focus:ring-indigo-300/60",
                "transition"
              )}
            />
          </div>
        </div>
      </div>

      <TableShell>
        <table className={tab === "Enrolled" ? "min-w-[800px] w-full" : "min-w-[1120px] w-full"}>
          <thead>
            <tr>
              <Th className="w-[140px]">Reg No.</Th>
              <Th className="min-w-[260px]">Student</Th>
              <Th className="w-[160px]">Course Code</Th>
              <Th className="min-w-[320px]">Course Name</Th>
              <Th className="w-[160px]">Available Count</Th>
              <Th className="w-[160px]">Requested On</Th>
              <Th className="w-[120px]">Status</Th>
              <Th className="w-[150px]">Approve</Th>
              <Th className="w-[150px]">Reject</Th>
            </tr>
          </thead>

          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td
                  className="py-8 text-center text-slate-500 dark:text-slate-400"
                  colSpan={8}
                >
                  No data available in table
                </td>
              </tr>
            ) : (
              slice.map((r, idx) => (
                <tr
                  key={r.id}
                  className={cn(
                    idx % 2 === 0
                      ? "bg-white dark:bg-slate-950"
                      : "bg-slate-50/60 dark:bg-slate-900/20",
                    "hover:bg-indigo-50/60 dark:hover:bg-indigo-950/25 transition"
                  )}
                >
                  <Td className="font-semibold">{r.regNo}</Td>
                  <Td>{r.student}</Td>
                  <Td className="font-semibold">{r.courseCode}</Td>
                  <Td>{r.courseName}</Td>

                  {/* ✅ Available count: ONLY number (no symbols/pills) */}
                  <Td>
                    <span
                      className={cn(
                        "tabular-nums font-semibold",
                        r.availableCount === 0
                          ? "text-rose-700 dark:text-rose-300"
                          : "text-slate-800 dark:text-slate-100"
                      )}
                    >
                      {r.availableCount}
                    </span>
                  </Td>

                  <Td className="tabular-nums">{r.requestedOn}</Td>

                  <Td>
                    <ActionBtn
                      tone="approve"
                      disabled={r.status !== "Pending"}
                      onClick={() => openConfirm(r, "approve")}
                    >
                      <ThumbsUpIcon size={14} />
                      Approve
                    </ActionBtn>
                  </Td>
                  <Td>
                    <ActionBtn
                      tone="reject"
                      disabled={r.status !== "Pending"}
                      onClick={() => openConfirm(r, "reject")}
                    >
                      <ThumbsDownIcon size={14} />
                      Reject
                    </ActionBtn>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TableShell>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {showingText}
        </div>

        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className={cn(
              "h-9 w-10 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950",
              "grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition",
              !canPrev && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Previous"
          >
            <ChevronLeftIcon size={16} />
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className={cn(
              "h-9 w-10 rounded-xl ring-1 ring-slate-200 dark:ring-slate-800 bg-white dark:bg-slate-950",
              "grid place-items-center hover:bg-slate-50 dark:hover:bg-slate-900 transition",
              !canNext && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Next"
          >
            <ChevronRightIcon size={16} />
          </button>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        title={confirmAction === "approve" ? "Approve Enrollment" : "Reject Enrollment"}
        subtitle={
          active
            ? `${active.regNo} • ${active.student} • ${active.courseCode}`
            : undefined
        }
        onClose={closeConfirm}
      >
        {active && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/25 p-4">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {active.courseName}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Requested on {active.requestedOn} • Available count:{" "}
                <span className="font-semibold tabular-nums">
                  {active.availableCount}
                </span>
              </div>
            </div>

            {confirmAction === "reject" && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Rejection reason (optional)
                </div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Add a short reason (optional)"
                  rows={3}
                  className={cn(
                    "w-full rounded-xl px-3 py-2 text-sm",
                    "bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50",
                    "ring-1 ring-slate-200 dark:ring-slate-800",
                    "focus:outline-none focus:ring-2 focus:ring-rose-400/60 dark:focus:ring-rose-300/60",
                    "transition"
                  )}
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirm}
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-semibold transition",
                  "bg-white hover:bg-slate-50 text-slate-800 ring-1 ring-slate-200",
                  "dark:bg-slate-950 dark:hover:bg-slate-900 dark:text-slate-100 dark:ring-slate-800"
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commit}
                className={cn(
                  "h-10 px-4 rounded-xl text-sm font-semibold text-white transition shadow-sm",
                  confirmAction === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-600/20"
                    : "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-rose-600/20"
                )}
              >
                {confirmAction === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
