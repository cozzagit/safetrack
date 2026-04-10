import { NextRequest } from 'next/server';
import {
  eq,
  and,
  ne,
  asc,
  desc,
  sql,
  lte,
  gte,
  ilike,
  or,
} from 'drizzle-orm';
import { db } from '@/lib/db';
import { deadlines, deadlineTypes, employees, companies } from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth';

// ─── GET /api/deadlines ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const url = request.nextUrl;
    const status = url.searchParams.get('status');
    const companyId = url.searchParams.get('companyId');
    const employeeId = url.searchParams.get('employeeId');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    const sortDir = url.searchParams.get('sort') === 'desc' ? desc : asc;

    const now = new Date();

    // Build conditions array
    const conditions = [eq(deadlines.userId, user.id)];

    // Status filter — maps to actual deadline state
    if (status === 'overdue') {
      conditions.push(
        sql`${deadlines.dueDate} < ${now}`,
        ne(deadlines.status, 'completed'),
        ne(deadlines.status, 'not_applicable')
      );
    } else if (status === 'expiring_soon') {
      const thirtyDays = new Date(now);
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      conditions.push(
        gte(deadlines.dueDate, now),
        lte(deadlines.dueDate, thirtyDays),
        ne(deadlines.status, 'completed'),
        ne(deadlines.status, 'not_applicable')
      );
    } else if (status === 'pending') {
      const thirtyDays = new Date(now);
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      conditions.push(
        sql`${deadlines.dueDate} > ${thirtyDays}`,
        ne(deadlines.status, 'completed'),
        ne(deadlines.status, 'not_applicable')
      );
    } else if (status === 'completed') {
      conditions.push(eq(deadlines.status, 'completed'));
    }

    if (companyId) {
      conditions.push(eq(deadlines.companyId, companyId));
    }

    if (employeeId) {
      conditions.push(eq(deadlines.employeeId, employeeId));
    }

    if (category) {
      conditions.push(
        eq(
          deadlineTypes.category,
          category as
            | 'formazione'
            | 'sorveglianza_sanitaria'
            | 'documenti_aziendali'
            | 'verifiche_impianti'
            | 'dpi'
            | 'altro'
        )
      );
    }

    if (from) {
      conditions.push(gte(deadlines.dueDate, new Date(from)));
    }

    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(deadlines.dueDate, toDate));
    }

    // Search filter on employee name or deadline type name
    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(deadlineTypes.name, pattern),
          ilike(employees.firstName, pattern),
          ilike(employees.lastName, pattern),
          ilike(companies.name, pattern)
        )!
      );
    }

    const results = await db
      .select({
        id: deadlines.id,
        companyId: deadlines.companyId,
        employeeId: deadlines.employeeId,
        dueDate: deadlines.dueDate,
        completedDate: deadlines.completedDate,
        status: deadlines.status,
        priority: deadlines.priority,
        notes: deadlines.notes,
        renewalDate: deadlines.renewalDate,
        notificationsSnoozedUntil: deadlines.notificationsSnoozedUntil,
        createdAt: deadlines.createdAt,
        deadlineTypeId: deadlines.deadlineTypeId,
        deadlineTypeName: deadlineTypes.name,
        deadlineTypeCategory: deadlineTypes.category,
        periodicityMonths: deadlineTypes.defaultPeriodicityMonths,
        employeeFirstName: employees.firstName,
        employeeLastName: employees.lastName,
        companyName: companies.name,
      })
      .from(deadlines)
      .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
      .innerJoin(companies, eq(deadlines.companyId, companies.id))
      .leftJoin(employees, eq(deadlines.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(sortDir(deadlines.dueDate))
      .limit(200);

    const data = results.map((d) => {
      const dueDate = new Date(d.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let computedStatus: string;
      if (d.status === 'completed') computedStatus = 'completed';
      else if (daysRemaining < 0) computedStatus = 'overdue';
      else if (daysRemaining <= 7) computedStatus = 'urgent';
      else if (daysRemaining <= 30) computedStatus = 'expiring_soon';
      else computedStatus = 'on_track';

      return {
        id: d.id,
        companyId: d.companyId,
        employeeId: d.employeeId,
        dueDate: dueDate.toISOString().split('T')[0],
        completedDate: d.completedDate
          ? new Date(d.completedDate).toISOString().split('T')[0]
          : null,
        status: d.status,
        computedStatus,
        priority: d.priority,
        notes: d.notes,
        renewalDate: d.renewalDate
          ? new Date(d.renewalDate).toISOString().split('T')[0]
          : null,
        notificationsSnoozedUntil: d.notificationsSnoozedUntil
          ? new Date(d.notificationsSnoozedUntil).toISOString().split('T')[0]
          : null,
        daysRemaining,
        deadlineTypeId: d.deadlineTypeId,
        deadlineTypeName: d.deadlineTypeName,
        category: d.deadlineTypeCategory,
        periodicityMonths: d.periodicityMonths,
        employeeName: d.employeeFirstName
          ? `${d.employeeFirstName} ${d.employeeLastName}`
          : null,
        companyName: d.companyName,
      };
    });

    return Response.json({ data });
  } catch (error) {
    console.error('[GET /api/deadlines]', error);
    return serverErrorResponse();
  }
}
