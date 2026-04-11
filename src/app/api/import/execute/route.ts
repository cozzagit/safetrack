import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and, isNull, sql, ilike } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  companies,
  employees,
  deadlines,
  deadlineTypes,
} from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

// Import the temp store from preview route
// Note: in serverless/edge, this will only work within the same process
// For production, use Redis or a DB-backed temp store
import { tempFileStore } from '../preview/route';

// ─── Types ──────────────────────────────────────────────────────────────────

const executeSchema = z.object({
  fileId: z.string().min(1),
  mapping: z.record(z.string(), z.string()),
  defaultCompanyId: z.string().optional().nullable(),
  options: z.object({
    createCompanies: z.boolean().default(true),
    generateDeadlines: z.boolean().default(true),
    markHistoryComplete: z.boolean().default(true),
  }),
});

// Training field → search keywords for matching deadline types
const TRAINING_FIELD_KEYWORDS: Record<string, string[]> = {
  formazioneGenerale: ['formazione generale'],
  formazioneSpecifica: ['formazione specifica'],
  formazionePreposti: ['formazione preposti', 'preposti'],
  antincendio: ['antincendio', 'prevenzione incendi'],
  primoSoccorso: ['primo soccorso'],
  visitaMedica: ['visita medica', 'sorveglianza sanitaria', 'idoneità'],
  rls: ['rls', 'rappresentante lavoratori'],
};

