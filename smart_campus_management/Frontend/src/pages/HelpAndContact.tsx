import React from "react";
import { HelpCircleIcon, MailIcon, PhoneIcon, MessageCircleIcon } from "lucide-react";

export const HelpAndContact: React.FC = () => {
  const supportEmail = "support@smartcampus.edu";
  const supportPhone = "+91-0000-000-000";

  return (
    <div className="p-6 space-y-6">
      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <HelpCircleIcon size={18} className="text-slate-500 dark:text-slate-300" />
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
            Help & Contact
          </h1>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
          If anything looks incorrect or you need support, contact your campus office using the details below.
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <PhoneIcon size={16} className="text-emerald-500" />
            Phone
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Call for urgent questions or access issues.
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mt-1">
            {supportPhone}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <MailIcon size={16} className="text-sky-500" />
            Email
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            For non-urgent queries, email support.
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-50 mt-1">
            {supportEmail}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50">
            <MessageCircleIcon size={16} className="text-emerald-500" />
            Notes
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            When reporting an issue, note down relevant IDs (Register No / Course Code / Request ID) for faster support.
          </p>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <p className="font-semibold text-slate-900 dark:text-slate-50">FAQ</p>
        <p>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            Can I edit everything in this portal?
          </span>{" "}
          Some modules are read-only depending on your role.
        </p>
        <p>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            Who can approve requests?
          </span>{" "}
          Approvals depend on Faculty/Admin permissions.
        </p>
      </section>
    </div>
  );
};
