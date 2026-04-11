import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and, lt, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  deadlines,
  deadlineTypes,
  companies,
  activityLog,
} from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

const bulkCompleteSchema = z.object({
  companyId: z.string().optional(),
  employeeId: z.string().optional(),
  beforeDate: z.string(), // ISO date string
  useOriginalDates: z.boolean().default(true),
});

// ─── POST /api/deadlines/bulk-complete ──────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return validationErrorResponse([{ message: 'Body JSON richiesto' }]);
  }

  const parsed = bulkCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const { companyId, employeeId, beforeDate, useOriginalDates } = parsed.data;
  const cutoffDate = new Date(beforeDate);

  // Ownership check: if companyId provided, verify user owns it
  if (companyId) {
    const [company] = await db
      .select({ id: companies.id, userId: companies.userId })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return Response.json(
        { error: { message: 'Azienda non trovata' } },
        { status: 404 }
      );
    }
    if (company.userId !== user.id) return forbiddenResponse();
  }

  try {
    // 1. Fetch all pending deadlines matching filters where dueDate < beforeDate
    const conditions = [
      eq(deadlines.userId, user.id),
      lt(deadlines.dueDate, cutoffDate),
      inArray(deadlines.status, ['pending', 'expiring_soon', 'overdue']),
    ];

    if (companyId) {
      conditions.push(eq(deadlines.companyId, companyId));
    }
    if (employeeId) {
      conditions.push(eq(deadlines.employeeId, employeeId));
    }

    const pendingDeadlines = await db
      .select({
        id: deadlines.id,
        companyId: deadlines.companyId,
        employeeId: deadlines.employeeId,
        deadlineTypeId: deadlines.deadlineTypeId,
        dueDate: deadlines.dueDate,
        priority: deadlines.priority,
        periodicityMonths: deadlineTypes.defaultPeriodicityMonths,
        deadlineTypeName: deadlineTypes.name,
      })
      .from(deadlines)
      .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
      .where(and(...conditions))
      .orderBy(deadlines.dueDate);

    if (pendingDeadlines.length === 0) {
      return Response.json({
        data: {
          completed: 0,
          renewalsCreated: 0,
          pendingRemaining: 0,
        },
      });
    }

    let totalCompleted = 0;
    let totalRenewalsCreated = 0;
    const now = new Date();

    for (const deadline of pendingDeadlines) {
      const completedDate = useOriginalDates
        ? new Date(deadline.dueDate)
        : cutoffDate;

      // Mark current deadline as completed
      await db
        .update(deadlines)
        .set({
          status: 'completed',
          completedDate,
          updatedAt: new Date(),
        })
        .where(and(eq(deadlines.id, deadline.id), eq(deadlines.userId, user.id)));

      totalCompleted++;

      // Chain renewals for periodic deadlines
      if (deadline.periodicityMonths > 0) {
        let nextDueDate = new Date(completedDate);
        nextDueDate.setMonth(nextDueDate.getMonth() + deadline.periodicityMonths);

        // Fast-forward: create and complete renewals until we reach a date >= now
        while (nextDueDate < now) {
          // This renewal is in the past — create it as completed
          const renewalCompletedDate = new Date(nextDueDate);

          await db.insert(deadlines).values({
            userId: user.id,
            companyId: deadline.companyId,
            employeeId: deadline.employeeId,
            deadlineTypeId: deadline.deadlineTypeId,
            dueDate: new Date(nextDueDate),
            status: 'completed',
            completedDate: renewalCompletedDate,
            priority: deadline.priority,
          });

          totalCompleted++;
          totalRenewalsCreated++;

          // Advance to next period
          nextDueDate = new Date(renewalCompletedDate);
          nextDueDate.setMonth(nextDueDate.getMonth() + deadline.periodicityMonths);
        }

        // Final renewal: this one is in the future — stays pending
        await db.insert(deadlines).values({
          userId: user.id,
          companyId: deadline.companyId,
          employeeId: deadline.employeeId,
          deadlineTypeId: deadline.deadlineTypeId,
          dueDate: nextDueDate,
          status: 'pending',
          priority: deadline.priority,
        });

        totalRenewalsCreated++;
      }
    }

    // Count remaining pending deadlines for the scope
    const remainingConditions = [
      eq(deadlines.userId, user.id),
      inArray(deadlines.status, ['pending', 'expiring_soon', 'overdue']),
    ];
    if (companyId) {
      remainingConditions.push(eq(deadlines.companyId, companyId));
    }
    if (employeeId) {
      remainingConditions.push(eq(deadlines.employeeId, employeeId));
    }

    const remainingResult = await db
      .select({ id: deadlines.id })
      .from(deadlines)
      .where(and(...remainingConditions));

    const pendingRemaining = remainingResult.length;

    // Log activity
    await db.insert(activityLog).values({
      userId: user.id,
      action: 'complete',
      entityType: 'deadline',
      entityId: companyId ?? 'bulk',
      details: {
        action: 'bulk_complete',
        companyId: companyId ?? null,
        employeeId: employeeId ?? null,
        beforeDate,
        completed: totalCompleted,
        renewalsCreated: totalRenewalsCreated,
        pendingRemaining,
      },
    });

    return Response.json({
      data: {
        completed: totalCompleted,
        renewalsCreated: totalRenewalsCreated,
        pendingRemaining,
      },
    });
  } catch (error) {
    console.error('[POST /api/deadlines/bulk-complete]', error);
    return serverErrorResponse(
      'Errore durante il completamento massivo delle scadenze'
    );
  }
}
