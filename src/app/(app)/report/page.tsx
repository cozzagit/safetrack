"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Users,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  ChevronDown,
  ChevronUp,
  Printer,
  Mail,
  Building2,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface CompanyOption {
  id: string;
  name: string;
}

interface DeadlineDetail {
  type: string;
  category: string;
  dueDate: string;
  status: string;
  daysRemaining: number;
  lastCompleted: string | null;
}

interface EmployeeReport {
  name: string;
  role: string | null;
  roles: string[];
  deadlines: DeadlineDetail[];
  complianceRate: number;
}

interface CategoryStats {
  total: number;
  completed: number;
  overdue: number;
  rate: number;
}

interface ReportData {
  company: {
    name: string;
    atecoCode: string | null;
    riskLevel: string;
    address: string;
    legalRepresentative: string | null;
  };
  generatedAt: string;
  summary: {
    totalEmployees: number;
    totalDeadlines: number;
    completed: number;
    pending: number;
    overdue: number;
    complianceRate: number;
  };
  employees: EmployeeReport[];
  byCategory: Record<string, CategoryStats>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  formazione: "Formazione",
  sorveglianza_sanitaria: "Sorveglianza Sanitaria",
  documenti_aziendali: "Documenti Aziendali",
  verifiche_impianti: "Verifiche Impianti",
  dpi: "DPI",
  altro: "Altro",
};

const RISK_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  basso: {
    label: "Basso",
    color: "var(--color-accent-dark)",
    bg: "var(--color-accent-100)",
  },
  medio: {
    label: "Medio",
    color: "var(--color-warning)",
    bg: "var(--color-warning-100)",
  },
  alto: {
    label: "Alto",
    color: "var(--color-danger)",
    bg: "var(--color-danger-100)",
  },
};

function getComplianceColor(rate: number): {
  color: string;
  bg: string;
} {
  if (rate >= 80)
    return { color: "var(--color-accent-dark)", bg: "var(--color-accent-100)" };
  if (rate >= 60)
    return { color: "var(--color-warning)", bg: "var(--color-warning-100)" };
  return { color: "var(--color-danger)", bg: "var(--color-danger-100)" };
}

function getStatusStyle(status: string) {
  switch (status) {
    case "overdue":
      return { color: "var(--color-danger)", bg: "var(--color-danger-100)", label: "Scaduta" };
    case "expiring_soon":
      return { color: "var(--color-warning)", bg: "var(--color-warning-100)", label: "In scadenza" };
    case "completed":
      return { color: "var(--color-accent-dark)", bg: "var(--color-accent-100)", label: "Completata" };
    default:
      return { color: "var(--color-primary)", bg: "var(--color-primary-50)", label: "In regola" };
  }
}

// ─── Stat Card ──────────────────────────────────────────────────────────────

function StatCard({
  value,
  label,
  Icon,
  colorVar,
  bgVar,
}: {
  value: number | string;
  label: string;
  Icon: React.ElementType;
  colorVar: string;
  bgVar: string;
}) {
  return (
    <div className="stat-card flex flex-col items-center text-center">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
        style={{ backgroundColor: bgVar }}
      >
        <Icon className="w-5 h-5" style={{ color: colorVar }} />
      </div>
      <span
        className="text-2xl font-bold"
        style={{ color: colorVar }}
      >
        {value}
      </span>
      <span
        className="text-xs font-medium mt-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Category Bar ───────────────────────────────────────────────────────────

function CategoryBar({
  name,
  stats,
}: {
  name: string;
  stats: CategoryStats;
}) {
  const { color } = getComplianceColor(stats.rate);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className="text-sm font-medium"
          style={{ color: "var(--color-text-primary)" }}
        >
          {CATEGORY_LABELS[name] ?? name}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {stats.completed}/{stats.total}
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color }}
          >
            {stats.rate}%
          </span>
        </div>
      </div>
      <div
        className="h-2.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-border)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${stats.rate}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {stats.overdue > 0 && (
        <p className="text-xs" style={{ color: "var(--color-danger)" }}>
          {stats.overdue} scadut{stats.overdue === 1 ? "a" : "e"}
        </p>
      )}
    </div>
  );
}

