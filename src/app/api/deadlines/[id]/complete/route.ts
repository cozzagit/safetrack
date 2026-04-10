import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  deadlines,
  deadlineTypes,
  activityLog,
} from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

const completeSchema = z.object({
  completedDate: z.string().optional(), // ISO date string, defaults to today
});

// ─── POST /api/deadlines/:id/complete ────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  // Fetch deadline with its type info
  const results = await db
    .select({
      id: deadlines.id,
      userId: deadlines.userId,
      companyId: deadlines.companyId,
      employeeId: deadlines.employeeId,
      deadlineTypeId: deadlines.deadlineTypeId,
      status: deadlines.status,
      priority: deadlines.priority,
      periodicityMonths: deadlineTypes.defaultPeriodicityMonths,
      deadlineTypeName: deadlineTypes.name,
    })
    .from(deadlines)
    .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
    .where(eq(deadlines.id, id))
    .limit(1);

  const deadline = results[0];
  if (!deadline) return notFoundResponse('Scadenza');
  if (deadline.userId !== user.id) return forbiddenResponse();
  if (deadline.status === 'completed') {
    return Response.json(
      { error: { message: 'Scadenza gia completata' } },
      { status: 409 }
    );
  }

  // Parse optional body
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    // No body is fine — we use today's date
  }

  const parsed = completeSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const completedDate = parsed.data.completedDate
    ? new Date(parsed.data.completedDate)
    : new Date();

  try {
    // Mark as completed
    const [updated] = await db
      .update(deadlines)
      .set({
        status: 'completed',
        completedDate,
        updatedAt: new Date(),
      })
      .where(and(eq(deadlines.id, id), eq(deadlines.userId, user.id)))
      .returning();

    // Auto-create next occurrence if periodicity > 0
    let nextDeadline = null;
    if (deadline.periodicityMonths > 0) {
      const nextDueDate = new Date(completedDate);
      nextDueDate.setMonth(
        nextDueDate.getMonth() + deadline.periodicityMonths
      );

      const [created] = await db
        .insert(deadlines)
        .values({
          userId: user.id,
          companyId: deadline.companyId,
          employeeId: deadline.employeeId,
          deadlineTypeId: deadline.deadlineTypeId,
          dueDate: nextDueDate,
          status: 'pending',
          priority: deadline.priority,
        })
        .returning();

      nextDeadline = {
        id: created.id,
        dueDate: nextDueDate.toISOString().split('T')[0],
      };
    }

    // Log activity
    await db.insert(activityLog).values({
      userId: user.id,
      action: 'complete',
      entityType: 'deadline',
      entityId: id,
      details: {
        deadlineTypeName: deadline.deadlineTypeName,
        completedDate: completedDate.toISOString().split('T')[0],
        nextDeadlineId: nextDeadline?.id ?? null,
        nextDueDate: nextDeadline?.dueDate ?? null,
      },
    });

    return Response.json({
      data: {
        completed: updated,
        nextDeadline,
      },
    });
  } catch (error) {
    console.error('[POST /api/deadlines/:id/complete]', error);
    return serverErrorResponse(
      'Errore durante il completamento della scadenza'
    );
  }
}
