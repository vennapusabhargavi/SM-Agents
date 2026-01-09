import React from "react";

export function TeacherPage({ title }: { title: string }) {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/70 dark:border-slate-800/70">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Minimal demo page (Teacher portal).
      </p>
    </div>
  );
}
