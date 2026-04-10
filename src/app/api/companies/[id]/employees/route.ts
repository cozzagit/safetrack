import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and, isNull, count, sql } from 'drizzle-orm';
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

// ─── Zod schema ───────────────────────────────────────────────────────────────

const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Nome obbligatorio').max(100),
  lastName: z.string().min(1, 'Cognome obbligatorio').max(100),
  fiscalCode: z.string().max(16).optional(),
  role: z.string().max(100).optional(),
  jobTitle: z.string().max(255).optional(),
  hiringDate: z.string().datetime({ offset: true }).optional().nullable(),
  isPreposto: z.boolean().optional().default(false),
  isDirigente: z.boolean().optional().default(false),
  isRls: z.boolean().optional().default(false),
  isAddettoAntincendio: z.boolean().optional().default(false),
  isAddettoPrimoSoccorso: z.boolean().optional().default(false),
  medicalProtocol: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// ─── Deadline auto-generation logic ───────────────────────────────────────────

async function generateDeadlinesForEmployee(
  employeeId: string,
  companyId: string,
  userId: string,
  hiringDate: Date | null,
  riskLevel: string,
  employeeFlags: {
    isPreposto: boolean;
    isDirigente: boolean;
    isRls: boolean;
    isAddettoAntincendio: boolean;
    isAddettoPrimoSoccorso: boolean;
  }
): Promise<number> {
  // Fetch applicable deadline types
  const allTypes = await db.select().from(deadlineTypes);

  const baseDate = hiringDate ?? new Date();

  const applicableTypes = allTypes.filter((dt) => {
    // Must apply to this risk level (if riskLevels is set)
    if (dt.riskLevels && Array.isArray(dt.riskLevels) && dt.riskLevels.length > 0) {
      if (!dt.riskLevels.includes(riskLevel)) return false;
    }

    // appliesToAll means every employee gets it
    if (dt.appliesToAll) return true;

    // Check role-based flags
    if (dt.appliesToRoles && Array.isArray(dt.appliesToRoles)) {
      const roles = dt.appliesToRoles;
      if (roles.includes('preposto') && employeeFlags.isPreposto) return true;
      if (roles.includes('dirigente') && employeeFlags.isDirigente) return true;
      if (roles.includes('rls') && employeeFlags.isRls) return true;
      if (roles.includes('addetto_antincendio') && employeeFlags.isAddettoAntincendio) return true;
      if (roles.includes('addetto_primo_soccorso') && employeeFlags.isAddettoPrimoSoccorso) return true;
    }

    return false;
  });

  if (applicableTypes.length === 0) return 0;

  const deadlineInserts = applicableTypes.map((dt) => {
    const dueDate = new Date(baseDate);
    if (dt.defaultPeriodicityMonths > 0) {
      dueDate.setMonth(dueDate.getMonth() + dt.defaultPeriodicityMonths);
    }

    return {
      userId,
      companyId,
      employeeId,
      deadlineTypeId: dt.id,
      dueDate,
      status: 'pending' as const,
      priority: 'medium' as const,
    };
  });

  await db.insert(deadlines).values(deadlineInserts);

  return deadlineInserts.length;
}

// ─── GET /api/companies/:id/employees ────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const { error } = await fetchOwnedCompany(id, user.id);
  if (error) return error;

  try {
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

    if (employeesList.length === 0) {
      return Response.json({ data: [] });
    }

    // Compliance stats per employee: % of completed deadlines
    const complianceStats = await db
      .select({
        employeeId: deadlines.employeeId,
        total: count(deadlines.id),
        completed: sql<number>`COUNT(*) FILTER (WHERE ${deadlines.status} = 'completed')`,
      })
      .from(deadlines)
      .where(eq(deadlines.companyId, id))
      .groupBy(deadlines.employeeId);

    const statsMap = new Map(
      complianceStats.map((s) => ({
        key: s.employeeId,
        value: {
          total: Number(s.total),
          completed: Number(s.completed),
          compliancePercent:
            s.total > 0
              ? Math.round((Number(s.completed) / Number(s.total)) * 100)
              : 100,
        },
      })).map(({ key, value }) => [key, value])
    );

    const result = employeesList.map((emp) => ({
      ...emp,
      compliance: statsMap.get(emp.id) ?? {
        total: 0,
        completed: 0,
        compliancePercent: 100,
      },
    }));

    return Response.json({ data: result });
  } catch (err) {
    console.error('[GET /api/companies/:id/employees]', err);
    return serverErrorResponse();
  }
}

// ─── POST /api/companies/:id/employees ───────────────────────────────────────

export async function POST(
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

  const parsed = createEmployeeSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const data = parsed.data;
  const hiringDate = data.hiringDate ? new Date(data.hiringDate) : null;

  try {
    // Create employee
    const [newEmployee] = await db
      .insert(employees)
      .values({
        companyId: id,
        userId: user.id,
        firstName: data.firstName,
        lastName: data.lastName,
        fiscalCode: data.fiscalCode || null,
        role: data.role || null,
        jobTitle: data.jobTitle || null,
        hiringDate,
        isPreposto: data.isPreposto ?? false,
        isDirigente: data.isDirigente ?? false,
        isRls: data.isRls ?? false,
        isAddettoAntincendio: data.isAddettoAntincendio ?? false,
        isAddettoPrimoSoccorso: data.isAddettoPrimoSoccorso ?? false,
        medicalProtocol: data.medicalProtocol || null,
        notes: data.notes || null,
      })
      .returning();

    // Update company employee count
    await db
      .update(companies)
      .set({
        employeeCount: sql`${companies.employeeCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id));

    // Auto-generate deadlines based on company risk level and employee role flags
    const generatedCount = await generateDeadlinesForEmployee(
      newEmployee.id,
      id,
      user.id,
      hiringDate,
      company!.riskLevel,
      {
        isPreposto: newEmployee.isPreposto,
        isDirigente: newEmployee.isDirigente,
        isRls: newEmployee.isRls,
        isAddettoAntincendio: newEmployee.isAddettoAntincendio,
        isAddettoPrimoSoccorso: newEmployee.isAddettoPrimoSoccorso,
      }
    );

    return Response.json(
      { data: { employee: newEmployee, generatedDeadlines: generatedCount } },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /api/companies/:id/employees]', err);
    return serverErrorResponse('Errore durante la creazione del dipendente');
  }
}
