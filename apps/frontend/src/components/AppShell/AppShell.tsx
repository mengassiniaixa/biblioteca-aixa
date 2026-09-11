import { Outlet } from "react-router-dom";
import { Topbar } from "./Topbar";
import { Footer } from "./Footer";

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col bg-paper-soft text-ink-soft">
      <Topbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
