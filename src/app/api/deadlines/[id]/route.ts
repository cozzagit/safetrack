import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deadlines, deadlineTypes, employees, companies } from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

// ─── Ownership helper ────────────────────────────────────────────────────────

async function fetchOwnedDeadline(deadlineId: string, userId: string) {
  const results = await db
    .select({
      id: deadlines.id,
      userId: deadlines.userId,
      companyId: deadlines.companyId,
      employeeId: deadlines.employeeId,
      deadlineTypeId: deadlines.deadlineTypeId,
      dueDate: deadlines.dueDate,
      completedDate: deadlines.completedDate,
      status: deadlines.status,
      priority: deadlines.priority,
      notes: deadlines.notes,
      renewalDate: deadlines.renewalDate,
      lastNotifiedAt: deadlines.lastNotifiedAt,
      notificationsSnoozedUntil: deadlines.notificationsSnoozedUntil,
      createdAt: deadlines.createdAt,
      updatedAt: deadlines.updatedAt,
      deadlineTypeName: deadlineTypes.name,
      deadlineTypeCategory: deadlineTypes.category,
      periodicityMonths: deadlineTypes.defaultPeriodicityMonths,
      legalReference: deadlineTypes.legalReference,
      sanctionInfo: deadlineTypes.sanctionInfo,
      durationHours: deadlineTypes.durationHours,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
      companyName: companies.name,
    })
    .from(deadlines)
    .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
    .innerJoin(companies, eq(deadlines.companyId, companies.id))
    .leftJoin(employees, eq(deadlines.employeeId, employees.id))
    .where(eq(deadlines.id, deadlineId))
    .limit(1);

  const deadline = results[0];
  if (!deadline) return { deadline: null, error: notFoundResponse('Scadenza') };
  if (deadline.userId !== userId)
    return { deadline: null, error: forbiddenResponse() };

  return { deadline, error: null };
}

// ─── Zod schema for update ───────────────────────────────────────────────────

const updateDeadlineSchema = z.object({
  dueDate: z.string().optional(),
  notes: z.string().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

// ─── GET /api/deadlines/:id ──────────────────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const { deadline, error } = await fetchOwnedDeadline(id, user.id);
  if (error) return error;

  const d = deadline!;
  const now = new Date();
  const dueDate = new Date(d.dueDate);
  const daysRemaining = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Response.json({
    data: {
      id: d.id,
      companyId: d.companyId,
      employeeId: d.employeeId,
      deadlineTypeId: d.deadlineTypeId,
      dueDate: dueDate.toISOString().split('T')[0],
      completedDate: d.completedDate
        ? new Date(d.completedDate).toISOString().split('T')[0]
        : null,
      status: d.status,
      priority: d.priority,
      notes: d.notes,
      renewalDate: d.renewalDate
        ? new Date(d.renewalDate).toISOString().split('T')[0]
        : null,
      notificationsSnoozedUntil: d.notificationsSnoozedUntil
        ? new Date(d.notificationsSnoozedUntil).toISOString().split('T')[0]
        : null,
      daysRemaining,
      deadlineTypeName: d.deadlineTypeName,
      category: d.deadlineTypeCategory,
      periodicityMonths: d.periodicityMonths,
      legalReference: d.legalReference,
      sanctionInfo: d.sanctionInfo,
      durationHours: d.durationHours,
      employeeName: d.employeeFirstName
        ? `${d.employeeFirstName} ${d.employeeLastName}`
        : null,
      companyName: d.companyName,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    },
  });
}

// ─── PUT /api/deadlines/:id ──────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;
  const { deadline, error } = await fetchOwnedDeadline(id, user.id);
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

  const parsed = updateDeadlineSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const data = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (data.dueDate !== undefined) {
    updates.dueDate = new Date(data.dueDate);
  }
  if (data.notes !== undefined) {
    updates.notes = data.notes;
  }
  if (data.priority !== undefined) {
    updates.priority = data.priority;
  }

  try {
    const [updated] = await db
      .update(deadlines)
      .set(updates)
      .where(and(eq(deadlines.id, id), eq(deadlines.userId, user.id)))
      .returning();

    return Response.json({ data: updated });
  } catch (err) {
    console.error('[PUT /api/deadlines/:id]', err);
    return serverErrorResponse("Errore durante l'aggiornamento della scadenza");
  }
}
