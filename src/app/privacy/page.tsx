import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — SafeTrack",
  description: "Informativa sulla privacy e trattamento dei dati personali di SafeTrack ai sensi del GDPR.",
};

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-muted)" }}>
          Ultimo aggiornamento: 9 aprile 2026
        </p>
        <p className="text-sm mb-10" style={{ color: "var(--color-text-secondary)" }}>
          Informativa sul trattamento dei dati personali ai sensi degli artt. 13 e 14 del Regolamento (UE) 2016/679 (GDPR)
          e del D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018.
        </p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              1. Titolare del trattamento
            </h2>
            <p>
              Il Titolare del trattamento dei dati personali è:
            </p>
            <div className="mt-3 p-4 rounded-lg" style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border)" }}>
              <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>VibeCanyon</p>
              <p className="mt-1">Sede operativa: Italia</p>
              <p>
                Email:{" "}
                <a href="mailto:info@vibecanyon.com" className="underline" style={{ color: "var(--color-primary)" }}>
                  info@vibecanyon.com
                </a>
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              2. Tipi di dati raccolti
            </h2>
            <p>SafeTrack raccoglie e tratta le seguenti categorie di dati personali:</p>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              2.1 Dati dell&apos;Utente registrato
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nome e cognome</li>
              <li>Indirizzo email</li>
              <li>Numero di telefono (opzionale)</li>
              <li>Nome dello studio o dell&apos;azienda</li>
              <li>Credenziali di accesso (password conservata in forma crittografata)</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              2.2 Dati delle aziende clienti
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ragione sociale, partita IVA, codice fiscale</li>
              <li>Indirizzo della sede legale e operativa</li>
              <li>Settore di attività e codice ATECO</li>
              <li>Dati del datore di lavoro e dei referenti aziendali</li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              2.3 Dati dei dipendenti
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nome e cognome</li>
              <li>Codice fiscale</li>
              <li>Data di assunzione e mansione</li>
              <li>Ruoli ai fini della sicurezza (preposto, addetto antincendio, addetto primo soccorso, RLS, ecc.)</li>
              <li>Dati relativi ad attestati formativi (ente formatore, data, scadenza)</li>
            </ul>

            {/* GDPR Art. 9 Warning */}
            <div
              className="mt-4 p-4 rounded-lg"
              style={{
                backgroundColor: "var(--color-danger-50)",
                border: "1px solid var(--color-danger-100)",
              }}
            >
              <h3 className="font-bold mb-2" style={{ color: "var(--color-danger)" }}>
                2.4 Dati particolari (art. 9 GDPR) — Dati sanitari
              </h3>
              <p style={{ color: "var(--color-text-primary)" }}>
                SafeTrack può trattare dati relativi alle <strong>visite mediche di sorveglianza sanitaria</strong>{" "}
                (date delle visite, esiti di idoneità, limitazioni/prescrizioni, scadenze), che costituiscono{" "}
                <strong>dati particolari (categorie particolari di dati personali)</strong> ai sensi dell&apos;art. 9 del GDPR.
              </p>
              <p className="mt-2" style={{ color: "var(--color-text-primary)" }}>
                Il trattamento di tali dati avviene sulla base giuridica dell&apos;<strong>obbligo legale</strong> derivante
                dal D.Lgs. 81/2008 (Testo Unico sulla Sicurezza sul Lavoro), che impone al datore di lavoro,
                tramite il medico competente, di sottoporre i lavoratori a sorveglianza sanitaria e di tenere
                traccia delle relative scadenze (art. 9, par. 2, lett. b) del GDPR — trattamento necessario
                per assolvere obblighi in materia di diritto del lavoro e di sicurezza sociale).
              </p>
            </div>

            <h3 className="font-semibold mt-4 mb-2" style={{ color: "var(--color-text-primary)" }}>
              2.5 Dati tecnici e di navigazione
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Indirizzo IP</li>
              <li>Tipo di browser e dispositivo</li>
              <li>Pagine visitate e durata della sessione</li>
              <li>Cookie tecnici essenziali per il funzionamento della Piattaforma</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              3. Finalità del trattamento
            </h2>
            <p>I dati personali sono trattati per le seguenti finalità:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Erogazione del Servizio:</strong> gestione dell&apos;account, calcolo delle scadenze normative,
                generazione di report, invio di notifiche relative alle scadenze.
              </li>
              <li>
                <strong>Scansione documentale con AI:</strong> analisi automatizzata degli attestati caricati
                dall&apos;Utente per l&apos;estrazione di dati (nome, corso, data, ente formatore).
              </li>
              <li>
                <strong>Comunicazioni di servizio:</strong> invio di email transazionali (conferma registrazione,
                notifiche scadenze, aggiornamenti di sicurezza).
              </li>
              <li>
                <strong>Miglioramento del Servizio:</strong> analisi aggregate e anonimizzate sull&apos;utilizzo
                della Piattaforma per migliorare funzionalità e prestazioni.
              </li>
              <li>
                <strong>Adempimenti legali:</strong> ottemperanza ad obblighi di legge, regolamentari o derivanti
                da provvedimenti dell&apos;autorità competente.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              4. Base giuridica del trattamento
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full mt-3 text-sm" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)" }}>
                    <th className="text-left py-3 pr-4 font-semibold" style={{ color: "var(--color-text-primary)" }}>Finalità</th>
                    <th className="text-left py-3 font-semibold" style={{ color: "var(--color-text-primary)" }}>Base giuridica (art. 6 GDPR)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="py-3 pr-4">Erogazione del Servizio</td>
                    <td className="py-3">Esecuzione del contratto (art. 6.1.b)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="py-3 pr-4">Gestione visite mediche</td>
                    <td className="py-3">Obbligo legale D.Lgs. 81/08 (art. 6.1.c + art. 9.2.b)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="py-3 pr-4">Scansione AI attestati</td>
                    <td className="py-3">Esecuzione del contratto (art. 6.1.b)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="py-3 pr-4">Comunicazioni di servizio</td>
                    <td className="py-3">Legittimo interesse (art. 6.1.f)</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td className="py-3 pr-4">Miglioramento del Servizio</td>
                    <td className="py-3">Legittimo interesse (art. 6.1.f)</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4">Adempimenti legali</td>
                    <td className="py-3">Obbligo legale (art. 6.1.c)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              5. Conservazione dei dati
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Dati dell&apos;account:</strong> conservati per tutta la durata del rapporto contrattuale
                e per ulteriori 90 giorni dalla cessazione del Servizio (per consentire l&apos;esportazione).
              </li>
              <li>
                <strong>Dati delle aziende e dei dipendenti:</strong> conservati per la durata del Servizio.
                Dopo la cessazione, cancellati entro 90 giorni salvo obblighi di legge.
              </li>
              <li>
                <strong>Dati di fatturazione:</strong> conservati per 10 anni in conformità alla normativa fiscale italiana.
              </li>
              <li>
                <strong>Log di accesso:</strong> conservati per 6 mesi per finalità di sicurezza.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              6. Trasferimento dei dati a terzi
            </h2>
            <p>I dati personali possono essere condivisi con:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Fornitori di servizi cloud:</strong> per l&apos;hosting e l&apos;archiviazione dei dati
                (server situati nell&apos;Unione Europea).
              </li>
              <li>
                <strong>OpenAI (tramite API):</strong> esclusivamente per la funzionalità di scansione OCR degli
                attestati. I dati inviati sono limitati all&apos;immagine del documento e vengono elaborati in
                tempo reale senza conservazione permanente da parte di OpenAI, in conformità al loro{" "}
                <a
                  href="https://openai.com/enterprise-privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                  style={{ color: "var(--color-primary)" }}
                >
                  Data Processing Agreement
                </a>.
              </li>
              <li>
                <strong>Fornitori di servizi email:</strong> per l&apos;invio di notifiche transazionali.
              </li>
            </ul>
            <p className="mt-3">
              I dati non vengono mai venduti, ceduti o condivisi per finalità di marketing di terze parti.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              7. Diritti dell&apos;interessato
            </h2>
            <p>
              Ai sensi degli artt. 15-22 del GDPR, l&apos;interessato ha diritto di:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li><strong>Accesso:</strong> ottenere conferma dell&apos;esistenza di un trattamento e accedere ai propri dati.</li>
              <li><strong>Rettifica:</strong> richiedere la correzione di dati inesatti o incompleti.</li>
              <li><strong>Cancellazione:</strong> richiedere la cancellazione dei propri dati (&ldquo;diritto all&apos;oblio&rdquo;), nei limiti previsti dalla legge.</li>
              <li><strong>Limitazione:</strong> richiedere la limitazione del trattamento in determinate circostanze.</li>
              <li><strong>Portabilità:</strong> ricevere i propri dati in formato strutturato, di uso comune e leggibile da dispositivo automatico.</li>
              <li><strong>Opposizione:</strong> opporsi al trattamento dei propri dati per motivi legittimi.</li>
              <li><strong>Revoca del consenso:</strong> revocare il consenso in qualsiasi momento, senza pregiudicare la liceità del trattamento basato sul consenso prima della revoca.</li>
            </ul>
            <p className="mt-3">
              Per esercitare i propri diritti, l&apos;interessato può inviare una richiesta a{" "}
              <a href="mailto:info@vibecanyon.com" className="font-medium underline" style={{ color: "var(--color-primary)" }}>
                info@vibecanyon.com
              </a>. Il Titolare rispondera entro 30 giorni dal ricevimento della richiesta.
            </p>
            <p className="mt-3">
              L&apos;interessato ha inoltre il diritto di proporre reclamo all&apos;autorità di controllo competente
              (Garante per la Protezione dei Dati Personali —{" "}
              <a
                href="https://www.garanteprivacy.it"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
                style={{ color: "var(--color-primary)" }}
              >
                www.garanteprivacy.it
              </a>).
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              8. Cookie
            </h2>
            <p>
              SafeTrack utilizza esclusivamente <strong>cookie tecnici essenziali</strong> necessari per il
              funzionamento della Piattaforma (autenticazione, sessione, preferenze). Non vengono utilizzati
              cookie di profilazione o di marketing di terze parti.
            </p>
            <p className="mt-3">
              Per maggiori informazioni, consultare la{" "}
              <Link href="/cookie" className="font-medium underline" style={{ color: "var(--color-primary)" }}>
                Cookie Policy
              </Link>.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              9. Sicurezza dei dati
            </h2>
            <p>
              Il Titolare adotta misure tecniche e organizzative adeguate per proteggere i dati personali da
              accessi non autorizzati, perdita, distruzione o alterazione, tra cui:
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-1">
              <li>Crittografia dei dati in transito (TLS/HTTPS)</li>
              <li>Password conservate con hashing sicuro (bcrypt)</li>
              <li>Accesso ai dati limitato al personale autorizzato</li>
              <li>Backup regolari con crittografia</li>
              <li>Monitoraggio e logging degli accessi</li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              10. Modifiche alla Privacy Policy
            </h2>
            <p>
              Il Titolare si riserva il diritto di modificare la presente informativa in qualsiasi momento.
              Le modifiche saranno pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.
              In caso di modifiche sostanziali, l&apos;Utente sarà informato tramite email.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              11. Contatti
            </h2>
            <p>
              Per qualsiasi domanda relativa al trattamento dei dati personali, è possibile contattare
              il Titolare:
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
            <Link href="/terms" className="hover:underline">Termini di Servizio</Link>
            <Link href="/cookie" className="hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
