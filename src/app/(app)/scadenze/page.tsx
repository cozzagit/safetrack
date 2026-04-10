"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Calendar,
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  BellOff,
  Edit3,
  Eye,
  X,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, getDay } from "date-fns";
import { it } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DeadlineItem {
  id: string;
  companyId: string;
  employeeId: string | null;
  dueDate: string;
  completedDate: string | null;
  status: string;
  computedStatus: string;
  priority: string;
  notes: string | null;
  renewalDate: string | null;
  daysRemaining: number;
  deadlineTypeId: number;
  deadlineTypeName: string;
  category: string;
  periodicityMonths: number;
  employeeName: string | null;
  companyName: string;
}

interface CompanyOption {
  id: string;
  name: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { key: "", label: "Tutte", color: "var(--color-text-secondary)", bg: "var(--color-surface)" },
  { key: "overdue", label: "Scadute", color: "var(--color-danger)", bg: "var(--color-danger-100)" },
  { key: "expiring_soon", label: "In scadenza", color: "var(--color-warning)", bg: "var(--color-warning-100)" },
  { key: "pending", label: "In regola", color: "var(--color-accent-dark)", bg: "var(--color-accent-100)" },
  { key: "completed", label: "Completate", color: "var(--color-text-muted)", bg: "var(--color-border)" },
] as const;

const CATEGORY_OPTIONS = [
  { value: "", label: "Tutte le categorie" },
  { value: "formazione", label: "Formazione" },
  { value: "sorveglianza_sanitaria", label: "Sorveglianza Sanitaria" },
  { value: "documenti_aziendali", label: "Documenti Aziendali" },
  { value: "verifiche_impianti", label: "Verifiche Impianti" },
  { value: "dpi", label: "DPI" },
  { value: "altro", label: "Altro" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getStatusBarColor(status: string): string {
  switch (status) {
    case "overdue": return "var(--color-danger)";
    case "urgent": return "#e65100";
    case "expiring_soon": return "var(--color-warning)";
    case "completed": return "var(--color-text-muted)";
    default: return "var(--color-accent)";
  }
}

function getDaysLabel(days: number, completed: boolean): string {
  if (completed) return "Completata";
  if (days < 0) return `Scaduta ${Math.abs(days)}gg fa`;
  if (days === 0) return "Scade oggi";
  if (days === 1) return "Scade domani";
  return `${days}gg rimanenti`;
}

function getDaysBadgeStyle(days: number, completed: boolean) {
  if (completed) return { bg: "var(--color-accent-100)", color: "var(--color-accent-dark)" };
  if (days < 0) return { bg: "var(--color-danger-100)", color: "var(--color-danger)" };
  if (days <= 7) return { bg: "#fff3e0", color: "#e65100" };
  if (days <= 30) return { bg: "var(--color-warning-100)", color: "var(--color-warning)" };
  return { bg: "var(--color-accent-100)", color: "var(--color-accent-dark)" };
}

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    formazione: "Formazione",
    sorveglianza_sanitaria: "Sorveglianza",
    documenti_aziendali: "Documenti",
    verifiche_impianti: "Verifiche",
    dpi: "DPI",
    altro: "Altro",
  };
  return map[cat] || cat;
}

// ─── Complete Modal ──────────────────────────────────────────────────────────

