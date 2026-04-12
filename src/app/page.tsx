"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Bell,
  ScanLine,
  Calendar,
  Building2,
  CheckCircle2,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Users,
  Zap,
  FileText,
  ClipboardCheck,
  AlignLeft,
  Upload,
  MailWarning,
  BarChart3,
  Clock,
  Smartphone,
  Lock,
  Server,
  HelpCircle,
  X,
  Menu,
} from "lucide-react";
import { useState } from "react";

/* ── Animation helpers ──────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ── Data ───────────────────────────────────────────────── */
const PAIN_POINTS = [
  {
    emoji: "📊",
    text: "Excel con 200 righe di scadenze e la paura di dimenticarne una?",
  },
  {
    emoji: "📞",
    text: "Il titolare ti chiama: \"L'ASL e qui, siamo in regola?\" E tu devi cercare tutto?",
  },
  {
    emoji: "📋",
    text: "Fine trimestre, 50 report da preparare a mano per i clienti?",
  },
] as const;

const FEATURES = [
  {
    Icon: BarChart3,
    title: "Dashboard intelligente",
    description: "Apri l'app e sai subito cosa fare: scadenze urgenti, aziende critiche, piano del mese.",
    colorVar: "--color-primary",
    bgVar: "--color-primary-50",
  },
  {
    Icon: Calendar,
    title: "58 scadenze normative preconfigurate",
    description: "D.Lgs 81/08 completo: formazione, visite mediche, DVR, antincendio, DPI, RENTRI. Non devi configurare nulla.",
    colorVar: "--color-accent",
    bgVar: "--color-accent-50",
  },
  {
    Icon: Zap,
    title: "Generazione automatica scadenze",
    description: "Aggiungi un dipendente con i suoi ruoli, il sistema genera tutte le scadenze obbligatorie. Anche i rinnovi.",
    colorVar: "--color-warning",
    bgVar: "--color-warning-50",
  },
  {
    Icon: ClipboardCheck,
    title: "Kit Ispezione ASL",
    description: "L'ispettore si presenta? Un tocco e hai il fascicolo completo pronto da mostrare. Condividilo via WhatsApp in 10 secondi.",
    colorVar: "--color-primary",
    bgVar: "--color-primary-50",
  },
  {
    Icon: ScanLine,
    title: "Scansione attestati con AI",
    description: "Fotografa un attestato, l'AI estrae nome, corso, data. Tre secondi invece di cinque minuti di data entry.",
    colorVar: "--color-accent",
    bgVar: "--color-accent-50",
  },
  {
    Icon: Clock,
    title: "Allinea storico",
    description: "Dipendente assunto 5 anni fa? Un click allinea tutte le scadenze passate fino ad oggi.",
    colorVar: "--color-warning",
    bgVar: "--color-warning-50",
  },
  {
    Icon: Upload,
    title: "Import da Excel",
    description: "Hai 80 aziende in Excel? Carica il file, l'AI mappa le colonne, importa tutto in 5 minuti.",
    colorVar: "--color-primary",
    bgVar: "--color-primary-50",
  },
  {
    Icon: MailWarning,
    title: "Sollecito formale automatico",
    description: "Genera lettere di sollecito con riferimenti di legge corretti. Tutela legale in 10 secondi.",
    colorVar: "--color-accent",
    bgVar: "--color-accent-50",
  },
  {
    Icon: FileText,
    title: "Report aziendali",
    description: "Report PDF professionali per i tuoi clienti. Generali in batch per tutte le aziende.",
    colorVar: "--color-warning",
    bgVar: "--color-warning-50",
  },
  {
    Icon: Bell,
    title: "Notifiche intelligenti",
    description: "60, 30, 14, 7 giorni prima della scadenza. Email + notifiche push. Non dimentichi piu nulla.",
    colorVar: "--color-primary",
    bgVar: "--color-primary-50",
  },
] as const;

