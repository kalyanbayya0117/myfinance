"use client";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-50 md:pl-64">
      <Sidebar onClose={() => {}} />

      <div className="flex-1 flex flex-col">
        <Topbar />
        <main className="p-6 pb-24 md:pb-6">{children}</main>
      </div>
    </div>
  );
}