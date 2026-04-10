import { NextRequest } from 'next/server';
import { eq, and, isNull, count, sql, desc, asc, lte, gte, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  companies,
  employees,
  deadlines,
  deadlineTypes,
  activityLog,
} from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth';

// ─── GET /api/dashboard/stats ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    // Run all queries in parallel
    const [
      overdueResult,
      expiringResult,
      companiesCount,
      employeesCount,
      totalDeadlinesResult,
      completedOrNotDueResult,
      upcomingDeadlinesList,
      recentActivityList,
    ] = await Promise.all([
      // Overdue: past due date, not completed
      db
        .select({ count: count(deadlines.id) })
        .from(deadlines)
        .where(
          and(
            eq(deadlines.userId, user.id),
            sql`${deadlines.dueDate} < ${now}`,
            ne(deadlines.status, 'completed'),
            ne(deadlines.status, 'not_applicable')
          )
        ),

      // Expiring: due within 30 days, not overdue, not completed
      db
        .select({ count: count(deadlines.id) })
        .from(deadlines)
        .where(
          and(
            eq(deadlines.userId, user.id),
            gte(deadlines.dueDate, now),
            lte(deadlines.dueDate, thirtyDaysFromNow),
            ne(deadlines.status, 'completed'),
            ne(deadlines.status, 'not_applicable')
          )
        ),

      // Active companies count
      db
        .select({ count: count(companies.id) })
        .from(companies)
        .where(
          and(
            eq(companies.userId, user.id),
            eq(companies.isActive, true),
            isNull(companies.deletedAt)
          )
        ),

      // Active employees count
      db
        .select({ count: count(employees.id) })
        .from(employees)
        .where(
          and(
            eq(employees.userId, user.id),
            eq(employees.isActive, true),
            isNull(employees.deletedAt)
          )
        ),

      // Total non-NA deadlines (for compliance rate)
      db
        .select({ count: count(deadlines.id) })
        .from(deadlines)
        .where(
          and(
            eq(deadlines.userId, user.id),
            ne(deadlines.status, 'not_applicable')
          )
        ),

      // Completed + not yet due (compliance numerator)
      db
        .select({ count: count(deadlines.id) })
        .from(deadlines)
        .where(
          and(
            eq(deadlines.userId, user.id),
            ne(deadlines.status, 'not_applicable'),
            sql`(${deadlines.status} = 'completed' OR ${deadlines.dueDate} >= ${now})`
          )
        ),

      // Next 10 upcoming deadlines (not completed, sorted by dueDate)
      db
        .select({
          id: deadlines.id,
          dueDate: deadlines.dueDate,
          status: deadlines.status,
          companyId: deadlines.companyId,
          deadlineTypeName: deadlineTypes.name,
          deadlineTypeCategory: deadlineTypes.category,
          employeeFirstName: employees.firstName,
          employeeLastName: employees.lastName,
          companyName: companies.name,
        })
        .from(deadlines)
        .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
        .innerJoin(companies, eq(deadlines.companyId, companies.id))
        .leftJoin(employees, eq(deadlines.employeeId, employees.id))
        .where(
          and(
            eq(deadlines.userId, user.id),
            ne(deadlines.status, 'completed'),
            ne(deadlines.status, 'not_applicable')
          )
        )
        .orderBy(asc(deadlines.dueDate))
        .limit(10),

      // Last 5 activity log entries
      db
        .select()
        .from(activityLog)
        .where(eq(activityLog.userId, user.id))
        .orderBy(desc(activityLog.createdAt))
        .limit(5),
    ]);

    const urgentDeadlines = Number(overdueResult[0]?.count ?? 0);
    const expiringDeadlines = Number(expiringResult[0]?.count ?? 0);
    const totalCompanies = Number(companiesCount[0]?.count ?? 0);
    const totalEmployees = Number(employeesCount[0]?.count ?? 0);
    const totalDeadlines = Number(totalDeadlinesResult[0]?.count ?? 0);
    const compliantDeadlines = Number(completedOrNotDueResult[0]?.count ?? 0);

    const complianceRate =
      totalDeadlines > 0
        ? Math.round((compliantDeadlines / totalDeadlines) * 1000) / 10
        : 100;

    const upcomingDeadlines = upcomingDeadlinesList.map((d) => {
      const dueDate = new Date(d.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: string;
      if (daysRemaining < 0) status = 'overdue';
      else if (daysRemaining <= 7) status = 'urgent';
      else if (daysRemaining <= 30) status = 'expiring_soon';
      else status = 'on_track';

      return {
        id: d.id,
        deadlineTypeName: d.deadlineTypeName,
        employeeName: d.employeeFirstName
          ? `${d.employeeFirstName} ${d.employeeLastName}`
          : null,
        companyName: d.companyName,
        companyId: d.companyId,
        category: d.deadlineTypeCategory,
        dueDate: dueDate.toISOString().split('T')[0],
        daysRemaining,
        status,
      };
    });

    const recentActivity = recentActivityList.map((a) => ({
      action: a.action,
      entityType: a.entityType,
      entityId: a.entityId,
      details: a.details,
      createdAt: a.createdAt.toISOString(),
    }));

    return Response.json({
      data: {
        urgentDeadlines,
        expiringDeadlines,
        totalCompanies,
        totalEmployees,
        complianceRate,
        upcomingDeadlines,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard/stats]', error);
    return serverErrorResponse();
  }
}