const HOW_IT_WORKS = [
  {
    Icon: Building2,
    title: "Registrati e aggiungi le tue aziende clienti",
    description: "Importa da Excel o inserisci manualmente. Il setup iniziale richiede pochi minuti.",
  },
  {
    Icon: Calendar,
    title: "Il sistema genera automaticamente tutte le scadenze",
    description: "58 tipologie normative preconfigurate. Ogni dipendente riceve le scadenze in base ai suoi ruoli.",
  },
  {
    Icon: Bell,
    title: "Ricevi notifiche, completa le scadenze, genera report",
    description: "Notifiche automatiche, fascicoli pronti per l'ASL e report PDF per i tuoi clienti.",
  },
] as const;

const PRICING_FEATURES = [
  "Aziende",
  "Dipendenti",
  "Scansione AI",
  "Kit Ispezione ASL",
  "Sollecito automatico",
  "Import Excel",
  "Report PDF",
  "Notifiche push",
  "Supporto",
] as const;

const PRICING_PLANS = [
  {
    name: "Free",
    price: "€0",
    period: "per sempre",
    description: "Per provare la piattaforma",
    values: ["3", "15", "5/mese", false, false, false, "Base", true, "Community"],
    cta: "Inizia gratis",
    ctaHref: "/register",
    highlighted: false,
  },
  {
    name: "Base",
    price: "€39",
    period: "/mese",
    description: "Per RSPP freelance",
    values: ["20", "200", "50/mese", true, true, true, "Completo", true, "Email"],
    cta: "Prova 30 giorni gratis",
    ctaHref: "/register?plan=base",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "€79",
    period: "/mese",
    description: "Per studi RSPP in crescita",
    values: ["80", "1.000", "200/mese", true, true, true, "Completo + batch", true, "Prioritario"],
    cta: "Prova 30 giorni gratis",
    ctaHref: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Studio",
    price: "€149",
    period: "/mese",
    description: "Per studi con piu consulenti",
    values: ["Illimitate", "Illimitati", "Illimitate", true, true, true, "Completo + batch", true, "Dedicato"],
    cta: "Prova 30 giorni gratis",
    ctaHref: "/register?plan=studio",
    highlighted: false,
  },
] as const;

const FAQ_ITEMS = [
  {
    q: "Posso importare i dati dal mio Excel attuale?",
    a: "Si, SafeTrack supporta l'importazione da file Excel (.xlsx). Carica il file, l'AI mappa automaticamente le colonne ai campi corretti, e puoi importare aziende e dipendenti in pochi minuti. Supportiamo qualsiasi formato — non devi ristrutturare il tuo foglio.",
  },
  {
    q: "I dati sono al sicuro?",
    a: "Assolutamente si. I dati sono crittografati in transito (TLS) e a riposo. I server sono situati nell'Unione Europea. SafeTrack e conforme al GDPR e tratta i dati sanitari (visite mediche) secondo le basi giuridiche previste dal D.Lgs. 81/08. Non vendiamo ne condividiamo mai i tuoi dati con terze parti per finalita di marketing.",
  },
  {
    q: "Posso usarlo dal telefono?",
    a: "Si, SafeTrack e una Progressive Web App (PWA) ottimizzata per dispositivi mobili. Puoi installarla sulla schermata home del tuo smartphone e usarla come un'app nativa, con notifiche push incluse. Funziona anche offline per la consultazione dei dati.",
  },
  {
    q: "Cosa succede alla fine della prova gratuita?",
    a: "Al termine dei 30 giorni di prova, puoi scegliere di passare a un piano a pagamento oppure continuare con il piano Free (3 aziende, 15 dipendenti). Non chiediamo la carta di credito alla registrazione e non addebitiamo nulla automaticamente. I tuoi dati restano al sicuro.",
  },
  {
    q: "SafeTrack sostituisce il mio lavoro di RSPP?",
    a: "No. SafeTrack e uno strumento di supporto organizzativo che ti aiuta a gestire scadenze e documentazione in modo efficiente. La competenza professionale, il giudizio tecnico e la responsabilita restano interamente del consulente RSPP. SafeTrack ti fa risparmiare tempo, non sostituisce la tua professionalita.",
  },
  {
    q: "Come funziona la scansione AI degli attestati?",
    a: "Scatta una foto o carica l'immagine di un attestato di formazione. L'intelligenza artificiale (OCR avanzato) estrae automaticamente il nome del partecipante, il tipo di corso, la data di svolgimento e l'ente formatore. Tu verifichi i dati e confermi con un tocco. Il processo richiede circa 3 secondi.",
  },
] as const;

