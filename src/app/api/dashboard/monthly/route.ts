import { NextRequest } from 'next/server';
import {
  eq,
  and,
  isNull,
  count,
  sql,
  ne,
  gte,
  lte,
  asc,
} from 'drizzle-orm';
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
} from '@/lib/api-auth';

// ─── GET /api/dashboard/monthly ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthNames = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
    ];
    const monthLabel = `${monthNames[now.getMonth()]} ${now.getFullYear()}`;

    // ─── This month's deadlines by category ─────────────────────────
    const thisMonthByCategory = await db
      .select({
        category: deadlineTypes.category,
        count: count(deadlines.id),
      })
      .from(deadlines)
      .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
      .where(
        and(
          eq(deadlines.userId, user.id),
          gte(deadlines.dueDate, monthStart),
          lte(deadlines.dueDate, monthEnd),
          ne(deadlines.status, 'completed'),
          ne(deadlines.status, 'not_applicable')
        )
      )
      .groupBy(deadlineTypes.category);

    // ─── This month's deadlines by company ──────────────────────────
    const thisMonthByCompany = await db
      .select({
        companyId: companies.id,
        companyName: companies.name,
        count: count(deadlines.id),
      })
      .from(deadlines)
      .innerJoin(companies, eq(deadlines.companyId, companies.id))
      .where(
        and(
          eq(deadlines.userId, user.id),
          gte(deadlines.dueDate, monthStart),
          lte(deadlines.dueDate, monthEnd),
          ne(deadlines.status, 'completed'),
          ne(deadlines.status, 'not_applicable')
        )
      )
      .groupBy(companies.id, companies.name)
      .orderBy(sql`count(${deadlines.id}) DESC`);

    const thisMonthTotal = thisMonthByCategory.reduce(
      (sum, c) => sum + Number(c.count),
      0
    );

    const byCategory: Record<string, number> = {};
    for (const row of thisMonthByCategory) {
      byCategory[row.category] = Number(row.count);
    }

    // ─── Company health scores ──────────────────────────────────────
    const userCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
      })
      .from(companies)
      .where(
        and(
          eq(companies.userId, user.id),
          eq(companies.isActive, true),
          isNull(companies.deletedAt)
        )
      )
      .orderBy(asc(companies.name));

    // For each company, compute health score
    const companyHealthScores = [];
    const criticalCompanies = [];

    for (const company of userCompanies) {
      // Total deadlines (not NA)
      const [totalResult] = await db
        .select({ count: count(deadlines.id) })
        .from(deadlines)
        .where(
          and(
            eq(deadlines.companyId, company.id),
            ne(deadlines.status, 'not_applicable')
          )
        );

      // Completed deadlines
      const [completedResult] = await db
        .select({ count: count(deadlines.id) })
        .from(deadlines)
        .where(
          and(
            eq(deadlines.companyId, company.id),
            eq(deadlines.status, 'completed')
          )
        );

      // Overdue deadlines — split by critical types
      const overdueList = await db
        .select({
          category: deadlineTypes.category,
          count: count(deadlines.id),
        })
        .from(deadlines)
        .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
        .where(
          and(
            eq(deadlines.companyId, company.id),
            eq(deadlines.status, 'overdue')
          )
        )
        .groupBy(deadlineTypes.category);

      // Expiring soon
      const [expiringResult] = await db
        .select({ count: count(deadlines.id) })
        .from(deadlines)
        .where(
          and(
            eq(deadlines.companyId, company.id),
            eq(deadlines.status, 'expiring_soon')
          )
        );

      const total = Number(totalResult?.count ?? 0);
      const completed = Number(completedResult?.count ?? 0);
      const expiringCount = Number(expiringResult?.count ?? 0);

      let overdueCritical = 0;
      let overdueOther = 0;
      let overdueCount = 0;
      for (const row of overdueList) {
        const c = Number(row.count);
        overdueCount += c;
        // formazione and sorveglianza_sanitaria are "critical" categories
        if (
          row.category === 'formazione' ||
          row.category === 'sorveglianza_sanitaria'
        ) {
          overdueCritical += c;
        } else {
          overdueOther += c;
        }
      }

      // Health score calculation
      let score =
        total > 0 ? Math.round((completed / total) * 100) : 100;
      score -= overdueCritical * 10;
      score -= overdueOther * 5;
      score = Math.max(0, Math.min(100, score));

      companyHealthScores.push({
        id: company.id,
        name: company.name,
        score,
        overdueCount,
        expiringCount,
      });

      if (overdueCount > 0 || score < 60) {
        criticalCompanies.push({
          id: company.id,
          name: company.name,
          overdueCount,
          expiringCount,
          healthScore: score,
        });
      }
    }

    // Sort critical companies by health score ascending (worst first)
    criticalCompanies.sort((a, b) => a.healthScore - b.healthScore);
    // Sort all companies by score ascending for the health view
    companyHealthScores.sort((a, b) => a.score - b.score);

    // ─── Training opportunities (group similar deadlines) ───────────
    // Find deadline types that are due within the next 3 months for multiple companies
    const threeMonthsFromNow = new Date(now);
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const trainingGrouped = await db
      .select({
        deadlineTypeName: deadlineTypes.name,
        deadlineTypeId: deadlineTypes.id,
        companyName: companies.name,
        employeeCount: count(deadlines.id),
      })
      .from(deadlines)
      .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
      .innerJoin(companies, eq(deadlines.companyId, companies.id))
      .where(
        and(
          eq(deadlines.userId, user.id),
          gte(deadlines.dueDate, now),
          lte(deadlines.dueDate, threeMonthsFromNow),
          ne(deadlines.status, 'completed'),
          ne(deadlines.status, 'not_applicable'),
          eq(deadlineTypes.category, 'formazione')
        )
      )
      .groupBy(deadlineTypes.id, deadlineTypes.name, companies.name)
      .orderBy(sql`count(${deadlines.id}) DESC`);

    // Aggregate by deadline type
    const opportunityMap = new Map<
      number,
      {
        type: string;
        employeeCount: number;
        companies: Set<string>;
      }
    >();

    for (const row of trainingGrouped) {
      const existing = opportunityMap.get(row.deadlineTypeId);
      if (existing) {
        existing.employeeCount += Number(row.employeeCount);
        existing.companies.add(row.companyName);
      } else {
        opportunityMap.set(row.deadlineTypeId, {
          type: row.deadlineTypeName,
          employeeCount: Number(row.employeeCount),
          companies: new Set([row.companyName]),
        });
      }
    }

    const trainingOpportunities = Array.from(opportunityMap.values())
      .filter((o) => o.companies.size > 1 || o.employeeCount >= 3)
      .map((o) => ({
        type: o.type,
        employeeCount: o.employeeCount,
        companies: Array.from(o.companies),
      }))
      .sort((a, b) => b.employeeCount - a.employeeCount)
      .slice(0, 5);

    return Response.json({
      data: {
        month: monthLabel,
        criticalCompanies: criticalCompanies.slice(0, 10),
        thisMonthDeadlines: {
          total: thisMonthTotal,
          byCategory,
          byCompany: thisMonthByCompany.map((r) => ({
            companyId: r.companyId,
            companyName: r.companyName,
            count: Number(r.count),
          })),
        },
        trainingOpportunities,
        companyHealthScores: companyHealthScores.map((c) => ({
          id: c.id,
          name: c.name,
          score: c.score,
        })),
      },
    });
  } catch (error) {
    console.error('[GET /api/dashboard/monthly]', error);
    return serverErrorResponse();
  }
}
