"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, User, Building2, Phone, Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  companyName?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
  general?: string;
}

const INITIAL_FORM: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  companyName: "",
  phone: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!form.firstName.trim()) {
      newErrors.firstName = "Il nome è obbligatorio";
    }

    if (!form.lastName.trim()) {
      newErrors.lastName = "Il cognome è obbligatorio";
    }

    if (!form.email.trim()) {
      newErrors.email = "L'email è obbligatoria";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Inserisci un indirizzo email valido";
    }

    if (!form.companyName.trim()) {
      newErrors.companyName = "Il nome dello studio è obbligatorio";
    }

    if (form.phone && !/^[+\d\s\-()]{6,20}$/.test(form.phone)) {
      newErrors.phone = "Inserisci un numero di telefono valido";
    }

    if (!form.password) {
      newErrors.password = "La password è obbligatoria";
    } else if (form.password.length < 8) {
      newErrors.password = "La password deve essere di almeno 8 caratteri";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      newErrors.password = "La password deve contenere maiuscole, minuscole e numeri";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Conferma la password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Le password non coincidono";
    }

    if (!form.acceptTerms) {
      newErrors.acceptTerms = "Devi accettare i termini per continuare";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await signUp.email({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        // Additional profile fields passed as extra data
        // @ts-expect-error — better-auth supports extra fields via additionalFields
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        companyName: form.companyName.trim(),
        phone: form.phone.trim() || undefined,
      });

      if (result.error) {
        if (result.error.code === "USER_ALREADY_EXISTS") {
          setErrors({ email: "Esiste già un account con questa email." });
        } else {
          setErrors({ general: "Errore durante la registrazione. Riprova più tardi." });
        }
        return;
      }

      // Send welcome email (fire-and-forget — don't block navigation on failure)
      fetch("/api/auth/post-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          firstName: form.firstName.trim(),
        }),
      }).catch(() => {
        // Silently ignore — email is best-effort
      });

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
            border: `1px solid var(--color-danger-100)`,
          }}
        >
          <span>⚠</span>
          <span>{errors.general}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="input-label" htmlFor="firstName">
              Nome
            </label>
            <div className="relative">
              <User
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                id="firstName"
                type="text"
                autoComplete="given-name"
                value={form.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                placeholder="Mario"
                className={`input-field pl-9 ${errors.firstName ? "error" : ""}`}
              />
            </div>
            {errors.firstName && <p className="error-message">{errors.firstName}</p>}
          </div>
          <div>
            <label className="input-label" htmlFor="lastName">
              Cognome
            </label>
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
          <label className="input-label" htmlFor="email">
            Indirizzo email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="mario.rossi@studio-rspp.it"
              className={`input-field pl-10 ${errors.email ? "error" : ""}`}
            />
          </div>
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        {/* Company */}
        <div>
          <label className="input-label" htmlFor="companyName">
            Nome studio / azienda
          </label>
          <div className="relative">
            <Building2
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              id="companyName"
              type="text"
              autoComplete="organization"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="Studio RSPP Associati"
              className={`input-field pl-10 ${errors.companyName ? "error" : ""}`}
            />
          </div>
          {errors.companyName && <p className="error-message">{errors.companyName}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="input-label" htmlFor="phone">
            Telefono{" "}
            <span style={{ color: "var(--color-text-muted)", fontWeight: 400 }}>(opzionale)</span>
          </label>
          <div className="relative">
            <Phone
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+39 02 1234567"
              className={`input-field pl-10 ${errors.phone ? "error" : ""}`}
            />
          </div>
          {errors.phone && <p className="error-message">{errors.phone}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="input-label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="Min. 8 caratteri"
              className={`input-field pl-10 pr-10 ${errors.password ? "error" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
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
          <label className="input-label" htmlFor="confirmPassword">
            Conferma password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              placeholder="Ripeti la password"
              className={`input-field pl-10 pr-10 ${errors.confirmPassword ? "error" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
              style={{ color: "var(--color-text-muted)" }}
              aria-label={showConfirmPassword ? "Nascondi password" : "Mostra password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="error-message">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Terms */}
        <div>
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <div className="relative flex-shrink-0 mt-0.5">
              <input
                type="checkbox"
                checked={form.acceptTerms}
                onChange={(e) => updateField("acceptTerms", e.target.checked)}
                className="sr-only"
                id="terms"
              />
              <div
                className="w-5 h-5 rounded flex items-center justify-center transition-all"
                style={{
                  backgroundColor: form.acceptTerms ? "var(--color-primary)" : "transparent",
                  border: `2px solid ${form.acceptTerms ? "var(--color-primary)" : "var(--color-border)"}`,
                }}
                onClick={() => updateField("acceptTerms", !form.acceptTerms)}
              >
                {form.acceptTerms && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              Accetto i{" "}
              <Link href="/terms" className="font-medium" style={{ color: "var(--color-primary)" }}>
                Termini di Servizio
              </Link>{" "}
              e la{" "}
              <Link href="/privacy" className="font-medium" style={{ color: "var(--color-primary)" }}>
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.acceptTerms && <p className="error-message mt-1">{errors.acceptTerms}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full text-base py-3"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creazione account…
            </>
          ) : (
            "Registrati gratis"
          )}
        </button>
      </form>

      {/* Login link */}
      <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
        Hai già un account?{" "}
        <Link href="/login" className="font-semibold" style={{ color: "var(--color-primary)" }}>
          Accedi
        </Link>
      </p>
    </div>
  );
}
