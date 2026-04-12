import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Termini di Servizio — SafeTrack",
  description: "Termini e condizioni di utilizzo della piattaforma SafeTrack per la gestione della sicurezza sul lavoro.",
};

export default function TermsPage() {
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
          Termini di Servizio
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--color-text-muted)" }}>
          Ultimo aggiornamento: 9 aprile 2026
        </p>

        <div className="space-y-10 text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
          {/* 1 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              1. Oggetto del servizio
            </h2>
            <p>
              SafeTrack (di seguito &ldquo;il Servizio&rdquo; o &ldquo;la Piattaforma&rdquo;) è una piattaforma SaaS (Software as a Service)
              progettata per supportare i consulenti RSPP e i professionisti della sicurezza sul lavoro nella gestione
              delle scadenze normative, degli attestati formativi, delle visite mediche e degli adempimenti previsti dal
              D.Lgs. 81/2008 e successive modifiche e integrazioni.
            </p>
            <p className="mt-3">
              Il Servizio è fornito da VibeCanyon (di seguito &ldquo;il Fornitore&rdquo;), con sede operativa in Italia.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              2. Registrazione e account
            </h2>
            <p>
              Per utilizzare SafeTrack è necessario creare un account fornendo informazioni accurate e complete.
              L&apos;Utente è responsabile della riservatezza delle proprie credenziali di accesso e di tutte le
              attività svolte tramite il proprio account.
            </p>
            <p className="mt-3">
              L&apos;Utente si impegna a notificare immediatamente il Fornitore in caso di utilizzo non autorizzato
              del proprio account o qualsiasi altra violazione della sicurezza.
            </p>
            <p className="mt-3">
              Il Fornitore si riserva il diritto di sospendere o chiudere account che violino i presenti Termini,
              senza preavviso in caso di violazioni gravi.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              3. Piani di abbonamento e pagamenti
            </h2>
            <p>
              SafeTrack offre diversi piani di abbonamento, incluso un piano gratuito con funzionalità limitate.
              I piani a pagamento prevedono un canone mensile il cui importo è specificato nella pagina prezzi
              della Piattaforma.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Periodo di prova:</strong> Tutti i piani a pagamento includono un periodo di prova
                gratuita di 30 giorni. Al termine del periodo di prova, l&apos;Utente sarà invitato a inserire
                un metodo di pagamento per continuare ad utilizzare le funzionalità del piano scelto.
              </li>
              <li>
                <strong>Fatturazione:</strong> Gli abbonamenti sono fatturati mensilmente in anticipo. L&apos;importo
                sarà addebitato sul metodo di pagamento indicato dall&apos;Utente alla data di rinnovo.
              </li>
              <li>
                <strong>Rimborsi:</strong> Non sono previsti rimborsi per periodi di abbonamento parzialmente
                utilizzati, salvo diversa disposizione di legge.
              </li>
              <li>
                <strong>Modifiche ai prezzi:</strong> Il Fornitore si riserva il diritto di modificare i prezzi
                degli abbonamenti con un preavviso di almeno 30 giorni tramite comunicazione via email.
              </li>
            </ul>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              4. Obblighi dell&apos;Utente
            </h2>
            <p>L&apos;Utente si impegna a:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Utilizzare il Servizio esclusivamente per le finalità previste e nel rispetto della normativa vigente.</li>
              <li>Inserire dati veritieri, accurati e aggiornati.</li>
              <li>Non condividere le proprie credenziali di accesso con soggetti terzi non autorizzati.</li>
              <li>Non utilizzare il Servizio per scopi illeciti, fraudolenti o in violazione di diritti di terzi.</li>
              <li>Non tentare di accedere a porzioni del Servizio non autorizzate o di compromettere la sicurezza della Piattaforma.</li>
              <li>Effettuare regolarmente un backup dei propri dati, ove ritenuto opportuno.</li>
            </ul>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              5. Proprieta intellettuale
            </h2>
            <p>
              Tutti i diritti di proprietà intellettuale relativi alla Piattaforma, inclusi software, design,
              loghi, testi e documentazione, sono e restano di proprietà esclusiva del Fornitore.
            </p>
            <p className="mt-3">
              L&apos;Utente conserva la proprietà dei dati inseriti nella Piattaforma. Con l&apos;utilizzo del
              Servizio, l&apos;Utente concede al Fornitore una licenza limitata per trattare tali dati al solo
              fine di erogare il Servizio.
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              6. Limitazioni di responsabilità
            </h2>
            <div
              className="p-4 rounded-lg mb-4"
              style={{
                backgroundColor: "var(--color-warning-50)",
                border: "1px solid var(--color-warning-100)",
              }}
            >
              <p className="font-semibold mb-2" style={{ color: "var(--color-warning)" }}>
                Avvertenza importante
              </p>
              <p style={{ color: "var(--color-text-primary)" }}>
                SafeTrack è uno <strong>strumento di supporto organizzativo</strong> e NON sostituisce in alcun
                modo la competenza professionale, il giudizio tecnico e la responsabilità del Responsabile del
                Servizio di Prevenzione e Protezione (RSPP) o di qualsiasi altro professionista della sicurezza
                sul lavoro. L&apos;Utente resta l&apos;unico responsabile della verifica della correttezza e
                completezza degli adempimenti normativi.
              </p>
            </div>
            <p>Il Fornitore non sarà responsabile per:</p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>Danni diretti o indiretti derivanti dall&apos;utilizzo o dall&apos;impossibilita di utilizzare il Servizio.</li>
              <li>Eventuali errori, omissioni o inesattezze nelle informazioni normative preconfigurate nella Piattaforma.</li>
              <li>Sanzioni, multe o provvedimenti derivanti dal mancato adempimento di obblighi normativi da parte dell&apos;Utente.</li>
              <li>Perdita di dati causata da eventi al di fuori del ragionevole controllo del Fornitore (forza maggiore).</li>
              <li>Interruzioni temporanee del Servizio per manutenzione programmata o straordinaria.</li>
            </ul>
            <p className="mt-3">
              In ogni caso, la responsabilità complessiva del Fornitore nei confronti dell&apos;Utente non potrà
              eccedere l&apos;importo complessivo corrisposto dall&apos;Utente nei 12 mesi precedenti l&apos;evento
              che ha dato origine alla responsabilità.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              7. Trattamento dei dati personali
            </h2>
            <p>
              Il trattamento dei dati personali da parte del Fornitore è disciplinato dalla{" "}
              <Link href="/privacy" className="font-medium underline" style={{ color: "var(--color-primary)" }}>
                Privacy Policy
              </Link>
              , che costituisce parte integrante dei presenti Termini di Servizio.
            </p>
            <p className="mt-3">
              L&apos;Utente, in qualità di Titolare del trattamento dei dati dei propri dipendenti e clienti
              inseriti nella Piattaforma, nomina il Fornitore quale Responsabile del trattamento ai sensi
              dell&apos;art. 28 del Regolamento (UE) 2016/679 (GDPR).
            </p>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              8. Livelli di servizio e disponibilità
            </h2>
            <p>
              Il Fornitore si impegna a garantire una disponibilità del Servizio pari ad almeno il 99,5% su base
              mensile, esclusi i periodi di manutenzione programmata. Le manutenzioni programmate saranno
              comunicate con un preavviso di almeno 24 ore tramite email o notifica in-app.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              9. Durata e recesso
            </h2>
            <p>
              Il contratto ha durata mensile e si rinnova automaticamente alla scadenza di ciascun periodo di
              fatturazione, salvo disdetta da parte dell&apos;Utente.
            </p>
            <ul className="list-disc pl-5 mt-3 space-y-2">
              <li>
                <strong>Recesso dell&apos;Utente:</strong> L&apos;Utente può recedere dal contratto in qualsiasi
                momento dalle impostazioni del proprio account. Il recesso avra effetto al termine del periodo
                di fatturazione in corso.
              </li>
              <li>
                <strong>Esportazione dati:</strong> In caso di recesso, l&apos;Utente avra la possibilita di
                esportare i propri dati entro 30 giorni dalla cessazione del Servizio.
              </li>
              <li>
                <strong>Cancellazione dati:</strong> Trascorsi 90 giorni dalla cessazione del Servizio, tutti
                i dati dell&apos;Utente saranno cancellati in modo definitivo, salvo obblighi di conservazione
                previsti dalla legge.
              </li>
            </ul>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              10. Modifiche ai Termini
            </h2>
            <p>
              Il Fornitore si riserva il diritto di modificare i presenti Termini di Servizio in qualsiasi momento.
              Le modifiche saranno comunicate all&apos;Utente via email almeno 30 giorni prima della loro entrata
              in vigore.
            </p>
            <p className="mt-3">
              L&apos;utilizzo continuato del Servizio dopo l&apos;entrata in vigore delle modifiche costituira
              accettazione delle stesse. In caso di disaccordo, l&apos;Utente potra recedere dal contratto
              secondo le modalita previste all&apos;art. 9.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              11. Legge applicabile e foro competente
            </h2>
            <p>
              I presenti Termini di Servizio sono regolati dalla legge italiana. Per qualsiasi controversia
              derivante dall&apos;interpretazione o dall&apos;esecuzione dei presenti Termini, sarà competente
              in via esclusiva il Foro di Como (Italia), fatte salve le disposizioni inderogabili a tutela
              del consumatore ove applicabili.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--color-text-primary)" }}>
              12. Contatti
            </h2>
            <p>
              Per qualsiasi domanda relativa ai presenti Termini di Servizio, è possibile contattare il
              Fornitore all&apos;indirizzo:
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
            <Link href="/cookie" className="hover:underline">Cookie Policy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