function CompleteModal({
  deadline,
  open,
  onClose,
  onConfirm,
  completing,
}: {
  deadline: DeadlineItem | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string, date: string) => void;
  completing: boolean;
}) {
  const [completionDate, setCompletionDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );

  useEffect(() => {
    if (open) {
      setCompletionDate(format(new Date(), "yyyy-MM-dd"));
    }
  }, [open]);

  if (!deadline) return null;

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl p-6"
          style={{
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <Dialog.Title
            className="text-lg font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            Conferma Completamento
          </Dialog.Title>
          <Dialog.Description
            className="text-sm mb-5"
            style={{ color: "var(--color-text-muted)" }}
          >
            Stai completando la scadenza &ldquo;{deadline.deadlineTypeName}&rdquo;
            {deadline.employeeName ? ` di ${deadline.employeeName}` : ""}.
            {deadline.periodicityMonths > 0 && (
              <span className="block mt-1" style={{ color: "var(--color-primary)" }}>
                Verra creato automaticamente il prossimo rinnovo tra{" "}
                {deadline.periodicityMonths} mesi.
              </span>
            )}
          </Dialog.Description>

          <label
            className="block text-sm font-medium mb-1.5"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Data completamento
          </label>
          <input
            type="date"
            value={completionDate}
            onChange={(e) => setCompletionDate(e.target.value)}
            className="input-field mb-5"
          />

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={completing}
            >
              Annulla
            </button>
            <button
              onClick={() => onConfirm(deadline.id, completionDate)}
              className="btn-primary"
              disabled={completing}
              style={{
                backgroundColor: "var(--color-accent)",
              }}
            >
              {completing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {completing ? "Completamento..." : "Conferma"}
            </button>
          </div>

          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 p-1 rounded-lg"
              style={{ color: "var(--color-text-muted)" }}
              aria-label="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({
  message,
  visible,
  onHide,
}: {
  message: string;
  visible: boolean;
  onHide: () => void;
}) {
  useEffect(() => {
    if (visible) {
      const t = setTimeout(onHide, 4000);
      return () => clearTimeout(t);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
      style={{
        backgroundColor: "var(--color-accent)",
        color: "white",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
      {message}
    </div>
  );
}

// ─── Deadline Card ───────────────────────────────────────────────────────────

function DeadlineCard({
  deadline,
  onComplete,
}: {
  deadline: DeadlineItem;
  onComplete: (d: DeadlineItem) => void;
}) {
  const isCompleted = deadline.computedStatus === "completed";
  const badgeStyle = getDaysBadgeStyle(deadline.daysRemaining, isCompleted);

  return (
    <div
      className="card flex items-stretch overflow-hidden"
      style={{
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      {/* Status color bar */}
      <div
        className="w-1 flex-shrink-0"
        style={{ backgroundColor: getStatusBarColor(deadline.computedStatus) }}
      />

      <div className="flex-1 px-4 py-3 flex items-center gap-3 min-w-0">
        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: "var(--color-text-primary)" }}
          >
            {deadline.deadlineTypeName}
          </p>
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: "var(--color-text-muted)" }}
          >
            {deadline.employeeName
              ? `${deadline.employeeName} - `
              : ""}
            {deadline.companyName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="text-[10px] px-1.5 py-0.5 rounded font-medium"
              style={{
                backgroundColor: "var(--color-primary-50)",
                color: "var(--color-primary)",
              }}
            >
              {getCategoryLabel(deadline.category)}
            </span>
            <span
              className="text-[10px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {deadline.dueDate}
            </span>
          </div>
        </div>

        {/* Right: badge + actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="badge text-xs whitespace-nowrap"
            style={{
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.color,
            }}
          >
            {getDaysLabel(deadline.daysRemaining, isCompleted)}
          </span>

          {!isCompleted && (
            <button
              onClick={() => onComplete(deadline)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hidden sm:flex items-center gap-1"
              style={{
                backgroundColor: "var(--color-accent-100)",
                color: "var(--color-accent-dark)",
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completata
            </button>
          )}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--color-text-muted)" }}
                aria-label="Azioni"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                className="z-50 min-w-[180px] rounded-lg p-1"
                style={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-lg)",
                }}
                align="end"
                sideOffset={4}
              >
                {!isCompleted && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-accent-100)] transition-colors outline-none sm:hidden"
                    style={{ color: "var(--color-accent-dark)" }}
                    onSelect={() => onComplete(deadline)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Completata
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item asChild>
                  <Link
                    href={`/aziende/${deadline.companyId}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-primary-50)] transition-colors outline-none"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    <Eye className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                    Dettagli azienda
                  </Link>
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-primary-50)] transition-colors outline-none"
                  style={{ color: "var(--color-text-primary)" }}
                  disabled
                >
                  <BellOff className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  Silenzia notifiche
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-sm cursor-pointer hover:bg-[var(--color-primary-50)] transition-colors outline-none"
                  style={{ color: "var(--color-text-primary)" }}
                  disabled
                >
                  <Edit3 className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
                  Modifica
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ───────────────────────────────────────────────────────────

function CalendarView({
  deadlinesList,
  onComplete,
}: {
  deadlinesList: DeadlineItem[];
  onComplete: (d: DeadlineItem) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad with empty cells for the start of the week (Monday-based)
  const startDow = (getDay(monthStart) + 6) % 7; // 0=Mon

  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Map deadlines to dates
  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, DeadlineItem[]>();
    for (const d of deadlinesList) {
      const key = d.dueDate;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return map;
  }, [deadlinesList]);

  const selectedDeadlines = selectedDay
    ? deadlinesByDate.get(format(selectedDay, "yyyy-MM-dd")) ?? []
    : [];

  function getDotColor(items: DeadlineItem[]): string {
    if (items.some((d) => d.computedStatus === "overdue")) return "var(--color-danger)";
    if (items.some((d) => d.computedStatus === "urgent")) return "#e65100";
    if (items.some((d) => d.computedStatus === "expiring_soon")) return "var(--color-warning)";
    return "var(--color-accent)";
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3
          className="text-base font-semibold capitalize"
          style={{ color: "var(--color-text-primary)" }}
        >
          {format(currentMonth, "MMMM yyyy", { locale: it })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px mb-1">
        {["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium py-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px">
        {/* Empty padding cells */}
        {Array.from({ length: startDow }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}

        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const items = deadlinesByDate.get(key) ?? [];
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDay && isSameDay(day, selectedDay);

          return (
            <button
              key={key}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className="aspect-square flex flex-col items-center justify-center rounded-lg transition-colors relative"
              style={{
                backgroundColor: isSelected
                  ? "var(--color-primary-50)"
                  : "transparent",
                border: isToday
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              }}
            >
              <span
                className="text-sm"
                style={{
                  color: isSelected
                    ? "var(--color-primary)"
                    : isSameMonth(day, currentMonth)
                      ? "var(--color-text-primary)"
                      : "var(--color-text-muted)",
                  fontWeight: isToday || isSelected ? 700 : 400,
                }}
              >
                {format(day, "d")}
              </span>
              {items.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: getDotColor(items) }}
                  />
                  {items.length > 1 && (
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          items.length > 2
                            ? "var(--color-warning)"
                            : "var(--color-accent)",
                      }}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day deadlines */}
      {selectedDay && (
        <div className="mt-4 space-y-2">
          <h4
            className="text-sm font-semibold capitalize"
            style={{ color: "var(--color-text-primary)" }}
          >
            {format(selectedDay, "EEEE d MMMM", { locale: it })}
            {selectedDeadlines.length > 0 && (
              <span
                className="ml-2 text-xs font-normal"
                style={{ color: "var(--color-text-muted)" }}
              >
                ({selectedDeadlines.length} scadenz
                {selectedDeadlines.length === 1 ? "a" : "e"})
              </span>
            )}
          </h4>
          {selectedDeadlines.length === 0 ? (
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Nessuna scadenza in questo giorno.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDeadlines.map((d) => (
                <DeadlineCard key={d.id} deadline={d} onComplete={onComplete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: "var(--color-primary-50)" }}
      >
        <Calendar
          className="w-8 h-8"
          style={{ color: "var(--color-primary)" }}
        />
      </div>
      <p
        className="text-base font-semibold mb-1"
        style={{ color: "var(--color-text-primary)" }}
      >
        {hasFilters ? "Nessuna scadenza trovata" : "Nessuna scadenza"}
      </p>
      <p className="text-sm max-w-xs" style={{ color: "var(--color-text-muted)" }}>
        {hasFilters
          ? "Prova a modificare i filtri di ricerca."
          : "Le scadenze appariranno qui quando verranno create per le tue aziende."}
      </p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ScadenzePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" /></div>}>
      <ScadenzePage />
    </Suspense>
  );
}

function ScadenzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get("status") ?? "";

  const [deadlinesList, setDeadlinesList] = useState<DeadlineItem[]>([]);
  const [companiesList, setCompaniesList] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [companyFilter, setCompanyFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // View mode
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  // Complete modal
  const [completeTarget, setCompleteTarget] = useState<DeadlineItem | null>(null);
  const [completing, setCompleting] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // Load companies for filter dropdown
  useEffect(() => {
    async function loadCompanies() {
      try {
        const res = await fetch("/api/companies");
        if (res.ok) {
          const json = await res.json();
          setCompaniesList(
            (json.data ?? []).map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            }))
          );
        }
      } catch {
        // Non-blocking
      }
    }
    loadCompanies();
  }, []);

  // Load deadlines
  const loadDeadlines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (companyFilter) params.set("companyId", companyFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const qs = params.toString();
      const res = await fetch(`/api/deadlines${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Errore nel caricamento");
      const json = await res.json();
      setDeadlinesList(json.data ?? []);
    } catch {
      setError("Impossibile caricare le scadenze. Riprova.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, companyFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    loadDeadlines();
  }, [loadDeadlines]);

  // Complete handler
  async function handleComplete(id: string, completedDate: string) {
    setCompleting(true);
    try {
      const res = await fetch(`/api/deadlines/${id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedDate }),
      });
      if (!res.ok) throw new Error("Errore");
      const json = await res.json();
      const nextDate = json.data?.nextDeadline?.dueDate;

      setCompleteTarget(null);
      setToastMessage(
        nextDate
          ? `Scadenza completata. Prossimo rinnovo: ${nextDate}`
          : "Scadenza completata con successo."
      );
      setToastVisible(true);

      // Reload
      loadDeadlines();
    } catch {
      setToastMessage("Errore durante il completamento.");
      setToastVisible(true);
    } finally {
      setCompleting(false);
    }
  }

  const hasFilters = !!(statusFilter || companyFilter || categoryFilter || searchQuery.trim());

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "var(--color-warning-100)" }}
          >
            <Calendar
              className="w-5 h-5"
              style={{ color: "var(--color-warning)" }}
            />
          </div>
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Scadenze
            </h1>
            {!loading && (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                {deadlinesList.length} scadenz
                {deadlinesList.length === 1 ? "a" : "e"}
                {hasFilters ? " (filtrate)" : ""}
              </p>
            )}
          </div>
        </div>

        {/* View toggle */}
        <div
          className="flex rounded-lg p-0.5 self-start"
          style={{
            backgroundColor: "var(--color-border)",
          }}
        >
          <button
            onClick={() => setViewMode("list")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              backgroundColor:
                viewMode === "list" ? "var(--color-surface)" : "transparent",
              color:
                viewMode === "list"
                  ? "var(--color-text-primary)"
                  : "var(--color-text-muted)",
              boxShadow: viewMode === "list" ? "var(--shadow-sm)" : "none",
            }}
          >
            <List className="w-3.5 h-3.5" />
            Lista
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              backgroundColor:
                viewMode === "calendar" ? "var(--color-surface)" : "transparent",
              color:
                viewMode === "calendar"
                  ? "var(--color-text-primary)"
                  : "var(--color-text-muted)",
              boxShadow: viewMode === "calendar" ? "var(--shadow-sm)" : "none",
            }}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Calendario
          </button>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
        {STATUS_FILTERS.map((sf) => {
          const isActive = statusFilter === sf.key;
          return (
            <button
              key={sf.key}
              onClick={() => setStatusFilter(sf.key)}
              className="px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0"
              style={{
                backgroundColor: isActive ? sf.bg : "transparent",
                color: isActive ? sf.color : "var(--color-text-muted)",
                border: `1px solid ${isActive ? sf.color : "var(--color-border)"}`,
              }}
            >
              {sf.label}
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            type="search"
            placeholder="Cerca per dipendente, tipo o azienda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        {/* Company filter */}
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="">Tutte le aziende</option>
          {companiesList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "var(--color-primary)" }}
          />
        </div>
      )}

      {/* Error */}
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
            onClick={() => loadDeadlines()}
            className="btn-secondary mt-4"
          >
            Riprova
          </button>
        </div>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {deadlinesList.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : viewMode === "list" ? (
            <div className="space-y-2">
              {deadlinesList.map((d) => (
                <DeadlineCard
                  key={d.id}
                  deadline={d}
                  onComplete={(dl) => setCompleteTarget(dl)}
                />
              ))}
            </div>
          ) : (
            <div className="card p-4">
              <CalendarView
                deadlinesList={deadlinesList}
                onComplete={(dl) => setCompleteTarget(dl)}
              />
            </div>
          )}
        </>
      )}

      {/* Complete modal */}
      <CompleteModal
        deadline={completeTarget}
        open={!!completeTarget}
        onClose={() => setCompleteTarget(null)}
        onConfirm={handleComplete}
        completing={completing}
      />

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </div>
  );
}
