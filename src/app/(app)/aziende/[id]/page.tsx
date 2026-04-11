"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Plus,
  Loader2,
  X,
  AlertCircle,
  ShieldAlert,
  Star,
  Flame,
  Heart,
  ChevronRight,
} from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";
import { DeadlineStatusBadge } from "@/components/shared/DeadlineStatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  role: string | null;
  jobTitle: string | null;
  isPreposto: boolean;
  isDirigente: boolean;
  isRls: boolean;
  isAddettoAntincendio: boolean;
  isAddettoPrimoSoccorso: boolean;
  compliance?: { compliancePercent: number; total: number; completed: number };
}

interface Deadline {
  id: string;
  dueDate: string;
  completedDate: string | null;
  status: string;
  priority: string;
  notes: string | null;
  employeeId: string | null;
  deadlineTypeId: number;
}

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  title: string | null;
  createdAt: string;
}

interface Company {
  id: string;
  name: string;
  fiscalCode: string | null;
  atecoCode: string | null;
  riskLevel: "basso" | "medio" | "alto";
  address: string | null;
  city: string | null;
  province: string | null;
  cap: string | null;
  legalRepresentative: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  employeeCount: number;
  notes: string | null;
  isActive: boolean;
  employees: Employee[];
  deadlineSummary: {
    total: number;
    overdue: number;
    expiringSoon: number;
    completed: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleTags(emp: Employee): string[] {
  const tags: string[] = [];
  if (emp.isPreposto) tags.push("Preposto");
  if (emp.isDirigente) tags.push("Dirigente");
  if (emp.isRls) tags.push("RLS");
  if (emp.isAddettoAntincendio) tags.push("Antincendio");
  if (emp.isAddettoPrimoSoccorso) tags.push("Primo Soccorso");
  return tags;
}

function CompliancePill({ percent }: { percent: number }) {
  let color = "var(--color-accent)";
  let bg = "var(--color-accent-100)";
  if (percent < 60) { color = "var(--color-danger)"; bg = "var(--color-danger-100)"; }
  else if (percent < 80) { color = "var(--color-warning)"; bg = "var(--color-warning-100)"; }

  return (
    <span
      className="badge text-xs"
      style={{ backgroundColor: bg, color }}
    >
      {percent}%
    </span>
  );
}

// ─── Add Employee Modal ───────────────────────────────────────────────────────

interface AddEmployeeModalProps {
  companyId: string;
  onSuccess: (generatedCount: number) => void;
  onClose: () => void;
}

interface EmployeeForm {
  firstName: string;
  lastName: string;
  fiscalCode: string;
  role: string;
  jobTitle: string;
  hiringDate: string;
  isPreposto: boolean;
  isDirigente: boolean;
  isRls: boolean;
  isAddettoAntincendio: boolean;
  isAddettoPrimoSoccorso: boolean;
  medicalProtocol: string;
  notes: string;
}

const EMPLOYEE_INITIAL: EmployeeForm = {
  firstName: "",
  lastName: "",
  fiscalCode: "",
  role: "",
  jobTitle: "",
  hiringDate: "",
  isPreposto: false,
  isDirigente: false,
  isRls: false,
  isAddettoAntincendio: false,
  isAddettoPrimoSoccorso: false,
  medicalProtocol: "",
  notes: "",
};

function AddEmployeeModal({ companyId, onSuccess, onClose }: AddEmployeeModalProps) {
  const [form, setForm] = useState<EmployeeForm>(EMPLOYEE_INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function updateField(field: keyof EmployeeForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    };
  }

  function toggleBool(field: keyof EmployeeForm) {
    return () => setForm((prev) => ({ ...prev, [field]: !prev[field] }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Il nome è obbligatorio";
    if (!form.lastName.trim()) e.lastName = "Il cognome è obbligatorio";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setApiError(null);

    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        fiscalCode: form.fiscalCode.trim() || null,
        role: form.role.trim() || null,
        jobTitle: form.jobTitle.trim() || null,
        hiringDate: form.hiringDate
          ? new Date(form.hiringDate).toISOString()
          : null,
        isPreposto: form.isPreposto,
        isDirigente: form.isDirigente,
        isRls: form.isRls,
        isAddettoAntincendio: form.isAddettoAntincendio,
        isAddettoPrimoSoccorso: form.isAddettoPrimoSoccorso,
        medicalProtocol: form.medicalProtocol.trim() || null,
        notes: form.notes.trim() || null,
      };

      const res = await fetch(`/api/companies/${companyId}/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        const errMsg = json?.error?.message ?? "Errore durante il salvataggio";
        const details = json?.error?.details;
        if (details && Array.isArray(details)) {
          // Show specific field errors from Zod
          const fieldErrors = details.map((d: { path?: string[]; message?: string }) =>
            `${d.path?.join('.') || 'campo'}: ${d.message || 'non valido'}`
          ).join(', ');
          setApiError(fieldErrors || errMsg);
        } else {
          setApiError(errMsg);
        }
        return;
      }

      const json = await res.json();
      onSuccess(json.data?.generatedDeadlines ?? 0);
    } catch {
      setApiError("Errore di rete. Controlla la connessione.");
    } finally {
      setSubmitting(false);
    }
  }

  const ROLE_FLAGS: { key: keyof EmployeeForm; label: string; Icon: React.ElementType }[] = [
    { key: "isPreposto", label: "Preposto", Icon: Star },
    { key: "isDirigente", label: "Dirigente", Icon: ShieldAlert },
    { key: "isRls", label: "RLS", Icon: Users },
    { key: "isAddettoAntincendio", label: "Addetto Antincendio", Icon: Flame },
    { key: "isAddettoPrimoSoccorso", label: "Addetto Primo Soccorso", Icon: Heart },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg max-h-[92dvh] flex flex-col overflow-hidden"
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
          boxShadow: "var(--shadow-xl)",
        }}
        // For desktop — full radius
        data-rounded="sm:rounded-2xl"
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div>
            <h2
              className="text-base font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Aggiungi Dipendente
            </h2>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Le scadenze verranno generate automaticamente
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg"
            style={{ color: "var(--color-text-muted)" }}
            aria-label="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          <form id="employee-form" onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* API error */}
            {apiError && (
              <div
                className="flex items-start gap-2 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: "var(--color-danger-50)",
                  color: "var(--color-danger)",
                  border: "1px solid var(--color-danger-100)",
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {apiError}
              </div>
            )}

            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">
                  Nome <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={updateField("firstName")}
                  className={`input-field ${errors.firstName ? "error" : ""}`}
                  placeholder="Mario"
                  autoComplete="given-name"
                />
                {errors.firstName && (
                  <p className="error-message">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="input-label">
                  Cognome <span style={{ color: "var(--color-danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={updateField("lastName")}
                  className={`input-field ${errors.lastName ? "error" : ""}`}
                  placeholder="Rossi"
                  autoComplete="family-name"
                />
                {errors.lastName && (
                  <p className="error-message">{errors.lastName}</p>
                )}
              </div>
            </div>

            <div>
              <label className="input-label">Codice Fiscale</label>
              <input
                type="text"
                value={form.fiscalCode}
                onChange={updateField("fiscalCode")}
                className="input-field"
                placeholder="RSSMRA80A01H501Z"
                maxLength={16}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Mansione (Ruolo)</label>
                <input
                  type="text"
                  value={form.role}
                  onChange={updateField("role")}
                  className="input-field"
                  placeholder="es. Operaio"
                />
              </div>
              <div>
                <label className="input-label">Qualifica</label>
                <input
                  type="text"
                  value={form.jobTitle}
                  onChange={updateField("jobTitle")}
                  className="input-field"
                  placeholder="es. Elettricista"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Data Assunzione</label>
              <input
                type="date"
                value={form.hiringDate}
                onChange={updateField("hiringDate")}
                className="input-field"
              />
            </div>

            {/* Role flags */}
            <div>
              <label className="input-label mb-3">Ruoli Speciali</label>
              <div className="grid grid-cols-1 gap-2">
                {ROLE_FLAGS.map(({ key, label, Icon }) => (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 rounded-lg cursor-pointer select-none"
                    style={{
                      border: `1.5px solid ${form[key] ? "var(--color-primary)" : "var(--color-border)"}`,
                      backgroundColor: form[key]
                        ? "var(--color-primary-50)"
                        : "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={form[key] as boolean}
                      onChange={toggleBool(key)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: form[key]
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                      }}
                    >
                      {form[key] && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                    <Icon
                      className="w-4 h-4 flex-shrink-0"
                      style={{
                        color: form[key]
                          ? "var(--color-primary)"
                          : "var(--color-text-muted)",
                      }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: form[key]
                          ? "var(--color-primary)"
                          : "var(--color-text-secondary)",
                      }}
                    >
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="input-label">Protocollo Sanitario</label>
              <input
                type="text"
                value={form.medicalProtocol}
                onChange={updateField("medicalProtocol")}
                className="input-field"
                placeholder="es. Visita annuale + audiometria"
              />
            </div>

            <div>
              <label className="input-label">Note</label>
              <textarea
                value={form.notes}
                onChange={updateField("notes")}
                className="input-field resize-none"
                rows={3}
                placeholder="Note aggiuntive..."
              />
            </div>
          </form>
        </div>

        {/* Modal footer */}
        <div
          className="px-5 py-4 flex gap-3 flex-shrink-0"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            Annulla
          </button>
          <button
            type="submit"
            form="employee-form"
            className="btn-primary flex-1"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Aggiungi
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Success toast ─────────────────────────────────────────────────────────────

function SuccessToast({
  generatedCount,
  onDismiss,
}: {
  generatedCount: number;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl"
      style={{
        backgroundColor: "var(--color-accent)",
        color: "white",
        minWidth: "280px",
        maxWidth: "90vw",
      }}
    >
      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
      <div className="flex-1 text-sm font-medium">
        Dipendente aggiunto.{" "}
        {generatedCount > 0
          ? `${generatedCount} scadenz${generatedCount === 1 ? "a generata" : "e generate"} automaticamente.`
          : "Nessuna scadenza applicabile."}
      </div>
      <button onClick={onDismiss} className="flex-shrink-0 opacity-80 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Tab: Dipendenti ──────────────────────────────────────────────────────────

function EmployeesTab({
  employees,
  companyId,
  onEmployeeAdded,
}: {
  employees: Employee[];
  companyId: string;
  onEmployeeAdded: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ generatedCount: number } | null>(null);

  function handleSuccess(generatedCount: number) {
    setShowModal(false);
    setToast({ generatedCount });
    onEmployeeAdded();
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          {employees.length}{" "}
          {employees.length === 1 ? "dipendente" : "dipendenti"}
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Aggiungi Dipendente
        </button>
      </div>

      {employees.length === 0 ? (
        <div
          className="card flex flex-col items-center justify-center py-16 text-center"
        >
          <Users
            className="w-10 h-10 mb-3"
            style={{ color: "var(--color-text-muted)" }}
          />
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            Nessun dipendente ancora
          </p>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Aggiungi i dipendenti per tracciare le loro scadenze formative.
          </p>
        </div>
      ) : (
        <div className="card divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
          {employees.map((emp) => {
            const tags = getRoleTags(emp);
            const compliance = emp.compliance?.compliancePercent ?? 100;
            return (
              <div
                key={emp.id}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: "var(--color-primary-50)",
                    color: "var(--color-primary)",
                  }}
                >
                  {emp.firstName[0]}{emp.lastName[0]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-semibold truncate"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p
                    className="text-xs truncate"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {[emp.role, emp.jobTitle].filter(Boolean).join(" · ") || "Nessuna mansione specificata"}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="badge text-[10px] px-1.5 py-0"
                          style={{
                            backgroundColor: "var(--color-primary-50)",
                            color: "var(--color-primary)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Compliance */}
                <CompliancePill percent={compliance} />
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AddEmployeeModal
          companyId={companyId}
          onSuccess={handleSuccess}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Toast */}
      {toast && (
        <SuccessToast
          generatedCount={toast.generatedCount}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

// ─── Tab: Scadenze ────────────────────────────────────────────────────────────

function DeadlinesTab({
  companyId,
  employees,
}: {
  companyId: string;
  employees: Employee[];
}) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    async function load() {
      try {
        // We fetch company detail again to get fresh deadlines — in a real app
        // there'd be a dedicated /api/companies/:id/deadlines endpoint.
        // For now we fetch all deadlines through the company endpoint.
        const res = await fetch(`/api/companies/${companyId}`);
        if (res.ok) {
          const json = await res.json();
          // The route doesn't return deadlines list directly, just summary.
          // We'll show a placeholder and the summary data.
          setDeadlines([]);
        }
      } catch {
        // Silently fail — show empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={filterEmployee}
          onChange={(e) => setFilterEmployee(e.target.value)}
          className="input-field text-sm"
        >
          <option value="">Tutti i dipendenti</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.firstName} {emp.lastName}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="input-field text-sm"
        >
          <option value="">Tutti gli stati</option>
          <option value="overdue">Scadute</option>
          <option value="expiring_soon">In scadenza</option>
          <option value="pending">In regola</option>
          <option value="completed">Completate</option>
        </select>
      </div>

      {/* Empty state */}
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <Calendar
          className="w-10 h-10 mb-3"
          style={{ color: "var(--color-text-muted)" }}
        />
        <p
          className="text-sm font-semibold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          Nessuna scadenza da mostrare
        </p>
        <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
          Le scadenze vengono generate automaticamente quando aggiungi dipendenti.
        </p>
        <Link href="/scadenze" className="btn-secondary text-sm">
          Vedi tutte le scadenze
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

// ─── Tab: Documenti ───────────────────────────────────────────────────────────

function DocumentsTab() {
  return (
    <div className="card flex flex-col items-center justify-center py-16 text-center">
      <FileText
        className="w-10 h-10 mb-3"
        style={{ color: "var(--color-text-muted)" }}
      />
      <p
        className="text-sm font-semibold mb-1"
        style={{ color: "var(--color-text-primary)" }}
      >
        Nessun documento caricato
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--color-text-muted)" }}>
        Carica attestati, verbali e certificati per questa azienda.
      </p>
      <button className="btn-secondary text-sm" disabled>
        <Plus className="w-4 h-4" />
        Carica documento (in arrivo)
      </button>
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────

function StatChip({
  value,
  label,
  colorVar,
  bgVar,
  Icon,
}: {
  value: number;
  label: string;
  colorVar: string;
  bgVar: string;
  Icon: React.ElementType;
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl text-center"
      style={{ backgroundColor: `var(${bgVar})` }}
    >
      <Icon className="w-5 h-5 mb-1" style={{ color: `var(${colorVar})` }} />
      <span
        className="text-2xl font-bold"
        style={{ color: `var(${colorVar})` }}
      >
        {value}
      </span>
      <span className="text-xs font-medium mt-0.5" style={{ color: `var(${colorVar})` }}>
        {label}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "dipendenti" | "scadenze" | "documenti";

export default function AziendaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("dipendenti");
  const [archiving, setArchiving] = useState(false);

  const loadCompany = useCallback(async () => {
    try {
      const res = await fetch(`/api/companies/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError("Azienda non trovata.");
        } else {
          setError("Errore nel caricamento.");
        }
        return;
      }
      const json = await res.json();
      setCompany(json.data);
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  async function handleArchive() {
    if (!company) return;
    if (!window.confirm(`Archiviare "${company.name}"? Sarà rimossa dalla lista aziende attive.`)) return;

    setArchiving(true);
    try {
      await fetch(`/api/companies/${id}`, { method: "DELETE" });
      router.push("/aziende");
    } catch {
      setArchiving(false);
    }
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
  if (error || !company) {
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
          {error ?? "Azienda non trovata"}
        </p>
        <Link href="/aziende" className="btn-secondary">
          <ArrowLeft className="w-4 h-4" />
          Torna alle aziende
        </Link>
      </div>
    );
  }

  const { deadlineSummary } = company;
  const inRegola =
    deadlineSummary.total -
    deadlineSummary.overdue -
    deadlineSummary.expiringSoon;

  const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
    { id: "dipendenti", label: "Dipendenti", Icon: Users },
    { id: "scadenze", label: "Scadenze", Icon: Calendar },
    { id: "documenti", label: "Documenti", Icon: FileText },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/aziende"
        className="inline-flex items-center gap-2 text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Le tue aziende
      </Link>

      {/* Company header card */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "var(--color-primary-50)" }}
            >
              <Building2
                className="w-6 h-6"
                style={{ color: "var(--color-primary)" }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1
                  className="text-xl font-bold tracking-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {company.name}
                </h1>
                <RiskBadge level={company.riskLevel} size="sm" />
              </div>

              {company.atecoCode && (
                <p
                  className="text-xs font-mono mb-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ATECO {company.atecoCode}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(company.city || company.province) && (
                  <div
                    className="flex items-center gap-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="text-xs">
                      {[company.city, company.province].filter(Boolean).join(", ")}
                      {company.cap ? ` ${company.cap}` : ""}
                    </span>
                  </div>
                )}
                {company.legalRepresentative && (
                  <div
                    className="flex items-center gap-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="text-xs">{company.legalRepresentative}</span>
                  </div>
                )}
                {company.contactEmail && (
                  <a
                    href={`mailto:${company.contactEmail}`}
                    className="flex items-center gap-1"
                    style={{ color: "var(--color-primary)" }}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span className="text-xs">{company.contactEmail}</span>
                  </a>
                )}
                {company.contactPhone && (
                  <a
                    href={`tel:${company.contactPhone}`}
                    className="flex items-center gap-1"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span className="text-xs">{company.contactPhone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/aziende/${id}/modifica`}
              className="btn-secondary text-sm px-4"
            >
              Modifica
            </Link>
            <button
              onClick={handleArchive}
              disabled={archiving}
              className="btn-secondary text-sm px-4"
              style={{
                color: "var(--color-danger)",
                borderColor: "var(--color-danger)",
              }}
            >
              {archiving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Archivia"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3">
        <StatChip
          value={company.employeeCount}
          label="Dipendenti"
          Icon={Users}
          colorVar="--color-primary"
          bgVar="--color-primary-50"
        />
        <StatChip
          value={deadlineSummary.overdue}
          label="Urgenti"
          Icon={AlertTriangle}
          colorVar="--color-danger"
          bgVar="--color-danger-50"
        />
        <StatChip
          value={deadlineSummary.expiringSoon}
          label="Entro 30gg"
          Icon={Clock}
          colorVar="--color-warning"
          bgVar="--color-warning-50"
        />
        <StatChip
          value={inRegola > 0 ? inRegola : deadlineSummary.completed}
          label="In regola"
          Icon={CheckCircle2}
          colorVar="--color-accent"
          bgVar="--color-accent-50"
        />
      </div>

      {/* Notes */}
      {company.notes && (
        <div
          className="card px-5 py-4"
          style={{ borderLeft: "3px solid var(--color-primary)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
            Note
          </p>
          <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
            {company.notes}
          </p>
        </div>
      )}

      {/* Tabs */}
      <div>
        {/* Tab nav */}
        <div
          className="flex border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          {TABS.map(({ id: tabId, label, Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
              style={{
                borderColor:
                  activeTab === tabId
                    ? "var(--color-primary)"
                    : "transparent",
                color:
                  activeTab === tabId
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="pt-5">
          {activeTab === "dipendenti" && (
            <EmployeesTab
              employees={company.employees}
              companyId={company.id}
              onEmployeeAdded={loadCompany}
            />
          )}
          {activeTab === "scadenze" && (
            <DeadlinesTab
              companyId={company.id}
              employees={company.employees}
            />
          )}
          {activeTab === "documenti" && <DocumentsTab />}
        </div>
      </div>
    </div>
  );
}
