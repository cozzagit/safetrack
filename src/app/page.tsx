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
  Star,
  Users,
  TrendingUp,
  Zap,
} from "lucide-react";

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
const BENEFITS = [
  {
    Icon: Calendar,
    title: "Scadenze automatiche",
    description:
      "Il sistema genera automaticamente tutte le scadenze previste dalla normativa D.Lgs. 81/08 per ogni azienda. Niente più fogli Excel, niente più dimenticanze.",
    colorVar: "--color-primary",
    bgVar: "--color-primary-50",
  },
  {
    Icon: ScanLine,
    title: "Scansione attestati AI",
    description:
      "Carica un attestato e l'intelligenza artificiale estrae automaticamente dati, date di scadenza e nominativi. Risparmia ore di inserimento manuale.",
    colorVar: "--color-accent",
    bgVar: "--color-accent-50",
  },
  {
    Icon: Bell,
    title: "Notifiche intelligenti",
    description:
      "Ricevi notifiche push, email o SMS con 90, 30 e 7 giorni di anticipo. Configura avvisi per te e per i tuoi clienti. Zero sorprese.",
    colorVar: "--color-warning",
    bgVar: "--color-warning-50",
  },
] as const;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Aggiungi le aziende",
    description: "Inserisci i dati delle aziende clienti e i loro dipendenti. L'import da Excel rende il setup velocissimo.",
    Icon: Building2,
  },
  {
    step: "02",
    title: "Il sistema genera le scadenze",
    description: "SafeTrack crea automaticamente il calendario scadenze basandosi su ruoli, mansioni e normativa vigente.",
    Icon: TrendingUp,
  },
  {
    step: "03",
    title: "Ricevi notifiche",
    description: "Sei avvisato in anticipo su ogni scadenza imminente. Agisci prima che diventi un problema o una multa.",
    Icon: Bell,
  },
] as const;

const PRICING_PLANS = [
  {
    name: "Free",
    price: "€0",
    period: "per sempre",
    description: "Per iniziare a capire il valore",
    features: [
      "1 azienda",
      "Fino a 10 dipendenti",
      "Scadenze automatiche",
      "Dashboard base",
    ],
    cta: "Inizia gratis",
    ctaHref: "/register",
    highlighted: false,
  },
  {
    name: "Base",
    price: "€39",
    period: "/mese",
    description: "Per consulenti RSPP freelance",
    features: [
      "Fino a 5 aziende",
      "Dipendenti illimitati",
      "Notifiche email + push",
      "Scansione attestati AI",
      "Esportazione PDF",
    ],
    cta: "Prova 30 giorni gratis",
    ctaHref: "/register?plan=base",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "€79",
    period: "/mese",
    description: "Per studi RSPP in crescita",
    features: [
      "Fino a 20 aziende",
      "Dipendenti illimitati",
      "Tutto di Base +",
      "Notifiche SMS ai clienti",
      "Report personalizzati",
      "Supporto prioritario",
    ],
    cta: "Prova 30 giorni gratis",
    ctaHref: "/register?plan=pro",
    highlighted: true,
  },
  {
    name: "Studio",
    price: "€149",
    period: "/mese",
    description: "Per studi con più consulenti",
    features: [
      "Aziende illimitate",
      "Dipendenti illimitati",
      "Tutto di Pro +",
      "Multi-utente (5 seat)",
      "White-label opzionale",
      "Onboarding dedicato",
    ],
    cta: "Contattaci",
    ctaHref: "/contatti",
    highlighted: false,
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "Da quando uso SafeTrack non ho più perso una scadenza. Gestisco 34 aziende da solo e tutto è sempre sotto controllo.",
    name: "Marco Pellegrini",
    role: "RSPP freelance, Milano",
    initials: "MP",
  },
  {
    quote: "La scansione degli attestati mi ha fatto risparmiare ore ogni settimana. Uno strumento indispensabile per il nostro studio.",
    name: "Laura Conti",
    role: "Studio Sicurezza Conti, Roma",
    initials: "LC",
  },
  {
    quote: "Finalmente uno strumento pensato per chi fa questo lavoro davvero. Le notifiche automatiche ai clienti sono una svolta.",
    name: "Stefano Ricci",
    role: "Consulente RSPP, Torino",
    initials: "SR",
  },
] as const;

