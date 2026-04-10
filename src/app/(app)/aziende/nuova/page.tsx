"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";

// ─── ATECO Risk Detection ─────────────────────────────────────────────────────

function deriveRiskLevel(code: string): "basso" | "medio" | "alto" | null {
  const trimmed = code.trim();
  if (!trimmed) return null;
  const first = trimmed[0]?.toUpperCase();
  if (["A", "B", "C", "F"].includes(first)) return "alto";
  if (["D", "E", "G", "H", "I"].includes(first)) return "medio";
  return "basso";
}

// ─── Field component ──────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

function Field({ label, required, hint, error, children }: FieldProps) {
  return (
    <div>
      <label className="input-label">
        {label}
        {required && (
          <span style={{ color: "var(--color-danger)" }}> *</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
          {hint}
        </p>
      )}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  fiscalCode: string;
  atecoCode: string;
  address: string;
  city: string;
  province: string;
  cap: string;
  legalRepresentative: string;
  contactEmail: string;
  contactPhone: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  contactEmail?: string;
  general?: string;
}

const INITIAL: FormData = {
  name: "",
  fiscalCode: "",
  atecoCode: "",
  address: "",
  city: "",
  province: "",
  cap: "",
  legalRepresentative: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NuovaAziendaPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [detectedRisk, setDetectedRisk] = useState<"basso" | "medio" | "alto" | null>(null);

  // Derive risk level as user types the ATECO code
  useEffect(() => {
    setDetectedRisk(deriveRiskLevel(form.atecoCode));
  }, [form.atecoCode]);

  function update(field: keyof FormData) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear field error on change
      if (errors[field as keyof FormErrors]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    };
  }

  function validate(): boolean {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "La ragione sociale è obbligatoria";
    }

    if (form.contactEmail.trim()) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(form.contactEmail.trim())) {
        newErrors.contactEmail = "Formato email non valido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          fiscalCode: form.fiscalCode.trim() || undefined,
          atecoCode: form.atecoCode.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          province: form.province.trim().toUpperCase() || undefined,
          cap: form.cap.trim() || undefined,
          legalRepresentative: form.legalRepresentative.trim() || undefined,
          contactEmail: form.contactEmail.trim() || undefined,
          contactPhone: form.contactPhone.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErrors({
          general:
            json?.error?.message ?? "Errore durante la creazione. Riprova.",
        });
        return;
      }

      const json = await res.json();
      const companyId = json.data?.id;
      if (companyId) {
        router.push(`/aziende/${companyId}`);
      } else {
        router.push("/aziende");
      }
    } catch {
      setErrors({ general: "Errore di rete. Controlla la connessione." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back link */}
      <Link
        href="/aziende"
        className="inline-flex items-center gap-2 text-sm mb-6"
        style={{ color: "var(--color-text-muted)" }}
      >
        <ArrowLeft className="w-4 h-4" />
        Torna alle aziende
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "var(--color-primary-50)" }}
        >
          <Building2
            className="w-5 h-5"
            style={{ color: "var(--color-primary)" }}
          />
        </div>
        <div>
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Nuova Azienda
          </h1>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Registra un nuovo cliente
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate>
        {/* General error */}
        {errors.general && (
          <div
            className="flex items-start gap-3 p-4 rounded-lg mb-6"
            style={{
              backgroundColor: "var(--color-danger-50)",
              border: "1px solid var(--color-danger-100)",
            }}
          >
            <AlertCircle
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              style={{ color: "var(--color-danger)" }}
            />
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              {errors.general}
            </p>
          </div>
        )}

        {/* Dati Societari */}
        <div className="card p-6 mb-4 space-y-5">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Dati Societari
          </h2>

          <Field
            label="Ragione Sociale"
            required
            error={errors.name}
          >
            <input
              type="text"
              value={form.name}
              onChange={update("name")}
              className={`input-field ${errors.name ? "error" : ""}`}
              placeholder="es. Edil Costruzioni Srl"
              autoFocus
              autoComplete="organization"
            />
          </Field>

          <Field label="Codice Fiscale / P.IVA">
            <input
              type="text"
              value={form.fiscalCode}
              onChange={update("fiscalCode")}
              className="input-field"
              placeholder="es. 01234567890"
              maxLength={16}
            />
          </Field>

          <Field
            label="Codice ATECO"
            hint="es. 43.21.01 — il livello di rischio viene derivato automaticamente"
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={form.atecoCode}
                onChange={update("atecoCode")}
                className="input-field"
                placeholder="es. C28.15"
              />
              {detectedRisk && (
                <div className="flex-shrink-0">
                  <RiskBadge level={detectedRisk} />
                </div>
              )}
            </div>
          </Field>

          {detectedRisk && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg text-xs"
              style={{
                backgroundColor: "var(--color-primary-50)",
                color: "var(--color-primary)",
              }}
            >
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Livello di rischio rilevato automaticamente dal codice ATECO. Puoi
                modificarlo in seguito dalle impostazioni azienda.
              </span>
            </div>
          )}
        </div>

        {/* Sede */}
        <div className="card p-6 mb-4 space-y-5">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Sede
          </h2>

          <Field label="Indirizzo">
            <input
              type="text"
              value={form.address}
              onChange={update("address")}
              className="input-field"
              placeholder="Via Roma 1"
              autoComplete="street-address"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="col-span-2 sm:col-span-1">
              <Field label="Città">
                <input
                  type="text"
                  value={form.city}
                  onChange={update("city")}
                  className="input-field"
                  placeholder="Milano"
                  autoComplete="address-level2"
                />
              </Field>
            </div>
            <Field label="Provincia">
              <input
                type="text"
                value={form.province}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    province: e.target.value.toUpperCase().slice(0, 2),
                  }))
                }
                className="input-field"
                placeholder="MI"
                maxLength={2}
              />
            </Field>
            <Field label="CAP">
              <input
                type="text"
                value={form.cap}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    cap: e.target.value.replace(/\D/g, "").slice(0, 5),
                  }))
                }
                className="input-field"
                placeholder="20121"
                maxLength={5}
                inputMode="numeric"
              />
            </Field>
          </div>
        </div>

        {/* Contatti */}
        <div className="card p-6 mb-4 space-y-5">
          <h2
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Contatti & Rappresentante
          </h2>

          <Field label="Rappresentante Legale">
            <input
              type="text"
              value={form.legalRepresentative}
              onChange={update("legalRepresentative")}
              className="input-field"
              placeholder="Mario Rossi"
            />
          </Field>

          <Field label="Email di Contatto" error={errors.contactEmail}>
            <input
              type="email"
              value={form.contactEmail}
              onChange={update("contactEmail")}
              className={`input-field ${errors.contactEmail ? "error" : ""}`}
              placeholder="info@azienda.it"
              autoComplete="email"
              inputMode="email"
            />
          </Field>

          <Field label="Telefono">
            <input
              type="tel"
              value={form.contactPhone}
              onChange={update("contactPhone")}
              className="input-field"
              placeholder="+39 02 1234567"
              autoComplete="tel"
              inputMode="tel"
            />
          </Field>
        </div>

        {/* Note */}
        <div className="card p-6 mb-6">
          <h2
            className="text-sm font-semibold uppercase tracking-wider mb-5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Note
          </h2>
          <textarea
            value={form.notes}
            onChange={update("notes")}
            className="input-field resize-none"
            rows={4}
            placeholder="Informazioni aggiuntive sull'azienda cliente..."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
          <Link href="/aziende" className="btn-secondary text-center">
            Annulla
          </Link>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                Crea Azienda
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
