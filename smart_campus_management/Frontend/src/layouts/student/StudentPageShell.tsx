import React from "react";
import { Link } from "react-router-dom";

export type StudentCrumb = { label: string; to?: string };

export function StudentPageShell({
  title,
  subtitle,
  crumbs,
  children,
}: {
  title: string;
  subtitle?: string;
  crumbs?: StudentCrumb[];
  children?: React.ReactNode;
}) {
  return (
    <div className="p-6">
      {crumbs?.length ? (
        <div className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          {crumbs.map((c, idx) => (
            <span key={idx}>
              {c.to ? (
                <Link className="hover:underline" to={c.to}>
                  {c.label}
                </Link>
              ) : (
                <span>{c.label}</span>
              )}
              {idx < crumbs.length - 1 ? " / " : ""}
            </span>
          ))}
        </div>
      ) : null}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {subtitle}
          </p>
        ) : null}

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
