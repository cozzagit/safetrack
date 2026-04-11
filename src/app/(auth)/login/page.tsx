"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "@/lib/auth-client";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  function validateForm(): boolean {
    const newErrors: FormErrors = {};

    if (!email.trim()) {
      newErrors.email = "L'email è obbligatoria";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Inserisci un indirizzo email valido";
    }

    if (!password) {
      newErrors.password = "La password è obbligatoria";
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
      const result = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setErrors({
          general:
            result.error.code === "INVALID_EMAIL_OR_PASSWORD"
              ? "Email o password non corretti. Riprova."
              : "Errore durante l'accesso. Riprova più tardi.",
        });
        return;
      }

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
          Accedi a SafeTrack
        </h1>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Gestisci la sicurezza sul lavoro in modo professionale
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
        {/* Email */}
        <div>
          <label className="input-label" htmlFor="email">
            Indirizzo email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@studio.it"
              className={`input-field pl-11 ${errors.email ? "error" : ""}`}
            />
          </div>
          {errors.email && <p className="error-message">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="input-label" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className={`input-field pl-11 pr-10 ${errors.password ? "error" : ""}`}
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

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link
            href="/reset-password"
            className="text-sm font-medium"
            style={{ color: "var(--color-primary)" }}
          >
            Password dimenticata?
          </Link>
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
              Accesso in corso…
            </>
          ) : (
            "Accedi"
          )}
        </button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm" style={{ color: "var(--color-text-muted)" }}>
        Non hai ancora un account?{" "}
        <Link
          href="/register"
          className="font-semibold"
          style={{ color: "var(--color-primary)" }}
        >
          Registrati gratis
        </Link>
      </p>
    </div>
  );
}
