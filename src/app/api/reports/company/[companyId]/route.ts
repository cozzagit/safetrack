import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
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
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-auth';

// ─── GET /api/reports/company/:companyId ────────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { companyId } = await params;

  try {
    // Fetch company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) return notFoundResponse('Azienda');
    if (company.userId !== user.id) return forbiddenResponse();

    // Fetch employees
    const companyEmployees = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(employees.isActive, true)
        )
      );

    // Fetch all deadlines for this company with type info
    const companyDeadlines = await db
      .select({
        id: deadlines.id,
        employeeId: deadlines.employeeId,
        deadlineTypeId: deadlines.deadlineTypeId,
        dueDate: deadlines.dueDate,
        completedDate: deadlines.completedDate,
        status: deadlines.status,
        priority: deadlines.priority,
        typeName: deadlineTypes.name,
        category: deadlineTypes.category,
        periodicityMonths: deadlineTypes.defaultPeriodicityMonths,
      })
      .from(deadlines)
      .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
      .where(eq(deadlines.companyId, companyId));

    const now = new Date();

    // Compute statuses based on actual dates
    function computeStatus(d: typeof companyDeadlines[number]): string {
      if (d.status === 'completed') return 'completed';
      if (d.status === 'not_applicable') return 'not_applicable';
      const due = new Date(d.dueDate);
      const diffDays = Math.ceil(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 0) return 'overdue';
      if (diffDays <= 30) return 'expiring_soon';
      return 'pending';
    }

    // Summary
    let totalCompleted = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    const deadlinesWithStatus = companyDeadlines.map((d) => {
      const computed = computeStatus(d);
      if (computed === 'completed') totalCompleted++;
      else if (computed === 'overdue') totalOverdue++;
      else if (computed !== 'not_applicable') totalPending++;
      return { ...d, computedStatus: computed };
    });

    const totalDeadlines = totalCompleted + totalPending + totalOverdue;
    const complianceRate =
      totalDeadlines > 0
        ? Math.round((totalCompleted / totalDeadlines) * 1000) / 10
        : 100;

    // By category
    const byCategory: Record<
      string,
      { total: number; completed: number; overdue: number; rate: number }
    > = {};

    for (const d of deadlinesWithStatus) {
      if (d.computedStatus === 'not_applicable') continue;
      const cat = d.category;
      if (!byCategory[cat]) {
        byCategory[cat] = { total: 0, completed: 0, overdue: 0, rate: 0 };
      }
      byCategory[cat].total++;
      if (d.computedStatus === 'completed') byCategory[cat].completed++;
      if (d.computedStatus === 'overdue') byCategory[cat].overdue++;
    }

    for (const cat of Object.keys(byCategory)) {
      const c = byCategory[cat];
      c.rate = c.total > 0 ? Math.round((c.completed / c.total) * 1000) / 10 : 100;
    }

    // Per-employee breakdown
    function getRoles(emp: typeof companyEmployees[number]): string[] {
      const roles: string[] = [];
      if (emp.isPreposto) roles.push('Preposto');
      if (emp.isDirigente) roles.push('Dirigente');
      if (emp.isRls) roles.push('RLS');
      if (emp.isAddettoAntincendio) roles.push('Addetto Antincendio');
      if (emp.isAddettoPrimoSoccorso) roles.push('Addetto Primo Soccorso');
      return roles;
    }

    const employeeReports = companyEmployees.map((emp) => {
      const empDeadlines = deadlinesWithStatus.filter(
        (d) => d.employeeId === emp.id
      );

      const empTotal = empDeadlines.filter(
        (d) => d.computedStatus !== 'not_applicable'
      ).length;
      const empCompleted = empDeadlines.filter(
        (d) => d.computedStatus === 'completed'
      ).length;

      const empComplianceRate =
        empTotal > 0
          ? Math.round((empCompleted / empTotal) * 1000) / 10
          : 100;

      // Find last completed date for each type
      const lastCompletedByType = new Map<number, string>();
      for (const d of empDeadlines) {
        if (d.computedStatus === 'completed' && d.completedDate) {
          const existing = lastCompletedByType.get(d.deadlineTypeId);
          const completedStr = new Date(d.completedDate)
            .toISOString()
            .split('T')[0];
          if (!existing || completedStr > existing) {
            lastCompletedByType.set(d.deadlineTypeId, completedStr);
          }
        }
      }

      const deadlineDetails = empDeadlines
        .filter((d) => d.computedStatus !== 'not_applicable')
        .map((d) => {
          const due = new Date(d.dueDate);
          const daysRemaining = Math.ceil(
            (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          return {
            type: d.typeName,
            category: d.category,
            dueDate: due.toISOString().split('T')[0],
            status: d.computedStatus,
            daysRemaining,
            lastCompleted: lastCompletedByType.get(d.deadlineTypeId) ?? null,
          };
        });

      return {
        name: `${emp.firstName} ${emp.lastName}`,
        role: emp.role ?? emp.jobTitle ?? null,
        roles: getRoles(emp),
        deadlines: deadlineDetails,
        complianceRate: empComplianceRate,
      };
    });

    // Company-level deadlines (no employee)
    const companyLevelDeadlines = deadlinesWithStatus.filter(
      (d) => !d.employeeId && d.computedStatus !== 'not_applicable'
    );

    if (companyLevelDeadlines.length > 0) {
      const clTotal = companyLevelDeadlines.length;
      const clCompleted = companyLevelDeadlines.filter(
        (d) => d.computedStatus === 'completed'
      ).length;

      employeeReports.unshift({
        name: 'Azienda (scadenze generali)',
        role: null,
        roles: [],
        deadlines: companyLevelDeadlines.map((d) => {
          const due = new Date(d.dueDate);
          const daysRemaining = Math.ceil(
            (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );
          return {
            type: d.typeName,
            category: d.category,
            dueDate: due.toISOString().split('T')[0],
            status: d.computedStatus,
            daysRemaining,
            lastCompleted: null,
          };
        }),
        complianceRate:
          clTotal > 0
            ? Math.round((clCompleted / clTotal) * 1000) / 10
            : 100,
      });
    }

    return Response.json({
      data: {
        company: {
          name: company.name,
          atecoCode: company.atecoCode,
          riskLevel: company.riskLevel,
          address: [company.address, company.city, company.province, company.cap]
            .filter(Boolean)
            .join(', '),
          legalRepresentative: company.legalRepresentative,
        },
        generatedAt: now.toISOString(),
        summary: {
          totalEmployees: companyEmployees.length,
          totalDeadlines,
          completed: totalCompleted,
          pending: totalPending,
          overdue: totalOverdue,
          complianceRate,
        },
        employees: employeeReports,
        byCategory,
      },
    });
  } catch (error) {
    console.error('[GET /api/reports/company/:companyId]', error);
    return serverErrorResponse('Errore durante la generazione del report');
  }
}
