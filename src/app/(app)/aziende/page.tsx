"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Search,
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  MapPin,
  User,
  Loader2,
} from "lucide-react";
import { RiskBadge } from "@/components/shared/RiskBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeadlineStats {
  total: number;
  overdue: number;
  expiringSoon: number;
}

interface Company {
  id: string;
  name: string;
  atecoCode: string | null;
  riskLevel: "basso" | "medio" | "alto";
  city: string | null;
  province: string | null;
  employeeCount: number;
  legalRepresentative: string | null;
  deadlineStats: DeadlineStats;
}

// ─── Company Card ─────────────────────────────────────────────────────────────

function CompanyCard({ company }: { company: Company }) {
  const { deadlineStats } = company;
  const ok =
    deadlineStats.total -
    deadlineStats.overdue -
    deadlineStats.expiringSoon;

  return (
    <Link
      href={`/aziende/${company.id}`}
      className="card card-hover block p-5"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h2
          className="text-base font-bold leading-snug truncate flex-1"
          style={{ color: "var(--color-text-primary)" }}
        >
          {company.name}
        </h2>
        <RiskBadge level={company.riskLevel} size="sm" />
      </div>

      {/* ATECO */}
      {company.atecoCode && (
        <p
          className="text-xs mb-3 font-mono"
          style={{ color: "var(--color-text-muted)" }}
        >
          ATECO {company.atecoCode}
        </p>
      )}

      {/* Location */}
      {(company.city || company.province) && (
        <div
          className="flex items-center gap-1 mb-3"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs truncate">
            {[company.city, company.province].filter(Boolean).join(", ")}
          </span>
        </div>
      )}

      {/* Legal rep */}
      {company.legalRepresentative && (
        <div
          className="flex items-center gap-1 mb-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <User className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs truncate">
            {company.legalRepresentative}
          </span>
        </div>
      )}

      {/* Divider */}
      <div
        className="border-t pt-3 flex items-center justify-between gap-3"
        style={{ borderColor: "var(--color-border)" }}
      >
        {/* Employee count */}
        <div
          className="flex items-center gap-1"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {company.employeeCount} dip.
          </span>
        </div>

        {/* Deadline mini-badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {deadlineStats.overdue > 0 && (
            <span
              className="badge text-[10px] px-2 py-0.5"
              style={{
                backgroundColor: "var(--color-danger-100)",
                color: "var(--color-danger)",
              }}
            >
              {deadlineStats.overdue} urgenti
            </span>
          )}
          {deadlineStats.expiringSoon > 0 && (
            <span
              className="badge text-[10px] px-2 py-0.5"
              style={{
                backgroundColor: "var(--color-warning-100)",
                color: "var(--color-warning)",
              }}
            >
              {deadlineStats.expiringSoon} in scad.
            </span>
          )}
          {ok > 0 && (
            <span
              className="badge text-[10px] px-2 py-0.5"
              style={{
                backgroundColor: "var(--color-accent-100)",
                color: "var(--color-accent-dark)",
              }}
            >
              {ok} ok
            </span>
          )}
          {deadlineStats.total === 0 && (
            <span
              className="text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Nessuna scadenza
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
        style={{ backgroundColor: "var(--color-primary-50)" }}
      >
        <Building2
          className="w-10 h-10"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
      <h3
        className="text-lg font-bold mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        Nessuna azienda ancora
      </h3>
      <p
        className="text-sm max-w-xs mb-6"
        style={{ color: "var(--color-text-muted)" }}
      >
        Inizia aggiungendo la tua prima azienda cliente per tracciare dipendenti
        e scadenze di sicurezza.
      </p>
      <Link href="/aziende/nuova" className="btn-primary">
        <Plus className="w-4 h-4" />
        Aggiungi prima azienda
      </Link>
    </div>
  );
}

// ─── No Results State ─────────────────────────────────────────────────────────

function NoResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Search
        className="w-10 h-10 mb-4"
        style={{ color: "var(--color-text-muted)" }}
      />
      <p
        className="text-base font-semibold mb-1"
        style={{ color: "var(--color-text-primary)" }}
      >
        Nessun risultato per &ldquo;{query}&rdquo;
      </p>
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        Prova a modificare i termini di ricerca.
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AziendePage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/companies");
        if (!res.ok) throw new Error("Errore nel caricamento");
        const json = await res.json();
        setCompanies(json.data ?? []);
      } catch {
        setError("Impossibile caricare le aziende. Riprova.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.atecoCode?.toLowerCase().includes(q) ||
        c.legalRepresentative?.toLowerCase().includes(q)
    );
  }, [companies, search]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
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
              Le tue Aziende
            </h1>
            {!loading && (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {companies.length}{" "}
                {companies.length === 1 ? "azienda cliente" : "aziende clienti"}
              </p>
            )}
          </div>
        </div>
        <Link href="/aziende/nuova" className="btn-primary self-start">
          <Plus className="w-4 h-4" />
          Aggiungi Azienda
        </Link>
      </div>

      {/* Search */}
      {!loading && companies.length > 0 && (
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            type="search"
            placeholder="Cerca per nome, città, ATECO..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "var(--color-primary)" }}
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="card p-6 text-center"
          style={{ borderColor: "var(--color-danger-100)" }}
        >
          <AlertTriangle
            className="w-8 h-8 mx-auto mb-3"
            style={{ color: "var(--color-danger)" }}
          />
          <p style={{ color: "var(--color-danger)" }}>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary mt-4"
          >
            Riprova
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && companies.length === 0 && <EmptyState />}

      {/* No search results */}
      {!loading && !error && companies.length > 0 && filtered.length === 0 && (
        <NoResults query={search} />
      )}

      {/* Company grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}
