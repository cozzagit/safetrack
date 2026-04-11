"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  Home,
  Building2,
  Calendar,
  FileText,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  User,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { signOut, useSession } from "@/lib/auth-client";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: Home },
  { href: "/aziende", label: "Aziende", Icon: Building2 },
  { href: "/scadenze", label: "Scadenze", Icon: Calendar },
  { href: "/documenti", label: "Documenti", Icon: FileText },
  { href: "/report", label: "Report", Icon: BarChart3 },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const userName = session?.user?.name ?? "Utente";
  const userInitials = userName
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "var(--color-background)" }}>
      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 fixed inset-y-0 left-0 z-30"
        style={{
          backgroundColor: "var(--color-surface)",
          borderRight: `1px solid var(--color-border)`,
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-5 py-5"
          style={{ borderBottom: `1px solid var(--color-border)` }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--color-primary)" }}
          >
            SafeTrack
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href) ? "active" : ""}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div
          className="p-3"
          style={{ borderTop: `1px solid var(--color-border)` }}
        >
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-primary-50)] transition-colors"
                style={{ color: "var(--color-text-primary)" }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                  }}
                >
                  {userInitials}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold truncate">{userName}</p>
                  <p className="text-xs truncate" style={{ color: "var(--color-text-muted)" }}>
                    {session?.user?.email ?? ""}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-text-muted)" }} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[220px] rounded-lg p-1"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: `1px solid var(--color-border)`,
                  boxShadow: "var(--shadow-lg)",
                }}
                side="top"
                align="start"
                sideOffset={8}
              >
                <DropdownMenu.Item asChild>
                  <Link
                    href="/impostazioni/profilo"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-primary-50)] transition-colors outline-none"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    <User className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    Il mio profilo
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item asChild>
                  <Link
                    href="/impostazioni"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-primary-50)] transition-colors outline-none"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    <Settings className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    Impostazioni
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Separator
                  className="my-1 h-px"
                  style={{ backgroundColor: "var(--color-border)" }}
                />
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-danger-50)] transition-colors outline-none"
                  style={{ color: "var(--color-danger)" }}
                  onSelect={handleSignOut}
                >
                  <LogOut className="w-4 h-4" />
                  Disconnetti
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>

      {/* ── Mobile Sidebar Overlay ──────────────────────────── */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ──────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col lg:hidden transition-transform duration-300 ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          backgroundColor: "var(--color-surface)",
          borderRight: `1px solid var(--color-border)`,
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: `1px solid var(--color-border)` }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>
              SafeTrack
            </span>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-2 rounded-lg"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Chiudi menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive(href) ? "active" : ""}`}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: `1px solid var(--color-border)` }}>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ color: "var(--color-danger)" }}
          >
            <LogOut className="w-4 h-4" />
            Disconnetti
          </button>
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0">
        {/* Top Header */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 h-16"
          style={{
            backgroundColor: "var(--color-surface)",
            borderBottom: `1px solid var(--color-border)`,
            boxShadow: "var(--shadow-xs)",
          }}
        >
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-lg"
            style={{ color: "var(--color-text-secondary)" }}
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Apri menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop: page title area (empty — filled by pages) */}
          <div className="hidden lg:block" />

          {/* Right: notifications + user */}
          <div className="flex items-center gap-2">
            {/* Notification bell */}
            <button
              className="relative p-2 rounded-lg transition-colors"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Notifiche"
            >
              <Bell className="w-5 h-5" />
            </button>

            {/* Settings */}
            <Link
              href="/impostazioni"
              className="p-2 rounded-lg transition-colors hidden md:flex items-center justify-center"
              style={{ color: "var(--color-text-secondary)" }}
              aria-label="Impostazioni"
            >
              <Settings className="w-5 h-5" />
            </Link>

            {/* User avatar */}
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  className="flex items-center gap-2 ml-1 rounded-lg px-2 py-1.5 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: "var(--color-primary)", color: "white" }}
                  >
                    {userInitials}
                  </div>
                  <span className="text-sm font-medium hidden md:block">{userName.split(" ")[0]}</span>
                  <ChevronDown className="w-4 h-4 hidden md:block" style={{ color: "var(--color-text-muted)" }} />
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-50 min-w-[200px] rounded-lg p-1"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    border: `1px solid var(--color-border)`,
                    boxShadow: "var(--shadow-lg)",
                  }}
                  align="end"
                  sideOffset={8}
                >
                  <div className="px-3 py-2 mb-1" style={{ borderBottom: `1px solid var(--color-border)` }}>
                    <p className="text-sm font-semibold">{userName}</p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{session?.user?.email}</p>
                  </div>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/impostazioni/profilo"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-primary-50)] transition-colors outline-none"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      <User className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                      Il mio profilo
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/impostazioni"
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-primary-50)] transition-colors outline-none"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      <Settings className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                      Impostazioni
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="my-1 h-px" style={{ backgroundColor: "var(--color-border)" }} />
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-danger-50)] transition-colors outline-none"
                    style={{ color: "var(--color-danger)" }}
                    onSelect={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnetti
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 md:px-6 py-6 pb-24 lg:pb-6 overflow-auto">
          {children}
        </main>

        {/* ── Mobile Bottom Nav ──────────────────────────────── */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around px-2 py-2"
          style={{
            backgroundColor: "var(--color-surface)",
            borderTop: `1px solid var(--color-border)`,
            boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
            paddingBottom: "calc(0.5rem + env(safe-area-inset-bottom))",
          }}
        >
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl min-w-[56px] transition-colors"
                style={{
                  backgroundColor: active ? "var(--color-primary-50)" : "transparent",
                  color: active ? "var(--color-primary)" : "var(--color-text-muted)",
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