// Periodicity defaults for renewal calculation (months)
const TRAINING_PERIODICITY: Record<string, number> = {
  formazioneGenerale: 0, // one-time
  formazioneSpecifica: 60,
  formazionePreposti: 24,
  antincendio: 60,
  primoSoccorso: 36,
  visitaMedica: 12,
  rls: 12,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseDate(value: unknown): Date | null {
  if (!value) return null;

  const str = String(value).trim();
  if (!str) return null;

  // Already a Date object from SheetJS
  if (value instanceof Date && !isNaN(value.getTime())) return value;

  // Try ISO format
  const isoDate = new Date(str);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try dd/mm/yyyy or dd-mm-yyyy (common Italian format)
  const ddmmyyyy = str.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    let year = parseInt(ddmmyyyy[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };

  // Italian convention: "COGNOME NOME" — assume first part is lastName
  // But also handle "NOME COGNOME" — heuristic: if all caps, assume COGNOME NOME
  const isAllCaps = parts.every((p) => p === p.toUpperCase());
  if (isAllCaps && parts.length >= 2) {
    // "ROSSI MARIO" → lastName=ROSSI, firstName=MARIO
    return {
      lastName: parts[0],
      firstName: parts.slice(1).join(' '),
    };
  }

  // Default: last word is lastName
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

interface ImportError {
  row: number;
  message: string;
}

// ─── POST /api/import/execute ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { message: 'Body JSON non valido' } },
      { status: 400 }
    );
  }

  const parsed = executeSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const { fileId, mapping, defaultCompanyId, options } = parsed.data;

  // Retrieve stored file data
  const fileData = tempFileStore.get(fileId);
  if (!fileData || fileData.userId !== user.id) {
    return Response.json(
      {
        error: {
          message:
            'File non trovato o scaduto. Ricarica il file e riprova.',
        },
      },
      { status: 404 }
    );
  }

  try {
    // Preload all deadline types for matching
    const allDeadlineTypes = await db.select().from(deadlineTypes);

    // Build reverse mapping: field → column name
    const fieldToColumn: Record<string, string> = {};
    for (const [col, field] of Object.entries(mapping)) {
      if (field !== 'SKIP') {
        fieldToColumn[field] = col;
      }
    }

    // Cache for companies: name → id
    const companyCache = new Map<string, string>();
    // Cache for employees: companyId+fiscalCode or companyId+name → id
    const employeeCache = new Map<string, string>();

    let companiesCreated = 0;
    let employeesCreated = 0;
    let deadlinesImported = 0;
    const errors: ImportError[] = [];

    const rows = fileData.rows;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2 for 1-indexed + header row

      try {
        // ─── Resolve company ─────────────────────────────────────────
        let companyId = defaultCompanyId || null;

        if (!companyId && fieldToColumn.companyName) {
          const companyName = String(
            row[fieldToColumn.companyName] ?? ''
          ).trim();
          if (!companyName) {
            errors.push({ row: rowNum, message: 'Nome azienda mancante' });
            continue;
          }

          // Check cache
          const cachedId = companyCache.get(companyName.toLowerCase());
          if (cachedId) {
            companyId = cachedId;
          } else {
            // Try to find existing company
            const [existing] = await db
              .select({ id: companies.id })
              .from(companies)
              .where(
                and(
                  eq(companies.userId, user.id),
                  ilike(companies.name, companyName),
                  isNull(companies.deletedAt)
                )
              )
              .limit(1);

            if (existing) {
              companyId = existing.id;
            } else if (options.createCompanies) {
              const [newCompany] = await db
                .insert(companies)
                .values({
                  userId: user.id,
                  name: companyName,
                  riskLevel: 'medio',
                })
                .returning({ id: companies.id });
              companyId = newCompany.id;
              companiesCreated++;
            } else {
              errors.push({
                row: rowNum,
                message: `Azienda "${companyName}" non trovata`,
              });
              continue;
            }

            companyCache.set(companyName.toLowerCase(), companyId);
          }
        }

        if (!companyId) {
          errors.push({
            row: rowNum,
            message: 'Impossibile determinare l\'azienda',
          });
          continue;
        }

        // ─── Resolve employee ────────────────────────────────────────
        let firstName = '';
        let lastName = '';

        if (fieldToColumn.employeeFirstName && fieldToColumn.employeeLastName) {
          firstName = String(
            row[fieldToColumn.employeeFirstName] ?? ''
          ).trim();
          lastName = String(
            row[fieldToColumn.employeeLastName] ?? ''
          ).trim();
        } else if (fieldToColumn.employeeLastName) {
          // Might be a full name mapped to lastName
          const fullName = String(
            row[fieldToColumn.employeeLastName] ?? ''
          ).trim();
          const split = splitFullName(fullName);
          firstName = split.firstName;
          lastName = split.lastName;
        } else if (fieldToColumn.employeeFirstName) {
          const fullName = String(
            row[fieldToColumn.employeeFirstName] ?? ''
          ).trim();
          const split = splitFullName(fullName);
          firstName = split.firstName;
          lastName = split.lastName;
        }

        if (!firstName && !lastName) {
          errors.push({ row: rowNum, message: 'Nome dipendente mancante' });
          continue;
        }

        // Normalize names to title case
        firstName = firstName
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        lastName = lastName
          .toLowerCase()
          .replace(/\b\w/g, (c) => c.toUpperCase());

        const fiscalCode = fieldToColumn.employeeFiscalCode
          ? String(row[fieldToColumn.employeeFiscalCode] ?? '')
              .trim()
              .toUpperCase()
          : '';

        const employeeRole = fieldToColumn.employeeRole
          ? String(row[fieldToColumn.employeeRole] ?? '').trim()
          : '';

        const hiringDate = fieldToColumn.hiringDate
          ? parseDate(row[fieldToColumn.hiringDate])
          : null;

        // Lookup employee
        const cacheKey = fiscalCode
          ? `${companyId}:cf:${fiscalCode}`
          : `${companyId}:name:${firstName.toLowerCase()}:${lastName.toLowerCase()}`;

        let employeeId = employeeCache.get(cacheKey);

        if (!employeeId) {
          // Try DB lookup
          let existingEmployee;

          if (fiscalCode) {
            [existingEmployee] = await db
              .select({ id: employees.id })
              .from(employees)
              .where(
                and(
                  eq(employees.companyId, companyId),
                  eq(employees.fiscalCode, fiscalCode),
                  isNull(employees.deletedAt)
                )
              )
              .limit(1);
          }

          if (!existingEmployee) {
            [existingEmployee] = await db
              .select({ id: employees.id })
              .from(employees)
              .where(
                and(
                  eq(employees.companyId, companyId),
                  ilike(employees.firstName, firstName),
                  ilike(employees.lastName, lastName),
                  isNull(employees.deletedAt)
                )
              )
              .limit(1);
          }

          if (existingEmployee) {
            employeeId = existingEmployee.id;
          } else {
            // Create new employee
            const [newEmployee] = await db
              .insert(employees)
              .values({
                companyId,
                userId: user.id,
                firstName,
                lastName,
                fiscalCode: fiscalCode || null,
                role: employeeRole || null,
                hiringDate,
              })
              .returning({ id: employees.id });

            employeeId = newEmployee.id;
            employeesCreated++;

            // Update company employee count
            await db
              .update(companies)
              .set({
                employeeCount: sql`${companies.employeeCount} + 1`,
              })
              .where(eq(companies.id, companyId));
          }

          employeeCache.set(cacheKey, employeeId);
        }

        // ─── Import training dates as deadlines ──────────────────────
        const trainingFields = [
          'formazioneGenerale',
          'formazioneSpecifica',
          'formazionePreposti',
          'antincendio',
          'primoSoccorso',
          'visitaMedica',
          'rls',
        ];

        for (const field of trainingFields) {
          const col = fieldToColumn[field];
          if (!col) continue;

          const dateValue = parseDate(row[col]);
          if (!dateValue) continue;

          // Find matching deadline type
          const keywords = TRAINING_FIELD_KEYWORDS[field] ?? [];
          const matchedType = allDeadlineTypes.find((dt) =>
            keywords.some((kw) => dt.name.toLowerCase().includes(kw))
          );

          if (!matchedType) continue;

          if (options.markHistoryComplete) {
            // Create a completed deadline for the historical date
            await db.insert(deadlines).values({
              userId: user.id,
              companyId,
              employeeId,
              deadlineTypeId: matchedType.id,
              dueDate: dateValue,
              completedDate: dateValue,
              status: 'completed',
              priority: 'medium',
              notes: 'Importato da Excel',
            });
            deadlinesImported++;
          }

          if (options.generateDeadlines) {
            // Calculate next renewal
            const periodicityMonths =
              matchedType.defaultPeriodicityMonths ||
              TRAINING_PERIODICITY[field] ||
              0;
            if (periodicityMonths > 0) {
              const renewalDate = new Date(dateValue);
              renewalDate.setMonth(
                renewalDate.getMonth() + periodicityMonths
              );

              // Only create future deadline if renewal is not already past
              const now = new Date();
              const status =
                renewalDate < now
                  ? 'overdue'
                  : renewalDate <
                      new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
                    ? 'expiring_soon'
                    : 'pending';

              const priority =
                status === 'overdue'
                  ? 'critical'
                  : status === 'expiring_soon'
                    ? 'high'
                    : 'medium';

              await db.insert(deadlines).values({
                userId: user.id,
                companyId,
                employeeId,
                deadlineTypeId: matchedType.id,
                dueDate: renewalDate,
                status: status as 'pending' | 'expiring_soon' | 'overdue',
                priority: priority as 'medium' | 'high' | 'critical',
                notes: 'Rinnovo generato da importazione Excel',
              });
              deadlinesImported++;
            }
          }
        }
      } catch (rowError) {
        const message =
          rowError instanceof Error ? rowError.message : 'Errore sconosciuto';
        errors.push({ row: rowNum, message });
      }
    }

    // Clean up temp file
    tempFileStore.delete(fileId);

    return Response.json({
      data: {
        companiesCreated,
        employeesCreated,
        deadlinesImported,
        totalRows: rows.length,
        errorCount: errors.length,
        errors: errors.slice(0, 50), // Limit error list
      },
    });
  } catch (error) {
    console.error('[POST /api/import/execute]', error);
    return serverErrorResponse("Errore durante l'importazione");
  }
}
