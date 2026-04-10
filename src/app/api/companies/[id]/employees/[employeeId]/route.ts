import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, employees, deadlines, deadlineTypes } from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

// ─── Ownership helpers ────────────────────────────────────────────────────────

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

async function fetchActiveEmployee(employeeId: string, companyId: string) {
  const [employee] = await db
    .select()
    .from(employees)
    .where(
      and(
        eq(employees.id, employeeId),
        eq(employees.companyId, companyId),
        isNull(employees.deletedAt)
      )
    )
    .limit(1);

  if (!employee) return { employee: null, error: notFoundResponse('Dipendente') };

  return { employee, error: null };
}

// ─── Zod schema (all optional for partial update) ─────────────────────────────

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  fiscalCode: z.string().max(16).optional().nullable(),
  role: z.string().max(100).optional().nullable(),
  jobTitle: z.string().max(255).optional().nullable(),
  hiringDate: z.string().datetime({ offset: true }).optional().nullable(),
  terminationDate: z.string().datetime({ offset: true }).optional().nullable(),
  isPreposto: z.boolean().optional(),
  isDirigente: z.boolean().optional(),
  isRls: z.boolean().optional(),
  isAddettoAntincendio: z.boolean().optional(),
  isAddettoPrimoSoccorso: z.boolean().optional(),
  medicalProtocol: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

// ─── Deadline regeneration helpers ───────────────────────────────────────────

const ROLE_FLAGS = [
  'isPreposto',
  'isDirigente',
  'isRls',
  'isAddettoAntincendio',
  'isAddettoPrimoSoccorso',
] as const;

type EmployeeRoleFlags = {
  isPreposto: boolean;
  isDirigente: boolean;
  isRls: boolean;
  isAddettoAntincendio: boolean;
  isAddettoPrimoSoccorso: boolean;
};

function roleFlagsChanged(
  original: EmployeeRoleFlags,
  updates: Partial<EmployeeRoleFlags>
): boolean {
  return ROLE_FLAGS.some(
    (flag) => flag in updates && updates[flag] !== original[flag]
  );
}

async function regenerateDeadlinesForEmployee(
  employee: typeof employees.$inferSelect,
  companyRiskLevel: string,
  userId: string
) {
  // Remove all existing pending deadlines for this employee (don't touch completed ones)
  await db
    .delete(deadlines)
    .where(
      and(
        eq(deadlines.employeeId, employee.id),
        eq(deadlines.status, 'pending')
      )
    );

  const allTypes = await db.select().from(deadlineTypes);
  const baseDate = employee.hiringDate ?? new Date();

  const applicableTypes = allTypes.filter((dt) => {
    if (dt.riskLevels && Array.isArray(dt.riskLevels) && dt.riskLevels.length > 0) {
      if (!dt.riskLevels.includes(companyRiskLevel)) return false;
    }
    if (dt.appliesToAll) return true;
    if (dt.appliesToRoles && Array.isArray(dt.appliesToRoles)) {
      const roles = dt.appliesToRoles;
      if (roles.includes('preposto') && employee.isPreposto) return true;
      if (roles.includes('dirigente') && employee.isDirigente) return true;
      if (roles.includes('rls') && employee.isRls) return true;
      if (roles.includes('addetto_antincendio') && employee.isAddettoAntincendio) return true;
      if (roles.includes('addetto_primo_soccorso') && employee.isAddettoPrimoSoccorso) return true;
    }
    return false;
  });

  if (applicableTypes.length === 0) return 0;

  const inserts = applicableTypes.map((dt) => {
    const dueDate = new Date(baseDate);
    if (dt.defaultPeriodicityMonths > 0) {
      dueDate.setMonth(dueDate.getMonth() + dt.defaultPeriodicityMonths);
    }
    return {
      userId,
      companyId: employee.companyId,
      employeeId: employee.id,
      deadlineTypeId: dt.id,
      dueDate,
      status: 'pending' as const,
      priority: 'medium' as const,
    };
  });

  await db.insert(deadlines).values(inserts);
  return inserts.length;
}

// ─── GET /api/companies/:id/employees/:employeeId ────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id, employeeId } = await params;
  const { error: companyError } = await fetchOwnedCompany(id, user.id);
  if (companyError) return companyError;

  const { employee, error: empError } = await fetchActiveEmployee(employeeId, id);
  if (empError) return empError;

  try {
    const employeeDeadlines = await db
      .select()
      .from(deadlines)
      .where(eq(deadlines.employeeId, employeeId));

    return Response.json({
      data: {
        ...employee,
        deadlines: employeeDeadlines,
      },
    });
  } catch (err) {
    console.error('[GET /api/companies/:id/employees/:employeeId]', err);
    return serverErrorResponse();
  }
}

// ─── PUT /api/companies/:id/employees/:employeeId ────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id, employeeId } = await params;
  const { company, error: companyError } = await fetchOwnedCompany(id, user.id);
  if (companyError) return companyError;

  const { employee, error: empError } = await fetchActiveEmployee(employeeId, id);
  if (empError) return empError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { message: 'Body JSON non valido' } },
      { status: 400 }
    );
  }

  const parsed = updateEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const data = parsed.data;

  // Build update payload, normalizing date strings to Date objects
  const updates: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.hiringDate !== undefined) {
    updates.hiringDate = data.hiringDate ? new Date(data.hiringDate) : null;
  }
  if (data.terminationDate !== undefined) {
    updates.terminationDate = data.terminationDate ? new Date(data.terminationDate) : null;
  }

  try {
    const [updated] = await db
      .update(employees)
      .set(updates)
      .where(eq(employees.id, employeeId))
      .returning();

    // Regenerate deadlines if any role flag changed
    let regeneratedDeadlines: number | undefined;
    if (roleFlagsChanged(employee!, data)) {
      regeneratedDeadlines = await regenerateDeadlinesForEmployee(
        updated,
        company!.riskLevel,
        user.id
      );
    }

    return Response.json({
      data: {
        employee: updated,
        ...(regeneratedDeadlines !== undefined && { regeneratedDeadlines }),
      },
    });
  } catch (err) {
    console.error('[PUT /api/companies/:id/employees/:employeeId]', err);
    return serverErrorResponse('Errore durante l\'aggiornamento del dipendente');
  }
}

// ─── DELETE /api/companies/:id/employees/:employeeId (soft delete) ────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; employeeId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id, employeeId } = await params;
  const { error: companyError } = await fetchOwnedCompany(id, user.id);
  if (companyError) return companyError;

  const { error: empError } = await fetchActiveEmployee(employeeId, id);
  if (empError) return empError;

  try {
    await db
      .update(employees)
      .set({ deletedAt: new Date(), isActive: false, updatedAt: new Date() })
      .where(eq(employees.id, employeeId));

    // Decrement company employee count (floor at 0)
    await db
      .update(companies)
      .set({
        employeeCount: sql`GREATEST(${companies.employeeCount} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id));

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('[DELETE /api/companies/:id/employees/:employeeId]', err);
    return serverErrorResponse('Errore durante l\'eliminazione del dipendente');
  }
}
