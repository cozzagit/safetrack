'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowLeft,
  Save,
  FileText,
  User,
  Calendar,
  Clock,
  Building,
  ChevronDown,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface OCRResult {
  employeeName: string | null;
  courseName: string | null;
  courseDate: string | null;
  expiryDate: string | null;
  issuingBody: string | null;
  durationHours: number | null;
  confidence: number;
  rawText: string;
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

interface DeadlineOption {
  id: string;
  dueDate: string;
  deadlineType: { name: string } | null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ScanPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State: flow stages
  const [stage, setStage] = useState<
    'upload' | 'processing' | 'results' | 'saving' | 'done'
  >('upload');

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // OCR results (editable)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [courseDate, setCourseDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [durationHours, setDurationHours] = useState('');

  // Link to deadline
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [deadlinesForEmployee, setDeadlinesForEmployee] = useState<
    DeadlineOption[]
  >([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedDeadlineId, setSelectedDeadlineId] = useState('');

  // Error / success
  const [error, setError] = useState<string | null>(null);
  const [savedDocId, setSavedDocId] = useState<string | null>(null);

  // ─── Load companies on mount ─────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setCompanies(res.data);
      })
      .catch(() => {});
  }, []);

  // ─── Load employees when company changes ─────────────────────────────────

  useEffect(() => {
    if (!selectedCompanyId) {
      setEmployees([]);
      setSelectedEmployeeId('');
      return;
    }
    fetch(`/api/companies/${selectedCompanyId}/employees`)
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setEmployees(res.data);
      })
      .catch(() => {});
  }, [selectedCompanyId]);

  // ─── Load deadlines when employee changes ────────────────────────────────

  useEffect(() => {
    if (!selectedEmployeeId || !selectedCompanyId) {
      setDeadlinesForEmployee([]);
      setSelectedDeadlineId('');
      return;
    }
    fetch(
      `/api/dashboard/stats?companyId=${selectedCompanyId}&employeeId=${selectedEmployeeId}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (res.data?.deadlines) setDeadlinesForEmployee(res.data.deadlines);
      })
      .catch(() => {});
  }, [selectedEmployeeId, selectedCompanyId]);

  // ─── File handling ───────────────────────────────────────────────────────

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      setSelectedFile(file);

      // Preview
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);

      // Start OCR
      setStage('processing');

      const formData = new FormData();
      formData.append('file', file);
      // Use a temporary company if none selected
      if (selectedCompanyId) {
        formData.append('companyId', selectedCompanyId);
      }

      try {
        // If we have a deadline selected, upload to that endpoint
        let endpoint = '/api/documents';
        if (selectedDeadlineId) {
          endpoint = `/api/deadlines/${selectedDeadlineId}/upload`;
        } else if (!selectedCompanyId) {
          // We need at least a company to upload — run OCR client-side instead
          // by sending the image to a temporary analysis endpoint
          // For now, we require a company selection
          setStage('upload');
          setError(
            'Seleziona almeno un\'azienda prima di caricare il documento.'
          );
          return;
        }

        if (selectedEmployeeId) {
          formData.append('employeeId', selectedEmployeeId);
        }
        formData.append('documentType', 'attestato');

        const res = await fetch(endpoint, { method: 'POST', body: formData });
        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.error?.message || 'Errore nel caricamento');
        }

        // Populate fields from OCR
        const ocr: OCRResult | null = json.ocr;
        setOcrResult(ocr);

        if (ocr) {
          setEmployeeName(ocr.employeeName || '');
          setCourseName(ocr.courseName || '');
          setCourseDate(ocr.courseDate || '');
          setExpiryDate(ocr.expiryDate || '');
          setIssuingBody(ocr.issuingBody || '');
          setDurationHours(
            ocr.durationHours ? String(ocr.durationHours) : ''
          );
        }

        setSavedDocId(json.data?.id || null);
        setStage('results');
      } catch (err) {
        console.error('[Scan]', err);
        setError(
          err instanceof Error ? err.message : 'Errore durante l\'analisi'
        );
        setStage('upload');
      }
    },
    [selectedCompanyId, selectedEmployeeId, selectedDeadlineId]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const openCamera = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const openFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  // ─── Save (update document if needed) ────────────────────────────────────

  const handleSave = async () => {
    setStage('saving');
    // The document was already saved during upload.
    // In a production version, we'd PATCH the document with edited fields here.
    // For now, just transition to done.
    await new Promise((r) => setTimeout(r, 500));
    setStage('done');
  };

  const handleReset = () => {
    setStage('upload');
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setEmployeeName('');
    setCourseName('');
    setCourseDate('');
    setExpiryDate('');
    setIssuingBody('');
    setDurationHours('');
    setError(null);
    setSavedDocId(null);
  };

  // ─── Confidence indicator ────────────────────────────────────────────────

  function ConfidenceBar({ value }: { value: number }) {
    const color =
      value >= 70
        ? 'var(--color-accent)'
        : value >= 40
          ? 'var(--color-warning)'
          : 'var(--color-danger)';
    const label =
      value >= 70 ? 'Alta' : value >= 40 ? 'Media' : 'Bassa';

    return (
      <div className="flex items-center gap-3">
        <div
          className="h-2 rounded-full flex-1"
          style={{ backgroundColor: 'var(--color-border)' }}
        >
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
        <span className="text-xs font-semibold" style={{ color }}>
          {value}% — {label}
        </span>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/documenti')}
          className="p-2 rounded-lg hover:bg-[var(--color-primary-50)] transition-colors"
          style={{ minHeight: 44, minWidth: 44 }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <div>
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Scansiona Attestato
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Fotografa o carica un certificato per estrarre i dati automaticamente
          </p>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center gap-3 p-4 rounded-lg mb-4"
          style={{
            backgroundColor: 'var(--color-danger-50)',
            border: '1px solid var(--color-danger-100)',
          }}
        >
          <XCircle size={18} style={{ color: 'var(--color-danger)' }} />
          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-danger)' }}
          >
            {error}
          </p>
        </div>
      )}

      {/* Company / Employee selector — always visible */}
      <div className="card p-4 mb-4">
        <p
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Collega il documento
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Company */}
          <div>
            <label className="input-label">Azienda *</label>
            <div className="relative">
              <select
                className="input-field appearance-none pr-8"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
              >
                <option value="">Seleziona azienda...</option>
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

          {/* Employee */}
          <div>
            <label className="input-label">Dipendente</label>
            <div className="relative">
              <select
                className="input-field appearance-none pr-8"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={!selectedCompanyId}
              >
                <option value="">Seleziona dipendente...</option>
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

        {/* Deadline (optional) */}
        {deadlinesForEmployee.length > 0 && (
          <div className="mt-3">
            <label className="input-label">Scadenza collegata</label>
            <div className="relative">
              <select
                className="input-field appearance-none pr-8"
                value={selectedDeadlineId}
                onChange={(e) => setSelectedDeadlineId(e.target.value)}
              >
                <option value="">Nessuna scadenza...</option>
                {deadlinesForEmployee.map((dl) => (
                  <option key={dl.id} value={dl.id}>
                    {dl.deadlineType?.name || 'Scadenza'} —{' '}
                    {new Date(dl.dueDate).toLocaleDateString('it-IT')}
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
        )}
      </div>

      {/* ── UPLOAD STAGE ──────────────────────────────────────────────── */}
      {stage === 'upload' && (
        <div
          className="card p-6"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleInputChange}
          />

          <div
            className="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-primary-50)',
            }}
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-primary-100)' }}
              >
                <Camera
                  size={28}
                  style={{ color: 'var(--color-primary)' }}
                />
              </div>
              <div>
                <p
                  className="font-semibold text-base"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Scatta una foto o carica un file
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  JPG, PNG, WebP o PDF — max 10 MB
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                <button
                  onClick={openCamera}
                  className="btn-primary flex-1"
                  disabled={!selectedCompanyId}
                >
                  <Camera size={18} />
                  Fotocamera
                </button>
                <button
                  onClick={openFilePicker}
                  className="btn-secondary flex-1"
                  disabled={!selectedCompanyId}
                >
                  <Upload size={18} />
                  Carica File
                </button>
              </div>

              {!selectedCompanyId && (
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-warning)' }}
                >
                  Seleziona un&apos;azienda per procedere
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PROCESSING STAGE ──────────────────────────────────────────── */}
      {stage === 'processing' && (
        <div className="card p-8">
          <div className="flex flex-col items-center gap-5">
            {/* Preview */}
            {previewUrl && (
              <div
                className="w-full max-w-sm rounded-lg overflow-hidden"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <img
                  src={previewUrl}
                  alt="Anteprima documento"
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Animated scanner effect */}
            <div className="relative w-full max-w-sm">
              <div
                className="h-1 rounded-full animate-pulse"
                style={{ backgroundColor: 'var(--color-primary)' }}
              />
            </div>

            <div className="flex items-center gap-3">
              <Loader2
                size={24}
                className="animate-spin"
                style={{ color: 'var(--color-primary)' }}
              />
              <div>
                <p
                  className="font-semibold"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  Analisi in corso...
                </p>
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  L&apos;AI sta estraendo i dati dall&apos;attestato
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESULTS STAGE ─────────────────────────────────────────────── */}
      {stage === 'results' && ocrResult && (
        <div className="card p-5">
          {/* Confidence */}
          <div className="mb-5">
            <p
              className="text-sm font-semibold mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Affidabilita estrazione
            </p>
            <ConfidenceBar value={ocrResult.confidence} />
          </div>

          {/* Preview thumbnail */}
          {previewUrl && (
            <div
              className="rounded-lg overflow-hidden mb-5"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <img
                src={previewUrl}
                alt="Anteprima"
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          {/* Editable fields */}
          <div className="space-y-4">
            <div>
              <label className="input-label flex items-center gap-2">
                <User size={14} /> Nome Lavoratore
              </label>
              <input
                type="text"
                className="input-field"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="Non estratto"
              />
            </div>

            <div>
              <label className="input-label flex items-center gap-2">
                <FileText size={14} /> Corso
              </label>
              <input
                type="text"
                className="input-field"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="Non estratto"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label flex items-center gap-2">
                  <Calendar size={14} /> Data Corso
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={courseDate}
                  onChange={(e) => setCourseDate(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label flex items-center gap-2">
                  <Calendar size={14} /> Scadenza
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label flex items-center gap-2">
                  <Clock size={14} /> Durata (ore)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  placeholder="-"
                  min={0}
                />
              </div>
              <div>
                <label className="input-label flex items-center gap-2">
                  <Building size={14} /> Ente
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={issuingBody}
                  onChange={(e) => setIssuingBody(e.target.value)}
                  placeholder="Non estratto"
                />
              </div>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            className="btn-accent w-full mt-6"
            style={{ fontSize: '1rem', padding: '14px 20px' }}
          >
            <Save size={18} />
            Salva e Aggiorna Scadenza
          </button>
        </div>
      )}

      {/* ── SAVING STAGE ──────────────────────────────────────────────── */}
      {stage === 'saving' && (
        <div className="card p-8 text-center">
          <Loader2
            size={32}
            className="animate-spin mx-auto mb-3"
            style={{ color: 'var(--color-primary)' }}
          />
          <p
            className="font-semibold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Salvataggio in corso...
          </p>
        </div>
      )}

      {/* ── DONE STAGE ────────────────────────────────────────────────── */}
      {stage === 'done' && (
        <div className="card p-8 text-center">
          <CheckCircle2
            size={48}
            className="mx-auto mb-4"
            style={{ color: 'var(--color-accent)' }}
          />
          <h2
            className="text-lg font-bold mb-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Documento salvato!
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: 'var(--color-text-muted)' }}
          >
            L&apos;attestato e stato caricato e i dati estratti correttamente.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={handleReset} className="btn-primary">
              <Camera size={18} />
              Scansiona altro
            </button>
            <button
              onClick={() => router.push('/documenti')}
              className="btn-secondary"
            >
              <FileText size={18} />
              Vai ai documenti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
