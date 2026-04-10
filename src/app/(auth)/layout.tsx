import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "SafeTrack — Accesso",
  description: "Accedi a SafeTrack per gestire la sicurezza sul lavoro.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background)" }}
    >
      {/* Minimal header */}
      <header className="px-6 py-4 border-b" style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}>
        <Link href="/" className="inline-flex items-center gap-2 group">
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
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center" style={{ borderTop: `1px solid var(--color-border)` }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          &copy; {new Date().getFullYear()} SafeTrack. Tutti i diritti riservati.
        </p>
      </footer>
    </div>
  );
}