// ─── Employee Row ───────────────────────────────────────────────────────────

function EmployeeRow({ employee }: { employee: EmployeeReport }) {
  const [expanded, setExpanded] = useState(false);
  const { color, bg } = getComplianceColor(employee.complianceRate);

  return (
    <div
      className="border-b last:border-b-0"
      style={{ borderColor: "var(--color-border)" }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
          style={{
            backgroundColor: "var(--color-primary-50)",
            color: "var(--color-primary)",
          }}
        >
          {employee.name
            .split(" ")
            .slice(0, 2)
            .map((n) => n[0])
            .join("")
            .toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {employee.name}
          </p>
          <p
            className="text-xs truncate"
            style={{ color: "var(--color-text-muted)" }}
          >
            {employee.role ?? ""}
            {employee.roles.length > 0
              ? (employee.role ? " · " : "") + employee.roles.join(", ")
              : ""}
          </p>
        </div>

        <span
          className="badge text-xs flex-shrink-0"
          style={{ backgroundColor: bg, color }}
        >
          {employee.complianceRate}%
        </span>

        {expanded ? (
          <ChevronUp
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          />
        ) : (
          <ChevronDown
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "var(--color-text-muted)" }}
          />
        )}
      </button>

      {expanded && employee.deadlines.length > 0 && (
        <div
          className="px-4 pb-4"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <div className="space-y-2">
            {employee.deadlines.map((d, i) => {
              const st = getStatusStyle(d.status);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg"
                  style={{ backgroundColor: "var(--color-surface)" }}
                >
                  <div
                    className="w-1 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: st.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {d.type}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Scadenza: {d.dueDate}
                      {d.lastCompleted ? ` · Ultimo: ${d.lastCompleted}` : ""}
                    </p>
                  </div>
                  <span
                    className="badge text-[10px] flex-shrink-0"
                    style={{ backgroundColor: st.bg, color: st.color }}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Print Footer ───────────────────────────────────────────────────────────

function PrintFooter({ generatedAt }: { generatedAt: string }) {
  return (
    <div
      className="hidden print:block mt-12 pt-4 text-center text-xs"
      style={{
        borderTop: "1px solid var(--color-border)",
        color: "var(--color-text-muted)",
      }}
    >
      <p>
        Generato da <strong>SafeTrack</strong> il{" "}
        {new Date(generatedAt).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const [companiesList, setCompaniesList] = useState<CompanyOption[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load companies
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const json = await res.json();
          const list = (json.data ?? []).map(
            (c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            })
          );
          setCompaniesList(list);
          if (list.length === 1) {
            setSelectedCompanyId(list[0].id);
          }
        }
      } catch {
        // Non-blocking
      }
    }
    loadCompanies();
  }, []);

  // Load report when company changes
  const loadReport = useCallback(async () => {
    if (!selectedCompanyId) {
      setReport(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/reports/company/${selectedCompanyId}`
      );
      if (!res.ok) throw new Error("Errore nel caricamento");
      const json = await res.json();
      setReport(json.data);
    } catch {
      setError("Impossibile generare il report. Riprova.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  function handlePrint() {
    window.print();
  }

  const categoryEntries = report
    ? Object.entries(report.byCategory).sort(
        (a, b) => b[1].total - a[1].total
      )
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary-50)" }}
          >
            <BarChart3
              className="w-5 h-5"
              style={{ color: "var(--color-primary)" }}
            />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Report
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Report di conformità aziendale
            </p>
          </div>
        </div>

        {report && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="btn-primary"
            >
              <Printer className="w-4 h-4" />
              Esporta PDF
            </button>
            <button
              className="btn-secondary"
              disabled
              title="Funzionalità in arrivo"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden sm:inline">Invia al cliente</span>
            </button>
          </div>
        )}
      </div>

      {/* Company selector */}
      <div className="no-print">
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="input-field sm:max-w-sm"
        >
          <option value="">Seleziona un&apos;azienda...</option>
          {companiesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* No company selected */}
      {!selectedCompanyId && !loading && (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Building2
            className="w-12 h-12 mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p
            className="text-base font-semibold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            Seleziona un&apos;azienda
          </p>
          <p
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Scegli un&apos;azienda dal menu per visualizzare il report di conformità.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "var(--color-primary)" }}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="card p-6 text-center"
          style={{ borderColor: "var(--color-danger-100)" }}
        >
          <AlertTriangle
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: "var(--color-danger)" }}
          />
          <p style={{ color: "var(--color-danger)" }}>{error}</p>
          <button onClick={loadReport} className="btn-secondary mt-4">
            Riprova
          </button>
        </div>
      )}

      {/* Report content */}
      {report && !loading && !error && (
        <>
          {/* Print header */}
          <div className="hidden print:block">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
              <span className="text-2xl font-bold" style={{ color: "var(--color-primary)" }}>
                SafeTrack
              </span>
            </div>
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Report di Conformità — {report.company.name}
            </h2>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Generato il{" "}
              {new Date(report.generatedAt).toLocaleDateString("it-IT", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* Company header card */}
          <div className="card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2
                    className="text-lg font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {report.company.name}
                  </h2>
                  {RISK_LABELS[report.company.riskLevel] && (
                    <span
                      className="badge text-xs"
                      style={{
                        backgroundColor:
                          RISK_LABELS[report.company.riskLevel].bg,
                        color:
                          RISK_LABELS[report.company.riskLevel].color,
                      }}
                    >
                      Rischio{" "}
                      {RISK_LABELS[report.company.riskLevel].label}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {report.company.atecoCode && (
                    <span>ATECO {report.company.atecoCode}</span>
                  )}
                  {report.company.address && (
                    <span>{report.company.address}</span>
                  )}
                  {report.company.legalRepresentative && (
                    <span>Legale Rapp.: {report.company.legalRepresentative}</span>
                  )}
                </div>
              </div>
              <p
                className="text-xs flex-shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              >
                {new Date(report.generatedAt).toLocaleDateString("it-IT", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              value={report.summary.totalEmployees}
              label="Dipendenti"
              Icon={Users}
              colorVar="var(--color-primary)"
              bgVar="var(--color-primary-50)"
            />
            <StatCard
              value={report.summary.totalDeadlines}
              label="Scadenze Totali"
              Icon={Calendar}
              colorVar="var(--color-text-secondary)"
              bgVar="var(--color-border-light)"
            />
            <StatCard
              value={`${report.summary.complianceRate}%`}
              label="Tasso Conformità"
              Icon={ShieldCheck}
              colorVar={getComplianceColor(report.summary.complianceRate).color}
              bgVar={getComplianceColor(report.summary.complianceRate).bg}
            />
            <StatCard
              value={report.summary.overdue}
              label="Scadenze Urgenti"
              Icon={AlertTriangle}
              colorVar="var(--color-danger)"
              bgVar="var(--color-danger-50)"
            />
          </div>

          {/* Compliance by category */}
          {categoryEntries.length > 0 && (
            <div className="card p-5">
              <h3
                className="text-sm font-bold mb-4"
                style={{ color: "var(--color-text-primary)" }}
              >
                Conformità per Categoria
              </h3>
              <div className="space-y-4">
                {categoryEntries.map(([name, stats]) => (
                  <CategoryBar key={name} name={name} stats={stats} />
                ))}
              </div>
            </div>
          )}

          {/* Employee compliance table */}
          <div className="card overflow-hidden print-break-before">
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <h3
                className="text-sm font-bold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Dettaglio per Dipendente
              </h3>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Clicca su un dipendente per visualizzare le scadenze
              </p>
            </div>

            {report.employees.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Nessun dipendente con scadenze.
                </p>
              </div>
            ) : (
              <div>
                {report.employees.map((emp, i) => (
                  <EmployeeRow key={i} employee={emp} />
                ))}
              </div>
            )}
          </div>

          {/* Print footer */}
          <PrintFooter generatedAt={report.generatedAt} />
        </>
      )}
    </div>
  );
}
