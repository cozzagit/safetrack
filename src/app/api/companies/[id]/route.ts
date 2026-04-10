import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and, isNull, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, employees, deadlines } from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

// ─── ATECO risk mapping ───────────────────────────────────────────────────────

function deriveRiskLevel(atecoCode: string): 'alto' | 'medio' | 'basso' {
  const first = atecoCode.trim()[0]?.toUpperCase();
  if (['A', 'B', 'C', 'F'].includes(first)) return 'alto';
  if (['D', 'E', 'G', 'H', 'I'].includes(first)) return 'medio';
  return 'basso';
}

// ─── Zod schema (all fields optional for partial update) ─────────────────────

const updateCompanySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  fiscalCode: z.string().max(16).optional().nullable(),
  atecoCode: z
    .string()
    .max(20)
    .regex(/^[A-Z]\d/, { message: 'Codice ATECO non valido (es. C28.15)' })
    .optional()
    .nullable()
    .or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(5).optional().nullable(),
  cap: z.string().max(5).optional().nullable(),
  legalRepresentative: z.string().max(255).optional().nullable(),
  contactEmail: z.string().email('Email non valida').optional().nullable().or(z.literal('')),
  contactPhone: z.string().max(30).optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// ─── Ownership helper ─────────────────────────────────────────────────────────

async function fetchOwnedCompany(companyId: string, userId: string) {
  const [company] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company) return { company: null, error: notFoundResponse('Azienda') };
  if (company.userId !== userId) return { company: null, error: forbiddenResponse() };

  return { company, error: null };
}

// ─── GET /api/companies/:id ───────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const { company, error } = await fetchOwnedCompany(id, user.id);
  if (error) return error;

  try {
    // Employees for this company
    const employeesList = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.companyId, id),
          isNull(employees.deletedAt),
          eq(employees.isActive, true)
        )
      );

    // Deadline summary
    const [deadlineSummary] = await db
      .select({
        total: count(deadlines.id),
        overdue: sql<number>`COUNT(*) FILTER (WHERE ${deadlines.status} = 'overdue')`,
        expiringSoon: sql<number>`COUNT(*) FILTER (WHERE ${deadlines.status} = 'expiring_soon')`,
        completed: sql<number>`COUNT(*) FILTER (WHERE ${deadlines.status} = 'completed')`,
      })
      .from(deadlines)
      .where(eq(deadlines.companyId, id));

    return Response.json({
      data: {
        ...company,
        employees: employeesList,
        deadlineSummary: {
          total: Number(deadlineSummary?.total ?? 0),
          overdue: Number(deadlineSummary?.overdue ?? 0),
          expiringSoon: Number(deadlineSummary?.expiringSoon ?? 0),
          completed: Number(deadlineSummary?.completed ?? 0),
        },
      },
    });
  } catch (err) {
    console.error('[GET /api/companies/:id]', err);
    return serverErrorResponse();
  }
}

// ─── PUT /api/companies/:id ───────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const { company, error } = await fetchOwnedCompany(id, user.id);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { message: 'Body JSON non valido' } },
      { status: 400 }
    );
  }

  const parsed = updateCompanySchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const data = parsed.data;

  // Recalculate riskLevel if atecoCode is being changed
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.atecoCode !== undefined) {
    updates.riskLevel = data.atecoCode
      ? deriveRiskLevel(data.atecoCode)
      : company!.riskLevel;
    // Normalize empty string to null
    if (data.atecoCode === '') updates.atecoCode = null;
  }

  try {
    const [updated] = await db
      .update(companies)
      .set(updates)
      .where(eq(companies.id, id))
      .returning();

    return Response.json({ data: updated });
  } catch (err) {
    console.error('[PUT /api/companies/:id]', err);
    return serverErrorResponse('Errore durante l\'aggiornamento dell\'azienda');
  }
}

// ─── DELETE /api/companies/:id (soft delete) ──────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const { error } = await fetchOwnedCompany(id, user.id);
  if (error) return error;

  try {
    await db
      .update(companies)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(companies.id, id));

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('[DELETE /api/companies/:id]', err);
    return serverErrorResponse('Errore durante l\'eliminazione dell\'azienda');
  }
}
