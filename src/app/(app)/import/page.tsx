"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertTriangle,
  Loader2,
  Sparkles,
  X,
  CheckCircle2,
  XCircle,
  Building2,
  Users,
  Calendar,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface PreviewData {
  fileId: string;
  headers: string[];
  previewRows: Record<string, unknown>[];
  totalRows: number;
  aiMapping: Record<string, string>;
  availableFields: string[];
}

interface ImportResult {
  companiesCreated: number;
  employeesCreated: number;
  deadlinesImported: number;
  totalRows: number;
  errorCount: number;
  errors: { row: number; message: string }[];
}

const FIELD_LABELS: Record<string, string> = {
  companyName: "Ragione Sociale",
  employeeFiscalCode: "Codice Fiscale",
  employeeFirstName: "Nome",
  employeeLastName: "Cognome",
  employeeRole: "Mansione",
  hiringDate: "Data Assunzione",
  formazioneGenerale: "Formazione Generale",
  formazioneSpecifica: "Formazione Specifica",
  formazionePreposti: "Formazione Preposti",
  antincendio: "Antincendio",
  primoSoccorso: "Primo Soccorso",
  visitaMedica: "Visita Medica",
  rls: "RLS",
  SKIP: "Non importare",
};

// ─── Step Indicator ─────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
  const steps = ["Carica File", "Mappa Colonne", "Anteprima", "Risultati"];
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className="w-8 h-px hidden sm:block"
                style={{
                  backgroundColor: isDone
                    ? "var(--color-accent)"
                    : "var(--color-border)",
                }}
              />
            )}
            <div className="flex items-center gap-1.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{
                  backgroundColor: isActive
                    ? "var(--color-primary)"
                    : isDone
                      ? "var(--color-accent)"
                      : "var(--color-border)",
                  color: isActive || isDone ? "white" : "var(--color-text-muted)",
                }}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step}
              </div>
              <span
                className="text-xs font-medium hidden sm:block"
                style={{
                  color: isActive
                    ? "var(--color-primary)"
                    : isDone
                      ? "var(--color-accent-dark)"
                      : "var(--color-text-muted)",
                }}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Upload ─────────────────────────────────────────────────────────

