"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Link2,
  Share2,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Shield,
  Users,
  FileText,
  Copy,
  Check,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Training {
  type: string;
  completedDate: string | null;
  expiryDate: string | null;
  status: string;
  legalRef: string | null;
  category: string;
}

interface MedicalSurveillance {
  lastVisit: string | null;
  nextVisit: string | null;
  status: string;
  protocol: string;
}

interface EmployeeData {
  name: string;
  fiscalCode: string | null;
  role: string | null;
  hiringDate: string | null;
  specialRoles: string[];
  trainings: Training[];
  medicalSurveillance: MedicalSurveillance;
}

interface CompanyDoc {
  type: string;
  lastUpdate: string | null;
  dueDate: string;
  status: string;
  legalRef: string | null;
}

interface InspectionData {
  company: {
    name: string;
    fiscalCode: string | null;
    atecoCode: string | null;
    riskLevel: string;
    address: string | null;
    city: string | null;
    province: string | null;
    legalRepresentative: string | null;
  };
  rspp: {
    name: string;
    email: string | null;
    phone: string | null;
    companyName: string | null;
  };
  generatedAt: string;
  summary: {
    totalEmployees: number;
    complianceRate: number;
    overdueCount: number;
    documentsCount: number;
  };
  employees: EmployeeData[];
  companyDocuments: CompanyDoc[];
  shareToken: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusIcon({ status }: { status: string }) {
  if (status === "valid")
    return <CheckCircle2 className="w-4 h-4" style={{ color: "#059669" }} />;
  if (status === "expiring")
    return <Clock className="w-4 h-4" style={{ color: "#d97706" }} />;
  if (status === "overdue")
    return <XCircle className="w-4 h-4" style={{ color: "#dc2626" }} />;
  return <span className="w-4 h-4 inline-block" />;
}

function StatusCell({
  date,
  status,
}: {
  date: string | null;
  status: string;
}) {
  const colors: Record<string, { bg: string; text: string }> = {
    valid: { bg: "#ecfdf5", text: "#059669" },
    expiring: { bg: "#fffbeb", text: "#d97706" },
    overdue: { bg: "#fef2f2", text: "#dc2626" },
  };
  const c = colors[status] ?? { bg: "#f8fafc", text: "#94a3b8" };

  return (
    <td
      className="px-2 py-2 text-center text-xs whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <div className="flex items-center justify-center gap-1">
        <StatusIcon status={status} />
        <span className="font-medium">{formatDate(date)}</span>
      </div>
    </td>
  );
}

function RiskLabel({ level }: { level: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    basso: { label: "BASSO", bg: "#ecfdf5", color: "#059669" },
    medio: { label: "MEDIO", bg: "#fffbeb", color: "#d97706" },
    alto: { label: "ALTO", bg: "#fef2f2", color: "#dc2626" },
  };
  const r = map[level] ?? map.basso;
  return (
    <span
      className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      style={{ backgroundColor: r.bg, color: r.color }}
    >
      Rischio {r.label}
    </span>
  );
}

// Training type categories for the matrix columns
const MATRIX_COLUMNS = [
  { key: "formazione_generale", label: "Form.\nGenerale", category: "formazione", match: /general/i },
  { key: "formazione_specifica", label: "Form.\nSpecifica", category: "formazione", match: /specific/i },
  { key: "preposti", label: "Preposti", category: "formazione", match: /preposti/i },
  { key: "antincendio", label: "Anti\nincendio", category: "formazione", match: /antincendio|incendio/i },
  { key: "primo_soccorso", label: "Primo\nSoccorso", category: "formazione", match: /primo soccorso|first aid/i },
  { key: "visita_medica", label: "Visita\nMedica", category: "sorveglianza_sanitaria", match: /.*/ },
];

function findTrainingForColumn(
  trainings: Training[],
  medical: MedicalSurveillance,
  col: (typeof MATRIX_COLUMNS)[number]
): { date: string | null; status: string } {
  if (col.category === "sorveglianza_sanitaria") {
    return {
      date: medical.nextVisit ?? medical.lastVisit,
      status: medical.status === "not_applicable" ? "valid" : medical.status,
    };
  }
  // Find matching training
  const match = trainings.find(
    (t) => t.category === col.category && col.match.test(t.type)
  );
  if (match) {
    return {
      date: match.completedDate ?? match.expiryDate,
      status: match.status,
    };
  }
  return { date: null, status: "not_applicable" };
}

// ─── Page Component ─────────────────────────────────────────────────────────

export default function IspezioneKitPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set()
  );
  const [linkCopied, setLinkCopied] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${id}/inspection-kit`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error?.message ?? "Errore nel caricamento");
        return;
      }
      const json = await res.json();
      setData(json.data);
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function toggleEmployee(name: string) {
    setExpandedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleCopyLink() {
    if (!data) return;
    const url = `${window.location.origin}/api/inspection-kit/${data.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
    }
  }

  function handleWhatsApp() {
    if (!data) return;
    const url = `${window.location.origin}/api/inspection-kit/${data.shareToken}`;
    const text = encodeURIComponent(
      `Fascicolo Conformità Sicurezza — ${data.company.name}\n\nConsulta il fascicolo completo:\n${url}\n\nLink valido 24 ore.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2
          className="w-8 h-8 animate-spin"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <AlertTriangle
          className="w-12 h-12 mx-auto mb-4"
          style={{ color: "var(--color-danger)" }}
        />
        <p
          className="text-base font-semibold mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          {error ?? "Impossibile generare il kit ispezione"}
        </p>
        <Link href={`/aziende/${id}`} className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Torna all&apos;azienda
        </Link>
      </div>
    );
  }

  const { company, rspp, summary, employees: emps, companyDocuments } = data;
  const complianceColor =
    summary.complianceRate >= 90
      ? "#059669"
      : summary.complianceRate >= 70
        ? "#d97706"
        : "#dc2626";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Action buttons — hidden in print */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Link
          href={`/aziende/${id}`}
          className="inline-flex items-center gap-2 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Torna all&apos;azienda
        </Link>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="btn-primary">
            <Printer className="w-4 h-4" />
            Stampa / Salva PDF
          </button>
          <button onClick={handleCopyLink} className="btn-secondary">
            {linkCopied ? (
              <>
                <Check className="w-4 h-4" />
                Copiato!
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Condividi Link
              </>
            )}
          </button>
          <button onClick={handleWhatsApp} className="btn-secondary">
            <Share2 className="w-4 h-4" />
            WhatsApp
          </button>
        </div>
      </div>

      {/* ── HEADER ── */}
      <div
        className="card p-6"
        style={{ borderTop: "4px solid var(--color-primary)" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1
              className="text-lg sm:text-xl font-bold uppercase tracking-wide mb-1"
              style={{ color: "var(--color-primary)" }}
            >
              FASCICOLO CONFORMITA SICUREZZA SUL LAVORO
            </h1>
            <p
              className="text-xs uppercase tracking-wider mb-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              D.Lgs. 81/2008 e s.m.i.
            </p>

            <div className="space-y-1">
              <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                {company.name}
              </p>
              {company.fiscalCode && (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  C.F. / P.IVA: <span className="font-mono">{company.fiscalCode}</span>
                </p>
              )}
              {company.atecoCode && (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Codice ATECO: <span className="font-mono">{company.atecoCode}</span>
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <RiskLabel level={company.riskLevel} />
              </div>
              {(company.address || company.city) && (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Sede: {[company.address, company.city, company.province].filter(Boolean).join(", ")}
                </p>
              )}
              {company.legalRepresentative && (
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  Legale Rappresentante: <strong>{company.legalRepresentative}</strong>
                </p>
              )}
            </div>
          </div>

          <div
            className="p-4 rounded-lg text-sm space-y-1 flex-shrink-0"
            style={{
              backgroundColor: "var(--color-primary-50)",
              border: "1px solid var(--color-primary-100)",
              minWidth: "200px",
            }}
          >
            <p className="font-bold" style={{ color: "var(--color-primary)" }}>
              RSPP Esterno
            </p>
            <p style={{ color: "var(--color-text-primary)" }}>{rspp.name}</p>
            {rspp.companyName && (
              <p style={{ color: "var(--color-text-secondary)" }}>{rspp.companyName}</p>
            )}
            {rspp.email && (
              <p style={{ color: "var(--color-text-secondary)" }}>{rspp.email}</p>
            )}
            {rspp.phone && (
              <p style={{ color: "var(--color-text-secondary)" }}>{rspp.phone}</p>
            )}
            <p className="text-xs mt-2" style={{ color: "var(--color-text-muted)" }}>
              Generato il {formatDateTime(data.generatedAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: Riepilogo Conformita ── */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--color-primary)" }}>
            1. Riepilogo Conformita
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Compliance rate */}
          <div
            className="flex flex-col items-center justify-center p-4 rounded-xl text-center"
            style={{ backgroundColor: complianceColor + "10" }}
          >
            <span className="text-3xl font-bold" style={{ color: complianceColor }}>
              {summary.complianceRate}%
            </span>
            <span className="text-xs font-medium mt-1" style={{ color: complianceColor }}>
              Conformita
            </span>
          </div>

          <div
            className="flex flex-col items-center justify-center p-4 rounded-xl text-center"
            style={{ backgroundColor: "var(--color-primary-50)" }}
          >
            <span className="text-3xl font-bold" style={{ color: "var(--color-primary)" }}>
              {summary.totalEmployees}
            </span>
            <span className="text-xs font-medium mt-1" style={{ color: "var(--color-primary)" }}>
              Dipendenti
            </span>
          </div>

          <div
            className="flex flex-col items-center justify-center p-4 rounded-xl text-center"
            style={{
              backgroundColor:
                summary.overdueCount > 0 ? "var(--color-danger-50)" : "var(--color-accent-50)",
            }}
          >
            <span
              className="text-3xl font-bold"
              style={{
                color:
                  summary.overdueCount > 0 ? "var(--color-danger)" : "var(--color-accent)",
              }}
            >
              {summary.overdueCount}
            </span>
            <span
              className="text-xs font-medium mt-1"
              style={{
                color:
                  summary.overdueCount > 0 ? "var(--color-danger)" : "var(--color-accent)",
              }}
            >
              Non conformi
            </span>
          </div>

          <div
            className="flex flex-col items-center justify-center p-4 rounded-xl text-center"
            style={{ backgroundColor: "var(--color-accent-50)" }}
          >
            <span className="text-3xl font-bold" style={{ color: "var(--color-accent)" }}>
              {summary.documentsCount}
            </span>
            <span className="text-xs font-medium mt-1" style={{ color: "var(--color-accent)" }}>
              Adempimenti
            </span>
          </div>
        </div>

        {/* Overdue items list */}
        {summary.overdueCount > 0 && (
          <div
            className="mt-4 p-4 rounded-lg"
            style={{
              backgroundColor: "var(--color-danger-50)",
              border: "1px solid var(--color-danger-100)",
            }}
          >
            <p className="text-sm font-bold mb-2" style={{ color: "var(--color-danger)" }}>
              Adempimenti non conformi:
            </p>
            <ul className="space-y-1">
              {emps
                .flatMap((emp) =>
                  emp.trainings
                    .filter((t) => t.status === "overdue")
                    .map((t) => ({
                      employee: emp.name,
                      training: t.type,
                      date: t.expiryDate,
                    }))
                )
                .map((item, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-center gap-2"
                    style={{ color: "var(--color-danger)" }}
                  >
                    <XCircle className="w-3 h-3 flex-shrink-0" />
                    <span>
                      <strong>{item.employee}</strong> — {item.training}{" "}
                      (scad. {formatDate(item.date)})
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── SECTION 2: Matrice Formazione ── */}
      <div className="card p-6 print-break-before">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--color-primary)" }}>
            2. Matrice Formazione Dipendenti
          </h2>
        </div>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-xs border-collapse" style={{ minWidth: "700px" }}>
            <thead>
              <tr>
                <th
                  className="px-3 py-2 text-left font-semibold"
                  style={{
                    backgroundColor: "var(--color-primary)",
                    color: "white",
                    borderRadius: "6px 0 0 0",
                  }}
                >
                  Dipendente
                </th>
                <th
                  className="px-2 py-2 text-left font-semibold"
                  style={{ backgroundColor: "var(--color-primary)", color: "white" }}
                >
                  Mansione
                </th>
                {MATRIX_COLUMNS.map((col, i) => (
                  <th
                    key={col.key}
                    className="px-2 py-2 text-center font-semibold whitespace-pre-line"
                    style={{
                      backgroundColor: "var(--color-primary)",
                      color: "white",
                      borderRadius:
                        i === MATRIX_COLUMNS.length - 1 ? "0 6px 0 0" : undefined,
                    }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {emps.map((emp, idx) => {
                return (
                  <tr
                    key={emp.name}
                    style={{
                      backgroundColor: idx % 2 === 0 ? "white" : "var(--color-background)",
                    }}
                  >
                    <td
                      className="px-3 py-2 font-medium"
                      style={{
                        color: "var(--color-text-primary)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {emp.name}
                      {emp.specialRoles.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {emp.specialRoles.map((r) => (
                            <span
                              key={r}
                              className="inline-block px-1.5 py-0 rounded text-[9px] font-bold uppercase"
                              style={{
                                backgroundColor: "var(--color-primary-50)",
                                color: "var(--color-primary)",
                              }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-2 py-2 text-xs"
                      style={{
                        color: "var(--color-text-secondary)",
                        borderBottom: "1px solid var(--color-border)",
                      }}
                    >
                      {emp.role ?? "—"}
                    </td>
                    {MATRIX_COLUMNS.map((col) => {
                      const { date, status } = findTrainingForColumn(
                        emp.trainings,
                        emp.medicalSurveillance,
                        col
                      );
                      return (
                        <StatusCell
                          key={col.key}
                          date={date}
                          status={status}
                        />
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            Legenda:
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "#059669" }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Conforme
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "#d97706" }}>
            <Clock className="w-3.5 h-3.5" /> In scadenza (30gg)
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: "#dc2626" }}>
            <XCircle className="w-3.5 h-3.5" /> Scaduto / Non conforme
          </span>
        </div>
      </div>

      {/* ── SECTION 3: Documenti Aziendali ── */}
      {companyDocuments.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
            <h2 className="text-base font-bold" style={{ color: "var(--color-primary)" }}>
              3. Documenti Aziendali
            </h2>
          </div>

          <div className="space-y-2">
            {companyDocuments.map((doc, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{
                  backgroundColor:
                    doc.status === "overdue"
                      ? "var(--color-danger-50)"
                      : doc.status === "expiring"
                        ? "var(--color-warning-50)"
                        : "var(--color-background)",
                  border: `1px solid ${
                    doc.status === "overdue"
                      ? "var(--color-danger-100)"
                      : doc.status === "expiring"
                        ? "var(--color-warning-100)"
                        : "var(--color-border)"
                  }`,
                }}
              >
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {doc.type}
                  </p>
                  {doc.legalRef && (
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {doc.legalRef}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1">
                    <StatusIcon status={doc.status} />
                    <span
                      className="text-xs font-medium"
                      style={{
                        color:
                          doc.status === "overdue"
                            ? "var(--color-danger)"
                            : doc.status === "expiring"
                              ? "var(--color-warning)"
                              : "var(--color-accent)",
                      }}
                    >
                      {doc.status === "overdue"
                        ? "Scaduto"
                        : doc.status === "expiring"
                          ? "In scadenza"
                          : "Conforme"}
                    </span>
                  </div>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    Scad. {formatDate(doc.dueDate)}
                  </p>
                  {doc.lastUpdate && (
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      Agg. {formatDate(doc.lastUpdate)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION 4: Dettaglio per Dipendente ── */}
      <div className="card p-6 print-break-before">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" style={{ color: "var(--color-primary)" }} />
          <h2 className="text-base font-bold" style={{ color: "var(--color-primary)" }}>
            {companyDocuments.length > 0 ? "4" : "3"}. Dettaglio per Dipendente
          </h2>
        </div>

        <div className="space-y-3">
          {emps.map((emp) => {
            const isExpanded = expandedEmployees.has(emp.name);
            const overdueCount = emp.trainings.filter(
              (t) => t.status === "overdue"
            ).length;

            return (
              <div
                key={emp.name}
                className="rounded-lg overflow-hidden"
                style={{ border: "1px solid var(--color-border)" }}
              >
                {/* Expandable header — clickable on screen, always expanded in print */}
                <button
                  onClick={() => toggleEmployee(emp.name)}
                  className="w-full flex items-center justify-between p-4 text-left no-print"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        backgroundColor: "var(--color-primary-50)",
                        color: "var(--color-primary)",
                      }}
                    >
                      {emp.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {emp.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {emp.role ?? "Nessuna mansione"}
                        {emp.fiscalCode ? ` — ${emp.fiscalCode}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {overdueCount > 0 && (
                      <span
                        className="badge text-[10px]"
                        style={{
                          backgroundColor: "var(--color-danger-100)",
                          color: "var(--color-danger)",
                        }}
                      >
                        {overdueCount} scadut{overdueCount === 1 ? "a" : "e"}
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    ) : (
                      <ChevronDown className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    )}
                  </div>
                </button>

                {/* Print-only header */}
                <div
                  className="hidden print-break-before"
                  style={{
                    display: "none",
                    backgroundColor: "var(--color-background)",
                    padding: "12px 16px",
                  }}
                >
                  <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {emp.name}
                    {emp.role ? ` — ${emp.role}` : ""}
                    {emp.fiscalCode ? ` — C.F. ${emp.fiscalCode}` : ""}
                  </p>
                </div>

                {/* Detail content — shown when expanded on screen, always in print */}
                <div
                  className={isExpanded ? "block" : "hidden"}
                  style={{ display: undefined }}
                  data-print-show="true"
                >
                  <div className="p-4 space-y-4">
                    {/* Personal info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <p style={{ color: "var(--color-text-muted)" }}>Data Assunzione</p>
                        <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {formatDate(emp.hiringDate)}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--color-text-muted)" }}>Codice Fiscale</p>
                        <p className="font-mono font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {emp.fiscalCode ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--color-text-muted)" }}>Ruoli Speciali</p>
                        <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {emp.specialRoles.length > 0 ? emp.specialRoles.join(", ") : "—"}
                        </p>
                      </div>
                      <div>
                        <p style={{ color: "var(--color-text-muted)" }}>Protocollo Sanitario</p>
                        <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {emp.medicalSurveillance.protocol}
                        </p>
                      </div>
                    </div>

                    {/* Training details table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse">
                        <thead>
                          <tr style={{ backgroundColor: "var(--color-background)" }}>
                            <th className="px-3 py-2 text-left font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                              Adempimento
                            </th>
                            <th className="px-3 py-2 text-left font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                              Rif. Normativo
                            </th>
                            <th className="px-3 py-2 text-center font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                              Completato
                            </th>
                            <th className="px-3 py-2 text-center font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                              Scadenza
                            </th>
                            <th className="px-3 py-2 text-center font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                              Stato
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {emp.trainings.map((t, ti) => (
                            <tr
                              key={ti}
                              style={{
                                borderBottom: "1px solid var(--color-border)",
                                backgroundColor:
                                  t.status === "overdue"
                                    ? "var(--color-danger-50)"
                                    : "transparent",
                              }}
                            >
                              <td className="px-3 py-2 font-medium" style={{ color: "var(--color-text-primary)" }}>
                                {t.type}
                              </td>
                              <td className="px-3 py-2" style={{ color: "var(--color-text-muted)" }}>
                                {t.legalRef ?? "—"}
                              </td>
                              <td className="px-3 py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>
                                {formatDate(t.completedDate)}
                              </td>
                              <td className="px-3 py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>
                                {formatDate(t.expiryDate)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <StatusIcon status={t.status} />
                                  <span
                                    className="font-medium"
                                    style={{
                                      color:
                                        t.status === "overdue"
                                          ? "#dc2626"
                                          : t.status === "expiring"
                                            ? "#d97706"
                                            : "#059669",
                                    }}
                                  >
                                    {t.status === "overdue"
                                      ? "Scaduto"
                                      : t.status === "expiring"
                                        ? "In scadenza"
                                        : "Conforme"}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {/* Medical surveillance row */}
                          <tr
                            style={{
                              borderBottom: "1px solid var(--color-border)",
                              backgroundColor:
                                emp.medicalSurveillance.status === "overdue"
                                  ? "var(--color-danger-50)"
                                  : "transparent",
                            }}
                          >
                            <td className="px-3 py-2 font-medium" style={{ color: "var(--color-text-primary)" }}>
                              Sorveglianza Sanitaria
                            </td>
                            <td className="px-3 py-2" style={{ color: "var(--color-text-muted)" }}>
                              D.Lgs. 81/08 art. 41
                            </td>
                            <td className="px-3 py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>
                              {formatDate(emp.medicalSurveillance.lastVisit)}
                            </td>
                            <td className="px-3 py-2 text-center" style={{ color: "var(--color-text-secondary)" }}>
                              {formatDate(emp.medicalSurveillance.nextVisit)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <StatusIcon status={emp.medicalSurveillance.status} />
                                <span
                                  className="font-medium"
                                  style={{
                                    color:
                                      emp.medicalSurveillance.status === "overdue"
                                        ? "#dc2626"
                                        : emp.medicalSurveillance.status === "expiring"
                                          ? "#d97706"
                                          : "#059669",
                                  }}
                                >
                                  {emp.medicalSurveillance.status === "overdue"
                                    ? "Scaduta"
                                    : emp.medicalSurveillance.status === "expiring"
                                      ? "In scadenza"
                                      : emp.medicalSurveillance.status === "not_applicable"
                                        ? "N/A"
                                        : "Conforme"}
                                </span>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div
        className="text-center text-xs py-4 space-y-1"
        style={{ color: "var(--color-text-muted)" }}
      >
        <p>
          Documento generato da <strong>SafeTrack</strong> il{" "}
          {formatDateTime(data.generatedAt)}
        </p>
        <p>Validita: alla data di generazione</p>
      </div>
    </div>
  );
}
