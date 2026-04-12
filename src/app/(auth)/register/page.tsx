"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  Check,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

const { signUp } = authClient;

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

type FormErrors = Partial<Record<keyof FormState | "general", string>>;

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    companyName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!form.firstName.trim()) e.firstName = "Il nome è obbligatorio";
    if (!form.lastName.trim()) e.lastName = "Il cognome è obbligatorio";
    if (!form.email.trim()) e.email = "L'email è obbligatoria";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = "Formato email non valido";
    if (!form.companyName.trim()) e.companyName = "Il nome studio è obbligatorio";
    if (!form.password) e.password = "La password è obbligatoria";
    else if (form.password.length < 8)
      e.password = "La password deve avere almeno 8 caratteri";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Le password non corrispondono";
    if (!form.acceptTerms) e.acceptTerms = "Devi accettare i termini per continuare";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signUp.email({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
      });

      if (result.error) {
        setErrors({
          general: result.error.message || "Errore durante la registrazione.",
        });
        setIsLoading(false);
        return;
      }

      // Save extra profile fields + send welcome email (fire and forget)
      fetch("/api/auth/post-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          companyName: form.companyName.trim(),
          phone: form.phone.trim() || null,
        }),
      }).catch(() => {});

      router.push("/dashboard");
    } catch {
      setErrors({ general: "Errore di connessione. Riprova più tardi." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="card p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "var(--color-primary-50)" }}
        >
          <ShieldCheck className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
        </div>
        <h1
          className="text-2xl font-bold tracking-tight mb-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          Crea il tuo account
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          30 giorni di prova gratuita, nessuna carta richiesta
        </p>
      </div>

      {/* Error banner */}
      {errors.general && (
        <div
          className="mb-6 p-3 rounded-lg text-sm font-medium flex items-start gap-2"
          style={{
            backgroundColor: "var(--color-danger-50)",
            color: "var(--color-danger)",
            border: "1px solid var(--color-danger-100)",
          }}
        >
          <span>⚠</span>
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name row — NO icons, clean inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label" htmlFor="firstName">Nome</label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => updateField("firstName", e.target.value)}
              placeholder="Mario"
              className={`input-field ${errors.firstName ? "error" : ""}`}
            />
            {errors.firstName && <p className="error-message">{errors.firstName}</p>}
          </div>
          <div>
            <label className="input-label" htmlFor="lastName">Cognome</label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => updateField("lastName", e.target.value)}
              placeholder="Rossi"
              className={`input-field ${errors.lastName ? "error" : ""}`}
            />
            {errors.lastName && <p className="error-message">{errors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="input-label" htmlFor="email">Indirizzo email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="mario.rossi@studio-rspp.it"
            className={`input-field ${errors.email ? "error" : ""}`}
          />
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        {/* Company */}
        <div>
          <label className="input-label" htmlFor="companyName">Nome studio / azienda</label>
          <input
            id="companyName"
            type="text"
            autoComplete="organization"
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
            placeholder="Studio RSPP Associati"
            className={`input-field ${errors.companyName ? "error" : ""}`}
          />
          {errors.companyName && <p className="error-message">{errors.companyName}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="input-label" htmlFor="phone">
            Telefono{" "}
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(opzionale)</span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+39 02 1234567"
            className={`input-field ${errors.phone ? "error" : ""}`}
          />
          {errors.phone && <p className="error-message">{errors.phone}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="input-label" htmlFor="password">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Min. 8 caratteri"
              className={`input-field ${errors.password ? "error" : ""}`}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
              style={{ color: "var(--color-text-muted)" }}
              aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="error-message">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="input-label" htmlFor="confirmPassword">Conferma password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              placeholder="Ripeti la password"
              className={`input-field ${errors.confirmPassword ? "error" : ""}`}
              style={{ paddingRight: 44 }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded"
              style={{ color: "var(--color-text-muted)" }}
              aria-label={showConfirmPassword ? "Nascondi password" : "Mostra password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
        </div>

        {/* Terms — proper native checkbox */}
        <div>
          <div className="flex items-start gap-3">
            <button
              type="button"
              role="checkbox"
              aria-checked={form.acceptTerms}
              onClick={() => updateField("acceptTerms", !form.acceptTerms)}
              className="flex-shrink-0 mt-0.5 w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer"
              style={{
                backgroundColor: form.acceptTerms ? "var(--color-primary)" : "var(--color-surface)",
                border: `2px solid ${form.acceptTerms ? "var(--color-primary)" : "var(--color-border)"}`,
                minWidth: 24,
                minHeight: 24,
              }}
            >
              {form.acceptTerms && <Check className="w-4 h-4 text-white" />}
            </button>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Accetto i{" "}
              <Link href="/terms" className="font-medium underline" style={{ color: "var(--color-primary)" }}>
                Termini di Servizio
              </Link>{" "}
              e la{" "}
              <Link href="/privacy" className="font-medium underline" style={{ color: "var(--color-primary)" }}>
                Privacy Policy
              </Link>
            </span>
          </div>
          {errors.acceptTerms && <p className="error-message mt-1">{errors.acceptTerms}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Registrazione in corso...
            </>
          ) : (
            "Registrati gratis"
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm mt-6" style={{ color: "var(--color-text-muted)" }}>
        Hai già un account?{" "}
        <Link href="/login" className="font-medium" style={{ color: "var(--color-primary)" }}>
          Accedi
        </Link>
      </p>
    </div>
  );
}
