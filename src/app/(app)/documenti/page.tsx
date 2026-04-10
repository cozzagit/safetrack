'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Camera,
  Download,
  Filter,
  Calendar,
  Building,
  User,
  ChevronDown,
  Loader2,
  FolderOpen,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DocumentItem {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  documentType: string;
  title: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  issuingBody: string | null;
  aiExtracted: boolean;
  aiConfidence: string | null;
  companyId: string;
  employeeId: string | null;
  deadlineId: string | null;
  createdAt: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const DOC_TYPE_LABELS: Record<string, string> = {
  attestato: 'Attestato',
  verbale: 'Verbale',
  certificato: 'Certificato',
  altro: 'Altro',
};

function isImageMime(mime: string): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mime);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filterCompanyId, setFilterCompanyId] = useState('');
  const [filterEmployeeId, setFilterEmployeeId] = useState('');

  // Company name map for display
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});

  // ─── Load data ───────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setCompanies(res.data);
          const map: Record<string, string> = {};
          for (const c of res.data) {
            map[c.id] = c.name;
          }
          setCompanyNames(map);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!filterCompanyId) {
      setEmployees([]);
      setFilterEmployeeId('');
      return;
    }
    fetch(`/api/companies/${filterCompanyId}/employees`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setEmployees(res.data);
      })
      .catch(() => {});
  }, [filterCompanyId]);

  useEffect(() => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (filterCompanyId) params.set('companyId', filterCompanyId);
    if (filterEmployeeId) params.set('employeeId', filterEmployeeId);

    fetch(`/api/documents?${params.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setDocuments(res.data);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [filterCompanyId, filterEmployeeId]);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Documenti
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {documents.length} document{documents.length === 1 ? 'o' : 'i'}{' '}
            caricati
          </p>
        </div>

        <Link href="/documenti/scansiona" className="btn-accent">
          <Camera size={18} />
          Scansiona Attestato
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm font-semibold w-full"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Filter size={16} />
          Filtri
          <ChevronDown
            size={16}
            className={`ml-auto transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border)' }}>
            <div>
              <label className="input-label">Azienda</label>
              <div className="relative">
                <select
                  className="input-field appearance-none pr-8"
                  value={filterCompanyId}
                  onChange={(e) => setFilterCompanyId(e.target.value)}
                >
                  <option value="">Tutte le aziende</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Dipendente</label>
              <div className="relative">
                <select
                  className="input-field appearance-none pr-8"
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  disabled={!filterCompanyId}
                >
                  <option value="">Tutti i dipendenti</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: 'var(--color-text-muted)' }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2
            size={32}
            className="animate-spin mx-auto mb-3"
            style={{ color: 'var(--color-primary)' }}
          />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Caricamento documenti...
          </p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && documents.length === 0 && (
        <div className="card p-12 text-center">
          <FolderOpen
            size={48}
            className="mx-auto mb-4"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <h2
            className="text-lg font-semibold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Nessun documento
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Inizia caricando o scansionando un attestato di formazione.
          </p>
          <Link href="/documenti/scansiona" className="btn-primary">
            <Camera size={18} />
            Scansiona il primo attestato
          </Link>
        </div>
      )}

      {/* Documents grid */}
      {!isLoading && documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="card card-hover p-4">
              {/* Thumbnail for images */}
              {isImageMime(doc.mimeType) && (
                <div
                  className="rounded-lg overflow-hidden mb-3 h-32 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(/api/documents/${doc.id}/thumbnail)`,
                    backgroundColor: 'var(--color-primary-50)',
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <FileText
                      size={32}
                      style={{ color: 'var(--color-primary-100)' }}
                    />
                  </div>
                </div>
              )}

              {/* Doc info */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3
                    className="font-semibold text-sm truncate"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {doc.title || doc.fileName}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="badge badge-primary">
                      {DOC_TYPE_LABELS[doc.documentType] || doc.documentType}
                    </span>
                    {doc.aiExtracted && (
                      <span className="badge badge-accent">AI</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="mt-3 space-y-1">
                {companyNames[doc.companyId] && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Building size={12} />
                    {companyNames[doc.companyId]}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <Calendar size={12} />
                  Caricato: {formatDate(doc.createdAt)}
                </div>
                {doc.issueDate && (
                  <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    <Calendar size={12} />
                    Rilascio: {formatDate(doc.issueDate)}
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <FileText size={12} />
                  {formatFileSize(doc.fileSize)}
                </div>
              </div>

              {/* Download */}
              <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                <a
                  href={`/api/documents/${doc.id}/download`}
                  className="flex items-center gap-2 text-xs font-semibold"
                  style={{ color: 'var(--color-primary)' }}
                >
                  <Download size={14} />
                  Scarica
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