function StepUpload({
  onFileSelected,
  isLoading,
  error,
}: {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div className="max-w-xl mx-auto">
      <div
        className={`card p-8 text-center transition-all ${isDragOver ? "ring-2" : ""}`}
        style={{
          borderStyle: "dashed",
          borderWidth: "2px",
          borderColor: isDragOver
            ? "var(--color-primary)"
            : "var(--color-border)",
          backgroundColor: isDragOver
            ? "var(--color-primary-50)"
            : "var(--color-surface)",
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {isLoading ? (
          <div className="py-4">
            <Loader2
              className="w-12 h-12 mx-auto mb-4 animate-spin"
              style={{ color: "var(--color-primary)" }}
            />
            <p
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Analisi del file in corso...
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              L&apos;AI sta mappando le colonne automaticamente
            </p>
          </div>
        ) : (
          <>
            <FileSpreadsheet
              className="w-12 h-12 mx-auto mb-4"
              style={{ color: "var(--color-primary)" }}
            />
            <p
              className="text-base font-semibold mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              Trascina qui il tuo file Excel
            </p>
            <p
              className="text-sm mb-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              oppure clicca per selezionarlo
            </p>
            <button
              className="btn-primary"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-4 h-4" />
              Seleziona File
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <p
              className="text-xs mt-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              Formati supportati: .xlsx, .xls, .csv — Max 5MB
            </p>
          </>
        )}
      </div>

      {error && (
        <div
          className="mt-4 p-3 rounded-lg flex items-start gap-2 text-sm"
          style={{
            backgroundColor: "var(--color-danger-50)",
            color: "var(--color-danger)",
          }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Step 2: Column Mapping ─────────────────────────────────────────────────

function StepMapping({
  preview,
  mapping,
  onMappingChange,
  onNext,
  onBack,
}: {
  preview: PreviewData;
  mapping: Record<string, string>;
  onMappingChange: (col: string, field: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
        <p
          className="text-sm font-medium"
          style={{ color: "var(--color-accent-dark)" }}
        >
          L&apos;AI ha suggerito la mappatura automaticamente. Verifica e
          correggi se necessario.
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                style={{
                  backgroundColor: "var(--color-background)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <th
                  className="text-left px-4 py-3 font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Colonna Excel
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Campo SafeTrack
                </th>
                <th
                  className="text-left px-4 py-3 font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Esempio
                </th>
              </tr>
            </thead>
            <tbody>
              {preview.headers.map((header) => {
                const currentField = mapping[header] ?? "SKIP";
                const sampleValues = preview.previewRows
                  .slice(0, 3)
                  .map((row) => String(row[header] ?? ""))
                  .filter(Boolean);

                return (
                  <tr
                    key={header}
                    style={{ borderBottom: "1px solid var(--color-border)" }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="font-medium"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {header}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={currentField}
                        onChange={(e) =>
                          onMappingChange(header, e.target.value)
                        }
                        className="w-full px-3 py-1.5 rounded-lg text-sm"
                        style={{
                          backgroundColor: "var(--color-background)",
                          border: "1px solid var(--color-border)",
                          color:
                            currentField === "SKIP"
                              ? "var(--color-text-muted)"
                              : "var(--color-text-primary)",
                        }}
                      >
                        {preview.availableFields.map((field) => (
                          <option key={field} value={field}>
                            {FIELD_LABELS[field] ?? field}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-xs"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {sampleValues.join(", ") || "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>
        <button className="btn-primary" onClick={onNext}>
          Anteprima
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Preview & Validate ─────────────────────────────────────────────

function StepPreview({
  preview,
  mapping,
  options,
  onOptionsChange,
  onExecute,
  onBack,
  isLoading,
}: {
  preview: PreviewData;
  mapping: Record<string, string>;
  options: {
    createCompanies: boolean;
    generateDeadlines: boolean;
    markHistoryComplete: boolean;
  };
  onOptionsChange: (
    opts: Partial<{
      createCompanies: boolean;
      generateDeadlines: boolean;
      markHistoryComplete: boolean;
    }>
  ) => void;
  onExecute: () => void;
  onBack: () => void;
  isLoading: boolean;
}) {
  // Count mapped fields
  const mappedFields = Object.values(mapping).filter((f) => f !== "SKIP");
  const hasCompany = mappedFields.includes("companyName");
  const hasName =
    mappedFields.includes("employeeFirstName") ||
    mappedFields.includes("employeeLastName");
  const trainingFields = mappedFields.filter(
    (f) =>
      ![
        "companyName",
        "employeeFiscalCode",
        "employeeFirstName",
        "employeeLastName",
        "employeeRole",
        "hiringDate",
      ].includes(f)
  );

  // Reverse mapping for display
  const fieldToCol: Record<string, string> = {};
  for (const [col, field] of Object.entries(mapping)) {
    if (field !== "SKIP") fieldToCol[field] = col;
  }

  return (
    <div>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div
          className="card p-4 text-center"
          style={{ borderLeft: "3px solid var(--color-primary)" }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {preview.totalRows}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Righe totali
          </p>
        </div>
        <div
          className="card p-4 text-center"
          style={{ borderLeft: "3px solid var(--color-accent)" }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {mappedFields.length}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Campi mappati
          </p>
        </div>
        <div
          className="card p-4 text-center"
          style={{ borderLeft: "3px solid var(--color-warning)" }}
        >
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {trainingFields.length}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Corsi/scadenze
          </p>
        </div>
      </div>

      {/* Validation warnings */}
      {!hasName && (
        <div
          className="mb-4 p-3 rounded-lg flex items-start gap-2 text-sm"
          style={{
            backgroundColor: "var(--color-danger-50)",
            color: "var(--color-danger)",
          }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          Nessuna colonna mappata per nome/cognome dipendente. L&apos;importazione
          potrebbe fallire.
        </div>
      )}

      {/* Preview table */}
      <div className="card overflow-hidden mb-6">
        <div
          className="px-4 py-3"
          style={{
            borderBottom: "1px solid var(--color-border)",
            backgroundColor: "var(--color-background)",
          }}
        >
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Anteprima prime {Math.min(preview.previewRows.length, 10)} righe
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th
                  className="text-left px-3 py-2 font-semibold"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  #
                </th>
                {Object.entries(mapping)
                  .filter(([, f]) => f !== "SKIP")
                  .map(([col, field]) => (
                    <th
                      key={col}
                      className="text-left px-3 py-2 font-semibold whitespace-nowrap"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {FIELD_LABELS[field] ?? field}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {preview.previewRows.slice(0, 10).map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid var(--color-border)" }}
                >
                  <td
                    className="px-3 py-2"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {i + 1}
                  </td>
                  {Object.entries(mapping)
                    .filter(([, f]) => f !== "SKIP")
                    .map(([col]) => (
                      <td
                        key={col}
                        className="px-3 py-2 whitespace-nowrap"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {String(row[col] ?? "—")}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Options */}
      <div className="card p-4 mb-6 space-y-3">
        <p
          className="text-sm font-semibold mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          Opzioni importazione
        </p>

        {hasCompany && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.createCompanies}
              onChange={(e) =>
                onOptionsChange({ createCompanies: e.target.checked })
              }
              className="w-4 h-4 rounded"
              style={{ accentColor: "var(--color-primary)" }}
            />
            <div>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Crea aziende se non esistono
              </span>
              <p
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                Le aziende non trovate verranno create automaticamente
              </p>
            </div>
          </label>
        )}

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.markHistoryComplete}
            onChange={(e) =>
              onOptionsChange({ markHistoryComplete: e.target.checked })
            }
            className="w-4 h-4 rounded"
            style={{ accentColor: "var(--color-primary)" }}
          />
          <div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Segna storico come completato
            </span>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Le date importate verranno registrate come scadenze completate
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={options.generateDeadlines}
            onChange={(e) =>
              onOptionsChange({ generateDeadlines: e.target.checked })
            }
            className="w-4 h-4 rounded"
            style={{ accentColor: "var(--color-primary)" }}
          />
          <div>
            <span
              className="text-sm font-medium"
              style={{ color: "var(--color-text-primary)" }}
            >
              Genera scadenze future
            </span>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Calcola automaticamente le date di rinnovo dei corsi
            </p>
          </div>
        </label>
      </div>

      <div className="flex justify-between">
        <button className="btn-secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
          Modifica Mappatura
        </button>
        <button
          className="btn-primary"
          onClick={onExecute}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Importazione in corso...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Importa {preview.totalRows} Righe
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Results ────────────────────────────────────────────────────────

function StepResults({ result }: { result: ImportResult }) {
  const hasErrors = result.errorCount > 0;

  return (
    <div className="max-w-xl mx-auto">
      <div className="card p-6 text-center mb-6">
        {hasErrors ? (
          <AlertTriangle
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--color-warning)" }}
          />
        ) : (
          <CheckCircle2
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--color-accent)" }}
          />
        )}
        <h2
          className="text-xl font-bold mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {hasErrors ? "Importazione completata con avvisi" : "Importazione completata!"}
        </h2>
        <p
          className="text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {result.totalRows - result.errorCount} di {result.totalRows} righe
          importate con successo
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card p-4 text-center">
          <Building2
            className="w-6 h-6 mx-auto mb-2"
            style={{ color: "var(--color-primary)" }}
          />
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {result.companiesCreated}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Aziende create
          </p>
        </div>
        <div className="card p-4 text-center">
          <Users
            className="w-6 h-6 mx-auto mb-2"
            style={{ color: "var(--color-accent)" }}
          />
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {result.employeesCreated}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Dipendenti creati
          </p>
        </div>
        <div className="card p-4 text-center">
          <Calendar
            className="w-6 h-6 mx-auto mb-2"
            style={{ color: "var(--color-warning)" }}
          />
          <p
            className="text-2xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {result.deadlinesImported}
          </p>
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            Scadenze importate
          </p>
        </div>
      </div>

      {hasErrors && (
        <div className="card overflow-hidden mb-6">
          <div
            className="px-4 py-3 flex items-center gap-2"
            style={{
              backgroundColor: "var(--color-danger-50)",
              borderBottom: "1px solid var(--color-border)",
            }}
          >
            <XCircle
              className="w-4 h-4"
              style={{ color: "var(--color-danger)" }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-danger)" }}
            >
              {result.errorCount} errori
            </span>
          </div>
          <div
            className="max-h-48 overflow-y-auto divide-y"
            style={{ borderColor: "var(--color-border)" }}
          >
            {result.errors.map((err, i) => (
              <div key={i} className="px-4 py-2 flex items-start gap-2">
                <span
                  className="text-xs font-mono flex-shrink-0 mt-0.5"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Riga {err.row}
                </span>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-danger)" }}
                >
                  {err.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-3">
        <Link href="/dashboard" className="btn-primary">
          Vai alla Dashboard
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/aziende" className="btn-secondary">
          Vedi Aziende
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ImportPage() {
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [options, setOptions] = useState({
    createCompanies: true,
    generateDeadlines: true,
    markHistoryComplete: true,
  });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Upload file
  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/preview", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Errore durante il caricamento");
        return;
      }

      setPreview(json.data);
      setMapping(json.data.aiMapping);
      setStep(2);
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Update mapping
  const handleMappingChange = (col: string, field: string) => {
    setMapping((prev) => ({ ...prev, [col]: field }));
  };

  // Step 3→4: Execute import
  const handleExecute = async () => {
    if (!preview) return;
    setIsLoading(true);

    try {
      const res = await fetch("/api/import/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileId: preview.fileId,
          mapping,
          options,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error?.message ?? "Errore durante l'importazione");
        setIsLoading(false);
        return;
      }

      setResult(json.data);
      setStep(4);
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Importa da Excel
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Importa dipendenti e scadenze da un foglio Excel o CSV
          </p>
        </div>
        {step < 4 && (
          <Link
            href="/dashboard"
            className="p-2 rounded-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X className="w-5 h-5" />
          </Link>
        )}
      </div>

      <StepIndicator current={step} />

      {step === 1 && (
        <StepUpload
          onFileSelected={handleFileSelected}
          isLoading={isLoading}
          error={error}
        />
      )}

      {step === 2 && preview && (
        <StepMapping
          preview={preview}
          mapping={mapping}
          onMappingChange={handleMappingChange}
          onNext={() => setStep(3)}
          onBack={() => {
            setStep(1);
            setPreview(null);
            setMapping({});
          }}
        />
      )}

      {step === 3 && preview && (
        <StepPreview
          preview={preview}
          mapping={mapping}
          options={options}
          onOptionsChange={(opts) =>
            setOptions((prev) => ({ ...prev, ...opts }))
          }
          onExecute={handleExecute}
          onBack={() => setStep(2)}
          isLoading={isLoading}
        />
      )}

      {step === 4 && result && <StepResults result={result} />}
    </div>
  );
}
