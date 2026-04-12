import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Cookie Policy — SafeTrack",
  description: "Informativa sull'utilizzo dei cookie nella piattaforma SafeTrack.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--color-background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          borderBottom: "1px solid var(--color-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ color: "var(--color-primary)" }}>
              SafeTrack
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <h1
          className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2"
          style={{ color: "var(--color-text-primary)" }}
        >
          Cookie Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--color-text-muted)" }}>
          Ultimo aggiornamento: 9 aprile 2026
        </p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              1. Cosa sono i cookie
            </h2>
            <p>
              I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell&apos;Utente
              quando visita un sito web. Vengono utilizzati per garantire il funzionamento del sito, migliorare
              l&apos;esperienza di navigazione e, in alcuni casi, per finalita di analisi e marketing.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              2. Cookie utilizzati da SafeTrack
            </h2>
            <p>
              SafeTrack utilizza <strong>esclusivamente cookie tecnici essenziali</strong>, necessari per il
              corretto funzionamento della Piattaforma. Non vengono utilizzati cookie di profilazione, di
              marketing o di terze parti per finalita pubblicitarie.
            </p>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                    <th className="text-left py-3 pr-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>Nome</th>
                    <th className="text-left py-3 pr-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>Tipo</th>
                    <th className="text-left py-3 pr-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>Finalita</th>
                    <th className="text-left py-3 font-semibold" style={{ color: "var(--color-text-primary)" }}>Durata</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="py-3 pr-4 font-mono text-xs">better-auth.session_token</td>
                    <td className="py-3 pr-4">Tecnico</td>
                    <td className="py-3 pr-4">Autenticazione e mantenimento della sessione utente</td>
                    <td className="py-3">Sessione / 7 giorni</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="py-3 pr-4 font-mono text-xs">__next</td>
                    <td className="py-3 pr-4">Tecnico</td>
                    <td className="py-3 pr-4">Funzionamento del framework Next.js</td>
                    <td className="py-3">Sessione</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              3. Cookie tecnici essenziali
            </h2>
            <p>
              I cookie tecnici essenziali sono strettamente necessari per il funzionamento della Piattaforma e
              non possono essere disabilitati. Senza questi cookie, funzionalita fondamentali come
              l&apos;autenticazione e la navigazione tra le pagine protette non sarebbero disponibili.
            </p>
            <p className="mt-3">
              Ai sensi dell&apos;art. 122 del D.Lgs. 196/2003 e delle Linee Guida del Garante Privacy del
              10 giugno 2021, i cookie tecnici essenziali <strong>non richiedono il consenso</strong> dell&apos;Utente.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              4. Cookie di terze parti
            </h2>
            <p>
              SafeTrack <strong>non utilizza cookie di terze parti</strong> per finalita di profilazione,
              marketing o retargeting. Non vengono integrati servizi di analytics esterni (Google Analytics,
              Facebook Pixel, ecc.) che installano cookie sul dispositivo dell&apos;Utente.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              5. Come gestire i cookie
            </h2>
            <p>
              L&apos;Utente puo gestire le preferenze relative ai cookie attraverso le impostazioni del proprio
              browser. Si noti che la disabilitazione dei cookie tecnici essenziali potrebbe compromettere il
              funzionamento della Piattaforma.
            </p>
            <p className="mt-3">Istruzioni per i principali browser:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>
                <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-primary)" }}>
                  Google Chrome
                </a>
              </li>
              <li>
                <a href="https://support.mozilla.org/it/kb/protezione-antitracciamento-avanzata-firefox-desktop" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-primary)" }}>
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-primary)" }}>
                  Safari
                </a>
              </li>
              <li>
                <a href="https://support.microsoft.com/it-it/microsoft-edge/eliminare-i-cookie-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--color-primary)" }}>
                  Microsoft Edge
                </a>
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              6. Aggiornamenti alla Cookie Policy
            </h2>
            <p>
              La presente Cookie Policy puo essere aggiornata periodicamente. Le modifiche saranno pubblicate
              su questa pagina con indicazione della data di ultimo aggiornamento.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              7. Contatti
            </h2>
            <p>
              Per qualsiasi domanda relativa alla presente Cookie Policy, contattare:
            </p>
            <p className="mt-3 font-medium" style={{ color: "var(--color-text-primary)" }}>
              Email:{" "}
              <a href="mailto:info@vibecanyon.com" className="underline" style={{ color: "var(--color-primary)" }}>
                info@vibecanyon.com
              </a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style={{ color: "var(--color-text-muted)" }}>
          <p>&copy; {new Date().getFullYear()} SafeTrack. Tutti i diritti riservati.</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:underline">Termini di Servizio</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
