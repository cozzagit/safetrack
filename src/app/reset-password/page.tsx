"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Mail, Loader2, Info } from "lucide-react";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("L'indirizzo email e obbligatorio");
      return;
    }

    if (!validateEmail(email.trim())) {
      setError("Inserisci un indirizzo email valido");
      return;
    }

    setIsLoading(true);

    // Simulate a brief delay for UX
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsLoading(false);
    setIsSubmitted(true);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Header */}
      <header
        className="px-6 py-4 border-b"
        style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-surface)" }}
      >
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--color-primary)" }}
          >
            SafeTrack
          </span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            {!isSubmitted ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: "var(--color-primary-50)" }}
                  >
                    <Mail className="w-7 h-7" style={{ color: "var(--color-primary)" }} />
                  </div>
                  <h1
                    className="text-2xl font-bold tracking-tight mb-1"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Password dimenticata?
                  </h1>
                  <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    Inserisci il tuo indirizzo email e ti invieremo le istruzioni per reimpostare la password.
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="mb-6 p-3 rounded-lg text-sm font-medium flex items-start gap-2"
                    style={{
                      backgroundColor: "var(--color-danger-50)",
                      color: "var(--color-danger)",
                      border: "1px solid var(--color-danger-100)",
                    }}
                  >
                    <span>&#9888;</span>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div>
                    <label className="input-label" htmlFor="email">Indirizzo email</label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@studio.it"
                      className="input-field"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full text-base py-3 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Invio in corso...
                      </>
                    ) : (
                      "Invia link di recupero"
                    )}
                  </button>
                </form>
              </>
            ) : (
              <>
                {/* Success state */}
                <div className="text-center">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: "var(--color-accent-50)" }}
                  >
                    <Info className="w-8 h-8" style={{ color: "var(--color-accent)" }} />
                  </div>
                  <h2
                    className="text-xl font-bold tracking-tight mb-3"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    Funzionalita in arrivo
                  </h2>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--color-text-secondary)" }}>
                    Il recupero automatico della password sara disponibile a breve.
                    Nel frattempo, contatta il nostro supporto per assistenza:
                  </p>
                  <a
                    href="mailto:info@vibecanyon.com"
                    className="btn-primary inline-flex items-center gap-2 text-base"
                  >
                    <Mail className="w-4 h-4" />
                    info@vibecanyon.com
                  </a>
                </div>
              </>
            )}

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "var(--color-primary)" }}
              >
                <ArrowLeft className="w-4 h-4" />
                Torna al login
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center" style={{ borderTop: "1px solid var(--color-border)" }}>
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          &copy; {new Date().getFullYear()} SafeTrack. Tutti i diritti riservati.
        </p>
      </footer>
    </div>
  );
}