/* ── Component ──────────────────────────────────────────── */
export default function LandingPage() {
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
          borderBottom: `1px solid var(--color-border)`,
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
            <a href="#come-funziona" className="hover:text-[var(--color-primary)] transition-colors">Come funziona</a>
            <a href="#prezzi" className="hover:text-[var(--color-primary)] transition-colors">Prezzi</a>
            <Link href="/login" className="hover:text-[var(--color-primary)] transition-colors">Accedi</Link>
          </nav>

          {/* CTA */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden md:block btn-secondary py-2 px-4 text-sm">
              Accedi
            </Link>
            <Link href="/register" className="btn-primary py-2 px-4 text-sm">
              Prova gratis
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ── HERO ──────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 50%, #1a4a7a 100%)`,
          }}
        >
          {/* Background decoration */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(5,150,105,0.25) 0%, transparent 60%)",
            }}
          />
          <div
            className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(255,255,255,0.04) 0%, transparent 60%)",
            }}
          />

          <div className="max-w-7xl mx-auto px-4 md:px-6 py-20 md:py-28 lg:py-36 relative z-10">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="max-w-3xl"
            >
              {/* Badge */}
              <motion.div variants={fadeUp} className="mb-6">
                <span
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.12)",
                    color: "white",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: "var(--color-accent-light)" }} />
                  Nuovo: Scansione attestati con AI
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-white"
              >
                Non perdere mai più
                <br />
                <span style={{ color: "#6ee7b7" }}>una scadenza.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 text-lg md:text-xl leading-relaxed max-w-2xl"
                style={{ color: "rgba(255,255,255,0.78)" }}
              >
                SafeTrack è la piattaforma professionale per consulenti RSPP. Gestisci scadenze,
                attestati e adempimenti D.Lgs. 81/08 di tutte le tue aziende clienti da un unico pannello.
              </motion.p>

              {/* CTAs */}
              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg font-bold text-base transition-all"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "white",
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--color-accent-dark)")
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.backgroundColor =
                      "var(--color-accent)")
                  }
                >
                  Prova gratis 30 giorni
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#come-funziona"
                  className="text-base font-medium flex items-center gap-2"
                  style={{ color: "rgba(255,255,255,0.75)" }}
                >
                  Scopri come funziona
                  <ChevronRight className="w-4 h-4" />
                </a>
              </motion.div>

              {/* Social proof micro */}
              <motion.div
                variants={fadeUp}
                className="mt-10 flex items-center gap-4"
              >
                <div className="flex -space-x-2">
                  {["MP", "LC", "SR", "AB"].map((initials) => (
                    <div
                      key={initials}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                      style={{
                        backgroundColor: "var(--color-accent)",
                        color: "white",
                        borderColor: "var(--color-primary)",
                      }}
                    >
                      {initials}
                    </div>
                  ))}
                </div>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                  <strong className="text-white">240+ consulenti RSPP</strong> già usano SafeTrack
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── BENEFITS ──────────────────────────────────────── */}
        <section className="py-20 md:py-24">
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
                Perché SafeTrack
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-3xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                La sicurezza sul lavoro sotto controllo
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-lg max-w-2xl mx-auto"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Progettato da chi conosce il lavoro del consulente RSPP. Non è un semplice reminder,
                è un sistema professionale.
              </motion.p>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid md:grid-cols-3 gap-8"
            >
              {BENEFITS.map(({ Icon, title, description, colorVar, bgVar }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="card card-hover p-7"
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `var(${bgVar})` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: `var(${colorVar})` }} />
                  </div>
                  <h3
                    className="text-lg font-bold mb-3"
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
                className="text-3xl md:text-4xl font-extrabold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                Operativo in meno di 15 minuti
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

              {HOW_IT_WORKS.map(({ step, title, description, Icon }, index) => (
                <motion.div
                  key={step}
                  variants={fadeUp}
                  className="text-center relative"
                >
                  <div className="relative inline-flex mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{
                        backgroundColor: "var(--color-surface)",
                        border: `2px solid var(--color-border)`,
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
                    className="text-lg font-bold mb-3"
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

        {/* ── TESTIMONIALS ─────────────────────────────────── */}
        <section className="py-20 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-80px" }}
            >
              <motion.div variants={fadeUp} className="text-center mb-14">
                <div className="flex justify-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-5 h-5 fill-current" style={{ color: "#fbbf24" }} />
                  ))}
                </div>
                <h2
                  className="text-3xl md:text-4xl font-extrabold tracking-tight"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Cosa dicono i consulenti
                </h2>
                <p
                  className="mt-3 text-base"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Usato da <strong>240+ professionisti RSPP</strong> in tutta Italia
                </p>
              </motion.div>

              <div className="grid md:grid-cols-3 gap-6">
                {TESTIMONIALS.map(({ quote, name, role, initials }) => (
                  <motion.div
                    key={name}
                    variants={fadeUp}
                    className="card p-6"
                  >
                    <div className="flex gap-1 mb-4">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className="w-4 h-4 fill-current"
                          style={{ color: "#fbbf24" }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-sm leading-relaxed mb-5 italic"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      &ldquo;{quote}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{
                          backgroundColor: "var(--color-primary)",
                          color: "white",
                        }}
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                          {name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          {role}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── PRICING ───────────────────────────────────────── */}
        <section
          id="prezzi"
          className="py-20 md:py-28"
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
                Prezzi
              </motion.p>
              <motion.h2
                variants={fadeUp}
                className="text-3xl md:text-4xl font-extrabold tracking-tight"
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

            <motion.div
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {PRICING_PLANS.map(({ name, price, period, description, features, cta, ctaHref, highlighted }) => (
                <motion.div
                  key={name}
                  variants={fadeUp}
                  className={`relative rounded-xl p-6 flex flex-col ${highlighted ? "ring-2" : "card"}`}
                  style={
                    highlighted
                      ? {
                          backgroundColor: "var(--color-primary)",
                          boxShadow: "var(--shadow-xl)",
                        }
                      : {}
                  }
                >
                  {highlighted && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: "var(--color-accent)" }}
                    >
                      Più scelto
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
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <CheckCircle2
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{
                            color: highlighted ? "var(--color-accent-light)" : "var(--color-accent)",
                          }}
                        />
                        <span
                          className="text-sm"
                          style={{
                            color: highlighted ? "rgba(255,255,255,0.85)" : "var(--color-text-secondary)",
                          }}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={ctaHref}
                    className={`block w-full text-center py-3 px-4 rounded-lg font-semibold text-sm transition-all`}
                    style={
                      highlighted
                        ? {
                            backgroundColor: "white",
                            color: "var(--color-primary)",
                          }
                        : {
                            backgroundColor: "var(--color-primary-50)",
                            color: "var(--color-primary)",
                          }
                    }
                  >
                    {cta}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── CTA BANNER ───────────────────────────────────── */}
        <section
          className="py-20 md:py-24"
          style={{
            background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%)`,
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
                className="text-3xl md:text-4xl font-extrabold text-white tracking-tight"
              >
                Inizia oggi, gratis.
              </motion.h2>
              <motion.p
                variants={fadeUp}
                className="mt-4 text-lg"
                style={{ color: "rgba(255,255,255,0.72)" }}
              >
                30 giorni di prova completa. Nessuna carta di credito. Cancellazione in un click.
              </motion.p>
              <motion.div
                variants={fadeUp}
                className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
              >
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-base transition-all"
                  style={{
                    backgroundColor: "var(--color-accent)",
                    color: "white",
                  }}
                >
                  Prova SafeTrack gratis
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <div
                  className="flex items-center gap-2 text-sm"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  <Users className="w-4 h-4" />
                  <span>240+ consulenti già a bordo</span>
                </div>
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
            </div>

            {/* Product */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Prodotto</h4>
              <ul className="space-y-2.5 text-sm">
                <li><a href="#come-funziona" className="hover:text-white transition-colors">Come funziona</a></li>
                <li><a href="#prezzi" className="hover:text-white transition-colors">Prezzi</a></li>
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

            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Supporto</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/contatti" className="hover:text-white transition-colors">Contattaci</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentazione</Link></li>
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
