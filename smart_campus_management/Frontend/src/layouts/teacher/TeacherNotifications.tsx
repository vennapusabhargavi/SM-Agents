import React, { useEffect, useMemo, useState } from "react";
import {
  BellIcon,
  SearchIcon,
  FilterIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  UsersIcon,
  BookOpenIcon,
  WrenchIcon,
  AlertTriangleIcon,
  CheckIcon,
  MoreHorizontalIcon,
} from "lucide-react";

type NotificationStatus = "read" | "unread";
type NotificationType = "academic" | "administrative" | "student" | "system" | "maintenance";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  priority: "low" | "medium" | "high";
  timestamp: string;
  sender: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const typeConfig = {
  academic: {
    icon: BookOpenIcon,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-500/10",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  administrative: {
    icon: UsersIcon,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-500/10",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  student: {
    icon: UsersIcon,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-500/10",
    borderColor: "border-green-200 dark:border-green-800",
  },
  system: {
    icon: BellIcon,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-500/10",
    borderColor: "border-orange-200 dark:border-orange-800",
  },
  maintenance: {
    icon: WrenchIcon,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-500/10",
    borderColor: "border-red-200 dark:border-red-800",
  },
};

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost/smart_campus_api";
const TEACHER_API = `${API_BASE}/api/teacher`;

export default function TeacherNotifications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "read" | "unread">("all");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${TEACHER_API}/notifications`, { headers });
        if (res.ok) {
          const data = await res.json();
          const mapped: Notification[] = (data.notifications || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            message: r.message,
            type: r.type as NotificationType,
            status: r.status as "read" | "unread",
            priority: r.priority as "low" | "medium" | "high",
            timestamp: r.timestamp,
            sender: r.sender,
          }));
          setNotifications(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.sender.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || notification.status === statusFilter;
      const matchesType = typeFilter === "all" || notification.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [notifications, searchQuery, statusFilter, typeFilter]);

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("authToken");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      await fetch(`${TEACHER_API}/notifications/${id}/read`, { method: "PUT", headers });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "read" as const } : n))
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAsUnread = (id: string) => {
    // For now, no API for unread
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "unread" as const } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, status: "read" as const }))
    );
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Notifications
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Stay updated with important announcements and actions required
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition text-sm font-medium"
          >
            <CheckIcon size={16} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
              <BellIcon size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {notifications.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center">
              <CircleIcon size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Unread</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {unreadCount}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <AlertTriangleIcon size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">High Priority</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {notifications.filter((n) => n.priority === "high").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
          >
            <option value="all">All Types</option>
            <option value="academic">Academic</option>
            <option value="administrative">Administrative</option>
            <option value="student">Student</option>
            <option value="system">System</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-center">
            <div className="text-slate-600 dark:text-slate-300">Loading notifications...</div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-8 text-center">
            <BellIcon size={48} className="mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-50 mb-2">
              No notifications found
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "You're all caught up! No new notifications."}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const config = typeConfig[notification.type];
            const IconComponent = config.icon;

            return (
              <div
                key={notification.id}
                className={cn(
                  "rounded-xl border bg-white dark:bg-slate-950 p-4 transition hover:shadow-md",
                  notification.status === "unread"
                    ? "border-slate-300 dark:border-slate-700 ring-1 ring-slate-200 dark:ring-slate-800"
                    : "border-slate-200 dark:border-slate-800",
                  notification.priority === "high" && "ring-2 ring-red-200 dark:ring-red-800"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Type Icon */}
                  <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", config.bgColor)}>
                    <IconComponent size={20} className={config.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                            {notification.title}
                          </h3>
                          {notification.status === "unread" && (
                            <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                          )}
                          {notification.priority === "high" && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-full">
                              High Priority
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                          {notification.message}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                          <span>From: {notification.sender}</span>
                          <span>•</span>
                          <span>{formatTimestamp(notification.timestamp)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {notification.actions?.map((action, index) => (
                          <button
                            key={index}
                            onClick={action.onClick}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                          >
                            {action.label}
                          </button>
                        ))}

                        <div className="relative">
                          <button
                            onClick={() => {
                              // Toggle dropdown menu would go here
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          >
                            <MoreHorizontalIcon size={16} className="text-slate-500" />
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            notification.status === "read"
                              ? markAsUnread(notification.id)
                              : markAsRead(notification.id)
                          }
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                          title={notification.status === "read" ? "Mark as unread" : "Mark as read"}
                        >
                          {notification.status === "read" ? (
                            <CircleIcon size={16} className="text-slate-500" />
                          ) : (
                            <CheckCircleIcon size={16} className="text-green-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
