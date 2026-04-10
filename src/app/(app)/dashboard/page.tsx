"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Building2,
  ShieldCheck,
  Plus,
  QrCode,
  CalendarDays,
  ArrowRight,
  Loader2,
  Calendar,
  Users,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { format } from "date-fns";
import { it } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UpcomingDeadline {
  id: string;
  deadlineTypeName: string;
  employeeName: string | null;
  companyName: string;
  companyId: string;
  category: string;
  dueDate: string;
  daysRemaining: number;
  status: string;
}

interface DashboardStats {
  urgentDeadlines: number;
  expiringDeadlines: number;
  totalCompanies: number;
  totalEmployees: number;
  complianceRate: number;
  upcomingDeadlines: UpcomingDeadline[];
  recentActivity: unknown[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysColor(days: number): string {
  if (days < 0) return "var(--color-danger)";
  if (days <= 7) return "#e65100";
  if (days <= 30) return "var(--color-warning)";
  return "var(--color-accent-dark)";
}

function getDaysBg(days: number): string {
  if (days < 0) return "var(--color-danger-100)";
  if (days <= 7) return "#fff3e0";
  if (days <= 30) return "var(--color-warning-100)";
  return "var(--color-accent-100)";
}

function getDaysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}gg fa`;
  if (days === 0) return "Oggi";
  return `${days}gg`;
}

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    formazione: "Formazione",
    sorveglianza_sanitaria: "Sorveglianza",
    documenti_aziendali: "Documenti",
    verifiche_impianti: "Verifiche",
    dpi: "DPI",
    altro: "Altro",
  };
  return map[cat] || cat;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  Icon,
  colorVar,
  bgVar,
  href,
}: {
  label: string;
  value: string | number;
  sub: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  colorVar: string;
  bgVar: string;
  href?: string;
}) {
  const content = (
    <div
      className={`stat-card ${href ? "card-hover cursor-pointer" : "cursor-default"}`}
      style={{ borderLeft: `3px solid var(${colorVar})` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `var(${bgVar})` }}
        >
          <Icon className="w-5 h-5" style={{ color: `var(${colorVar})` }} />
        </div>
      </div>
      <p
        className="text-3xl font-bold tracking-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        {typeof value === "number" && label.includes("Conformit")
          ? `${value}%`
          : value}
      </p>
      <p
        className="text-sm font-medium mt-0.5"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {label}
      </p>
      <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
        {sub}
      </p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// ─── Compliance Ring ─────────────────────────────────────────────────────────

function ComplianceRing({ rate }: { rate: number }) {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (rate / 100) * circumference;

  return (
    <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="4"
      />
      <circle
        cx="26"
        cy="26"
        r={radius}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
        style={{ transition: "stroke-dashoffset 1s ease-out" }}
      />
      <text
        x="26"
        y="26"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="10"
        fontWeight="bold"
        fill="var(--color-accent-dark)"
      >
        {Math.round(rate)}%
      </text>
    </svg>
  );
}

// ─── Quick Actions ───────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    href: "/aziende/nuova",
    label: "Aggiungi Azienda",
    description: "Registra una nuova azienda cliente",
    Icon: Building2,
    colorVar: "--color-primary",
    bgVar: "--color-primary-50",
  },
  {
    href: "/documenti/scansiona",
    label: "Scansiona Attestato",
    description: "Carica e analizza un documento con AI",
    Icon: QrCode,
    colorVar: "--color-accent",
    bgVar: "--color-accent-50",
  },
  {
    href: "/scadenze",
    label: "Vedi Calendario",
    description: "Controlla tutte le scadenze imminenti",
    Icon: CalendarDays,
    colorVar: "--color-warning",
    bgVar: "--color-warning-50",
  },
] as const;

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Utente";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Errore nel caricamento");
        const json = await res.json();
        setStats(json.data);
      } catch {
        setError("Impossibile caricare la dashboard. Riprova.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = format(new Date(), "EEEE d MMMM yyyy", { locale: it });

  // Loading state
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center py-24">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  // Error state
  if (error || !stats) {
    return (
      <div className="max-w-6xl mx-auto">
        <div
          className="card p-6 text-center"
          style={{ borderColor: "var(--color-danger-100)" }}
        >
          <AlertTriangle
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: "var(--color-danger)" }}
          />
          <p style={{ color: "var(--color-danger)" }}>
            {error || "Errore nel caricamento dei dati"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary mt-4"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Buongiorno, {firstName}
          </h1>
          <p
            className="mt-1 text-sm capitalize"
            style={{ color: "var(--color-text-muted)" }}
          >
            {today}
          </p>
        </div>
        <Link href="/aziende/nuova" className="btn-primary self-start">
          <Plus className="w-4 h-4" />
          Aggiungi Azienda
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Scadenze Urgenti"
          value={stats.urgentDeadlines}
          sub="scadute, da gestire"
          Icon={AlertTriangle}
          colorVar="--color-danger"
          bgVar="--color-danger-50"
          href="/scadenze?status=overdue"
        />
        <StatCard
          label="In Scadenza 30gg"
          value={stats.expiringDeadlines}
          sub="richiedono attenzione"
          Icon={Clock}
          colorVar="--color-warning"
          bgVar="--color-warning-50"
          href="/scadenze?status=expiring_soon"
        />
        <StatCard
          label="Aziende Gestite"
          value={stats.totalCompanies}
          sub={`${stats.totalEmployees} dipendenti`}
          Icon={Building2}
          colorVar="--color-primary"
          bgVar="--color-primary-50"
          href="/aziende"
        />
        <StatCard
          label="Tasso Conformita"
          value={stats.complianceRate}
          sub="scadenze in regola"
          Icon={ShieldCheck}
          colorVar="--color-accent"
          bgVar="--color-accent-50"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming deadlines */}
        <div className="lg:col-span-2 card">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <h2
              className="font-semibold text-base"
              style={{ color: "var(--color-text-primary)" }}
            >
              Prossime Scadenze
            </h2>
            <Link
              href="/scadenze"
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: "var(--color-primary)" }}
            >
              Vedi tutte
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {stats.upcomingDeadlines.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Calendar
                className="w-10 h-10 mx-auto mb-3"
                style={{ color: "var(--color-text-muted)" }}
              />
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                Nessuna scadenza in programma
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                Le scadenze appariranno qui quando verranno create.
              </p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
              {stats.upcomingDeadlines.map((d) => (
                <Link
                  key={d.id}
                  href={`/aziende/${d.companyId}`}
                  className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-[var(--color-primary-50)] transition-colors block"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {d.deadlineTypeName}
                    </p>
                    <p
                      className="text-xs mt-0.5 truncate"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {d.employeeName
                        ? `${d.employeeName} - ${d.companyName}`
                        : d.companyName}
                      {" "}
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
                        style={{
                          backgroundColor: "var(--color-primary-50)",
                          color: "var(--color-primary)",
                        }}
                      >
                        {getCategoryLabel(d.category)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className="text-xs hidden sm:inline"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {d.dueDate}
                    </span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: getDaysBg(d.daysRemaining),
                        color: getDaysColor(d.daysRemaining),
                      }}
                    >
                      {getDaysLabel(d.daysRemaining)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar: quick actions + compliance */}
        <div className="space-y-4">
          <h2
            className="font-semibold text-base"
            style={{ color: "var(--color-text-primary)" }}
          >
            Azioni Rapide
          </h2>
          {QUICK_ACTIONS.map(({ href, label, description, Icon, colorVar, bgVar }) => (
            <Link
              key={href}
              href={href}
              className="card card-hover flex items-start gap-4 p-4 block"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `var(${bgVar})` }}
              >
                <Icon className="w-5 h-5" style={{ color: `var(${colorVar})` }} />
              </div>
              <div className="min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {label}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {description}
                </p>
              </div>
            </Link>
          ))}

          {/* Compliance meter */}
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <ComplianceRing rate={stats.complianceRate} />
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Conformita Media
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {stats.urgentDeadlines > 0
                    ? `${stats.urgentDeadlines} scadenze urgenti da gestire`
                    : "Tutte le scadenze sono in regola"}
                </p>
              </div>
            </div>

            <div
              className="mt-3 h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${stats.complianceRate}%`,
                  background:
                    stats.complianceRate >= 80
                      ? "linear-gradient(90deg, var(--color-accent), var(--color-accent-light))"
                      : stats.complianceRate >= 50
                        ? "linear-gradient(90deg, var(--color-warning), var(--color-warning-light, var(--color-warning)))"
                        : "linear-gradient(90deg, var(--color-danger), var(--color-danger-light, var(--color-danger)))",
                }}
              />
            </div>
          </div>

          {/* Summary counts */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Riepilogo
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Aziende attive</span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {stats.totalCompanies}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-text-muted)" }}>Dipendenti totali</span>
                <span
                  className="font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {stats.totalEmployees}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-danger)" }}>Scadenze urgenti</span>
                <span
                  className="font-bold"
                  style={{ color: "var(--color-danger)" }}
                >
                  {stats.urgentDeadlines}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span style={{ color: "var(--color-warning)" }}>In scadenza 30gg</span>
                <span
                  className="font-bold"
                  style={{ color: "var(--color-warning)" }}
                >
                  {stats.expiringDeadlines}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