/* ── FAQ Accordion Item ─────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-5 text-left gap-4"
        style={{ color: "var(--color-text-primary)" }}
      >
        <span className="font-semibold text-sm md:text-base">{q}</span>
        <ChevronDown
          className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--color-text-muted)" }}
        />
      </button>
      {isOpen && (
        <div
          className="px-5 pb-5 text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {a}
        </div>
      )}
    </div>
  );
}

/* ── Component ──────────────────────────────────────────── */
export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "var(--color-background)", color: "var(--color-text-primary)" }}
    >
      {/* ── NAVBAR ────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50"
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          borderBottom: "1px solid var(--color-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
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

          {/* Nav links — desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
            <a href="#funzionalita" className="hover:text-[var(--color-primary)] transition-colors">Funzionalita</a>
            <a href="#come-funziona" className="hover:text-[var(--color-primary)] transition-colors">Come funziona</a>
            <a href="#prezzi" className="hover:text-[var(--color-primary)] transition-colors">Prezzi</a>
            <a href="#faq" className="hover:text-[var(--color-primary)] transition-colors">FAQ</a>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block btn-secondary py-2 px-4 text-sm">
              Accedi
            </Link>
            <Link href="/register" className="hidden md:flex btn-primary py-2 px-4 text-sm">
              Prova gratis
              <ChevronRight className="w-4 h-4" />
            </Link>
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg"
              style={{ color: "var(--color-text-secondary)" }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden px-4 pb-4 space-y-2"
            style={{ backgroundColor: "var(--color-surface)", borderTop: "1px solid var(--color-border)" }}
          >
            <a href="#funzionalita" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Funzionalita</a>
            <a href="#come-funziona" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Come funziona</a>
            <a href="#prezzi" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>Prezzi</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>FAQ</a>
            <div className="flex gap-3 pt-2">
              <Link href="/login" className="btn-secondary py-2 px-4 text-sm flex-1 text-center">Accedi</Link>
              <Link href="/register" className="btn-primary py-2 px-4 text-sm flex-1 text-center">Prova gratis</Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ── HERO ──────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 50%, #1a4a7a 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(5,150,105,0.25) 0%, transparent 60%)",
            }}
          />

          <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 lg:py-36 relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-3xl"
            >
              {/* Trust badges */}
              <motion.div variants={fadeUp} className="mb-6 flex flex-wrap gap-3">
                {["GDPR Compliant", "D.Lgs 81/08", "Dati in Italia"].map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.12)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.2)",
                    }}
                  >
                    <ShieldCheck className="w-3 h-3" style={{ color: "#6ee7b7" }} />
                    {badge}
                  </span>
                ))}
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white"
              >
                La sicurezza sul lavoro,
                <br />
                <span style={{ color: "#6ee7b7" }}>finalmente sotto controllo.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-base md:text-xl leading-relaxed max-w-2xl"
                style={{ color: "rgba(255,255,255,0.78)" }}
              >
                SafeTrack e la piattaforma che ogni RSPP desidera. Gestisci scadenze, dipendenti e
                documentazione per tutti i tuoi clienti in un unico posto intelligente.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-bold text-base transition-all"
                  style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-accent-dark)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "var(--color-accent)")}
                >
                  Inizia gratis — 30 giorni di prova
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#funzionalita"
                  className="text-base font-medium flex items-center gap-2"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  Scopri come funziona
                  <ChevronRight className="w-4 h-4" />
                </a>
              </motion.div>

              {/* No credit card */}
              <motion.p
                variants={fadeUp}
                className="mt-4 text-sm"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Nessuna carta di credito richiesta
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* ── PAIN POINTS ──────────────────────────────────── */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-12"
            >
              <motion.p
                variants={fadeUp}
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--color-accent)" }}
              >
                Ti riconosci?
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-2xl md:text-3xl font-extrabold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                I problemi che SafeTrack risolve
              </motion.h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid md:grid-cols-3 gap-6"
            >
              {PAIN_POINTS.map(({ emoji, text }) => (
                <motion.div
                  key={text}
                  variants={fadeUp}
                  className="card card-hover p-6 text-center"
                >
                  <div className="text-4xl mb-4">{emoji}</div>
                  <p
                    className="text-sm md:text-base font-medium leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {text}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────── */}
        <section
          id="funzionalita"
          className="py-20 md:py-24"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-14"
            >
              <motion.p
                variants={fadeUp}
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--color-accent)" }}
              >
                Funzionalita
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-2xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                Cosa fa SafeTrack per te
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-base max-w-2xl mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Ogni funzionalita risolve un problema reale del tuo lavoro quotidiano.
              </motion.p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {FEATURES.map(({ Icon, title, description, colorVar, bgVar }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="card card-hover p-6"
                  style={{ backgroundColor: "var(--color-background)" }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `var(${bgVar})` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: `var(${colorVar})` }} />
                  </div>
                  <h3
                    className="text-base font-bold mb-2"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────── */}
        <section
          id="come-funziona"
          className="py-20 md:py-24"
          style={{ backgroundColor: "var(--color-primary-50)" }}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-16"
            >
              <motion.p
                variants={fadeUp}
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--color-accent)" }}
              >
                Come funziona
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-2xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                Operativo in 3 semplici passi
              </motion.h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid md:grid-cols-3 gap-8 relative"
            >
              {/* Connecting line (desktop) */}
              <div
                className="hidden md:block absolute top-10 left-1/4 right-1/4 h-0.5"
                style={{ backgroundColor: "var(--color-border)" }}
              />

              {HOW_IT_WORKS.map(({ title, description, Icon }, index) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="text-center relative"
                >
                  <div className="relative inline-flex mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        border: "2px solid var(--color-border)",
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      <Icon className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
                    </div>
                    <span
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white"
                      style={{ backgroundColor: "var(--color-accent)" }}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <h3
                    className="text-base md:text-lg font-bold mb-3"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed max-w-xs mx-auto"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────────── */}
        <section
          id="prezzi"
          className="py-20 md:py-28"
          style={{ backgroundColor: "var(--color-background)" }}
        >
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-14"
            >
              <motion.p
                variants={fadeUp}
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--color-accent)" }}
              >
                Prezzi
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-2xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                Semplice, trasparente, senza sorprese
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-base"
                style={{ color: "var(--color-text-secondary)" }}
              >
                30 giorni di prova gratuita su tutti i piani. Nessuna carta di credito richiesta.
              </motion.p>
            </motion.div>

            {/* Mobile: scrollable pricing cards */}
            <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 pb-4">
              <motion.div
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                className="grid grid-cols-[repeat(4,280px)] md:grid-cols-4 gap-6 min-w-0 md:min-w-0"
                style={{ width: "fit-content" }}
              >
                {PRICING_PLANS.map(({ name, price, period, description, values, cta, ctaHref, highlighted }) => (
                  <motion.div
                    key={name}
                    variants={fadeUp}
                    className={`relative rounded-xl p-6 flex flex-col ${highlighted ? "ring-2" : "card"}`}
                    style={
                      highlighted
                        ? {
                            backgroundColor: "var(--color-primary)",
                            boxShadow: "0 0 0 2px var(--color-primary), var(--shadow-xl)",
                          }
                        : { minWidth: 260 }
                    }
                  >
                    {highlighted && (
                      <span
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white whitespace-nowrap"
                        style={{ backgroundColor: "var(--color-accent)" }}
                      >
                        Piu popolare
                      </span>
                    )}

                    <div className="mb-5">
                      <h3
                        className="font-bold text-base mb-1"
                        style={{ color: highlighted ? "rgba(255,255,255,0.7)" : "var(--color-text-secondary)" }}
                      >
                        {name}
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-4xl font-extrabold tracking-tight"
                          style={{ color: highlighted ? "white" : "var(--color-text-primary)" }}
                        >
                          {price}
                        </span>
                        <span
                          className="text-sm"
                          style={{ color: highlighted ? "rgba(255,255,255,0.55)" : "var(--color-text-muted)" }}
                        >
                          {period}
                        </span>
                      </div>
                      <p
                        className="text-xs mt-2"
                        style={{ color: highlighted ? "rgba(255,255,255,0.6)" : "var(--color-text-muted)" }}
                      >
                        {description}
                      </p>
                    </div>

                    <ul className="space-y-2.5 mb-7 flex-1">
                      {PRICING_FEATURES.map((feature, i) => {
                        const value = values[i];
                        const isBoolean = typeof value === "boolean";
                        if (isBoolean && !value) {
                          return (
                            <li key={feature} className="flex items-start gap-2.5">
                              <X
                                className="w-4 h-4 flex-shrink-0 mt-0.5"
                                style={{ color: highlighted ? "rgba(255,255,255,0.3)" : "var(--color-text-muted)" }}
                              />
                              <span
                                className="text-sm"
                                style={{ color: highlighted ? "rgba(255,255,255,0.4)" : "var(--color-text-muted)" }}
                              >
                                {feature}
                              </span>
                            </li>
                          );
                        }
                        return (
                          <li key={feature} className="flex items-start gap-2.5">
                            <CheckCircle2
                              className="w-4 h-4 flex-shrink-0 mt-0.5"
                              style={{ color: highlighted ? "var(--color-accent-light)" : "var(--color-accent)" }}
                            />
                            <span
                              className="text-sm"
                              style={{ color: highlighted ? "rgba(255,255,255,0.85)" : "var(--color-text-secondary)" }}
                            >
                              {feature}: <strong>{isBoolean ? "Si" : value}</strong>
                            </span>
                          </li>
                        );
                      })}
                    </ul>

                    <Link
                      href={ctaHref}
                      className="block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm transition-all"
                      style={
                        highlighted
                          ? { backgroundColor: "white", color: "var(--color-primary)" }
                          : { backgroundColor: "var(--color-primary-50)", color: "var(--color-primary)" }
                      }
                    >
                      {cta}
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────── */}
        <section
          id="faq"
          className="py-20 md:py-24"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          <div className="max-w-3xl mx-auto px-4 md:px-6">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
              className="text-center mb-12"
            >
              <motion.p
                variants={fadeUp}
                className="text-sm font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--color-accent)" }}
              >
                Domande frequenti
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-2xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                Hai domande? Abbiamo le risposte.
              </motion.h2>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="space-y-3"
            >
              {FAQ_ITEMS.map(({ q, a }) => (
                <motion.div key={q} variants={fadeUp}>
                  <FAQItem q={q} a={a} />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA BANNER ───────────────────────────────────── */}
        <section
          className="py-20 md:py-24"
          style={{
            background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)",
          }}
        >
          <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.div
                variants={fadeUp}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <ShieldCheck className="w-9 h-9 text-white" />
              </motion.div>
              <motion.h2
                variants={fadeUp}
                className="text-2xl md:text-4xl font-extrabold text-white tracking-tight"
              >
                Prova SafeTrack gratis per 30 giorni
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-base md:text-lg"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                Nessuna carta di credito richiesta. Cancellazione in un click.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-8"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-base transition-all"
                  style={{ backgroundColor: "var(--color-accent)", color: "white" }}
                >
                  Inizia gratis ora
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer
        style={{
          backgroundColor: "var(--color-primary)",
          color: "rgba(255,255,255,0.6)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/10">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">SafeTrack</span>
              </div>
              <p className="text-sm leading-relaxed">
                La piattaforma professionale per la gestione della sicurezza sul lavoro.
              </p>
              <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.4)" }}>
                Un prodotto VibeCanyon
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Prodotto</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#funzionalita" className="hover:text-white transition-colors">Funzionalita</a></li>
                <li><a href="#prezzi" className="hover:text-white transition-colors">Prezzi</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">FAQ</a></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Prova gratis</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legale</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Termini di Servizio</Link></li>
                <li><Link href="/cookie" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Contatti</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a href="mailto:info@vibecanyon.com" className="hover:text-white transition-colors">
                    info@vibecanyon.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 text-sm"
            style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
          >
            <p>&copy; {new Date().getFullYear()} SafeTrack. Tutti i diritti riservati.</p>
            <p>
              Conforme al{" "}
              <strong className="text-white/75">D.Lgs. 81/2008</strong> e successive modifiche
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
