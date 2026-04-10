"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Building2, Users, Plus, QrCode, CalendarDays, ArrowRight, TrendingUp } from "lucide-react";
import { useSession } from "@/lib/auth-client";

const STAT_CARDS = [
  {
    label: "Scadenze Urgenti",
    value: "3",
    sub: "entro 7 giorni",
    Icon: AlertTriangle,
    colorVar: "--color-danger",
    bgVar: "--color-danger-50",
    borderVar: "--color-danger-100",
  },
  {
    label: "In Scadenza (30gg)",
    value: "12",
    sub: "richiedono attenzione",
    Icon: Clock,
    colorVar: "--color-warning",
    bgVar: "--color-warning-50",
    borderVar: "--color-warning-100",
  },
  {
    label: "Aziende Gestite",
    value: "28",
    sub: "+3 questo mese",
    Icon: Building2,
    colorVar: "--color-primary",
    bgVar: "--color-primary-50",
    borderVar: "--color-primary-100",
  },
  {
    label: "Dipendenti Totali",
    value: "347",
    sub: "in 28 aziende",
    Icon: Users,
    colorVar: "--color-accent",
    bgVar: "--color-accent-50",
    borderVar: "--color-accent-100",
  },
] as const;

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

const UPCOMING_DEADLINES = [
  { company: "Edil Costruzioni Srl", type: "Formazione antincendio", daysLeft: 3, employees: 12 },
  { company: "Metalmeccanica Rossi", type: "Aggiornamento RSPP", daysLeft: 5, employees: 45 },
  { company: "Studio Legale Bianchi", type: "Visita medica competente", daysLeft: 7, employees: 8 },
  { company: "Trasporti Lombardi", type: "Patente guida carrelli", daysLeft: 14, employees: 6 },
  { company: "Farmacia Centrale", type: "Corso primo soccorso", daysLeft: 22, employees: 4 },
] as const;

export default function DashboardPage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] ?? "Utente";

  function getDaysColor(days: number): string {
    if (days <= 7) return "var(--color-danger)";
    if (days <= 14) return "var(--color-warning)";
    return "var(--color-accent)";
  }

  function getDaysBg(days: number): string {
    if (days <= 7) return "var(--color-danger-50)";
    if (days <= 14) return "var(--color-warning-50)";
    return "var(--color-accent-50)";
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            className="text-2xl md:text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Buongiorno, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            Ecco un riepilogo della situazione di oggi
          </p>
        </div>
        <Link
          href="/aziende/nuova"
          className="btn-primary self-start"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Azienda
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, sub, Icon, colorVar, bgVar, borderVar }) => (
          <div
            key={label}
            className="stat-card card-hover cursor-default"
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
              {value}
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
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming deadlines */}
        <div className="lg:col-span-2 card">
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: `1px solid var(--color-border)` }}
          >
            <h2 className="font-semibold text-base" style={{ color: "var(--color-text-primary)" }}>
              Scadenze Imminenti
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
          <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
            {UPCOMING_DEADLINES.map((item) => (
              <div key={`${item.company}-${item.type}`} className="px-6 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {item.company}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-text-muted)" }}>
                    {item.type} · {item.employees} dipendenti
                  </p>
                </div>
                <span
                  className="badge flex-shrink-0"
                  style={{
                    backgroundColor: getDaysBg(item.daysLeft),
                    color: getDaysColor(item.daysLeft),
                  }}
                >
                  {item.daysLeft}gg
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-4">
          <h2 className="font-semibold text-base" style={{ color: "var(--color-text-primary)" }}>
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
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                  {description}
                </p>
              </div>
            </Link>
          ))}

          {/* Compliance meter */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Conformità Media
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: "var(--color-accent)" }}>87%</span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: "87%",
                  background: `linear-gradient(90deg, var(--color-accent), var(--color-accent-light))`,
                }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
              3 aziende richiedono interventi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
