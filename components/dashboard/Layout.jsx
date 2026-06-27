import React from "react";

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 p-4 border-r">Sidebar</aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
