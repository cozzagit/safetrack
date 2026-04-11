import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { db } from '@/lib/db';
import {
  companies,
  employees,
  deadlines,
  deadlineTypes,
  users,
  verifications,
} from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-auth';

// ─── GET /api/companies/:id/inspection-kit ──────────────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id: companyId } = await params;

  try {
    // Fetch company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) return notFoundResponse('Azienda');
    if (company.userId !== user.id) return forbiddenResponse();

    // Fetch RSPP (the authenticated user)
    const [rspp] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // Fetch active employees
    const companyEmployees = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.companyId, companyId),
          eq(employees.isActive, true)
        )
      );

    // Fetch all deadlines with type info
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
        legalReference: deadlineTypes.legalReference,
        sanctionInfo: deadlineTypes.sanctionInfo,
        periodicityMonths: deadlineTypes.defaultPeriodicityMonths,
      })
      .from(deadlines)
      .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
      .where(eq(deadlines.companyId, companyId));

    const now = new Date();

    // Compute status
    function computeStatus(d: (typeof companyDeadlines)[number]): string {
      if (d.status === 'completed') return 'valid';
      if (d.status === 'not_applicable') return 'not_applicable';
      const due = new Date(d.dueDate);
      const diffDays = Math.ceil(
        (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 0) return 'overdue';
      if (diffDays <= 30) return 'expiring';
      return 'valid';
    }

    // Summary
    let totalCompleted = 0;
    let totalOverdue = 0;
    let totalDeadlines = 0;

    const deadlinesWithStatus = companyDeadlines.map((d) => {
      const computed = computeStatus(d);
      if (computed !== 'not_applicable') {
        totalDeadlines++;
        if (computed === 'valid' && d.status === 'completed') totalCompleted++;
        if (computed === 'overdue') totalOverdue++;
      }
      return { ...d, computedStatus: computed };
    });

    const complianceRate =
      totalDeadlines > 0
        ? Math.round((totalCompleted / totalDeadlines) * 1000) / 10
        : 100;

    // Build employee data
    function getSpecialRoles(emp: (typeof companyEmployees)[number]): string[] {
      const roles: string[] = [];
      if (emp.isPreposto) roles.push('Preposto');
      if (emp.isDirigente) roles.push('Dirigente');
      if (emp.isRls) roles.push('RLS');
      if (emp.isAddettoAntincendio) roles.push('Addetto Antincendio');
      if (emp.isAddettoPrimoSoccorso) roles.push('Addetto Primo Soccorso');
      return roles;
    }

    const employeeData = companyEmployees.map((emp) => {
      const empDeadlines = deadlinesWithStatus.filter(
        (d) => d.employeeId === emp.id
      );

      // Build trainings grouped by type
      const trainingMap = new Map<
        number,
        {
          type: string;
          completedDate: string | null;
          expiryDate: string | null;
          status: string;
          legalRef: string | null;
          category: string;
        }
      >();

      for (const d of empDeadlines) {
        if (d.computedStatus === 'not_applicable') continue;
        const existing = trainingMap.get(d.deadlineTypeId);
        const entry = {
          type: d.typeName,
          completedDate: d.completedDate
            ? new Date(d.completedDate).toISOString().split('T')[0]
            : null,
          expiryDate: new Date(d.dueDate).toISOString().split('T')[0],
          status: d.computedStatus,
          legalRef: d.legalReference ?? null,
          category: d.category,
        };

        // Keep the most recent entry per type
        if (
          !existing ||
          (entry.completedDate && (!existing.completedDate || entry.completedDate > existing.completedDate))
        ) {
          trainingMap.set(d.deadlineTypeId, entry);
        }
      }

      // Medical surveillance
      const medDeadlines = empDeadlines.filter(
        (d) => d.category === 'sorveglianza_sanitaria'
      );
      const lastMedCompleted = medDeadlines
        .filter((d) => d.status === 'completed' && d.completedDate)
        .sort(
          (a, b) =>
            new Date(b.completedDate!).getTime() -
            new Date(a.completedDate!).getTime()
        )[0];
      const nextMedPending = medDeadlines
        .filter((d) => d.status !== 'completed')
        .sort(
          (a, b) =>
            new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        )[0];

      return {
        name: `${emp.firstName} ${emp.lastName}`,
        fiscalCode: emp.fiscalCode ?? null,
        role: emp.role ?? emp.jobTitle ?? null,
        hiringDate: emp.hiringDate
          ? new Date(emp.hiringDate).toISOString().split('T')[0]
          : null,
        specialRoles: getSpecialRoles(emp),
        trainings: Array.from(trainingMap.values()),
        medicalSurveillance: {
          lastVisit: lastMedCompleted?.completedDate
            ? new Date(lastMedCompleted.completedDate)
                .toISOString()
                .split('T')[0]
            : null,
          nextVisit: nextMedPending
            ? new Date(nextMedPending.dueDate).toISOString().split('T')[0]
            : null,
          status: nextMedPending
            ? computeStatus(nextMedPending)
            : lastMedCompleted
              ? 'valid'
              : 'not_applicable',
          protocol: emp.medicalProtocol ?? 'Protocollo base',
        },
      };
    });

    // Company-level documents (deadlines without employeeId)
    const companyDocuments = deadlinesWithStatus
      .filter((d) => !d.employeeId && d.computedStatus !== 'not_applicable')
      .map((d) => ({
        type: d.typeName,
        lastUpdate: d.completedDate
          ? new Date(d.completedDate).toISOString().split('T')[0]
          : null,
        dueDate: new Date(d.dueDate).toISOString().split('T')[0],
        status: d.computedStatus,
        legalRef: d.legalReference ?? null,
      }));

    // Generate share token (32 random bytes -> 64 hex chars)
    const shareToken = randomBytes(32).toString('hex');
    const tokenExpiry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h

    // Store the token in verifications table
    const tokenId = randomBytes(16).toString('hex');
    await db.insert(verifications).values({
      id: tokenId,
      identifier: `inspection-kit:${companyId}`,
      value: shareToken,
      expiresAt: tokenExpiry,
      createdAt: now,
      updatedAt: now,
    });

    return Response.json({
      data: {
        company: {
          name: company.name,
          fiscalCode: company.fiscalCode,
          atecoCode: company.atecoCode,
          riskLevel: company.riskLevel,
          address: company.address,
          city: company.city,
          province: company.province,
          legalRepresentative: company.legalRepresentative,
        },
        rspp: {
          name: rspp?.name || `${rspp?.firstName ?? ''} ${rspp?.lastName ?? ''}`.trim(),
          email: rspp?.email ?? null,
          phone: rspp?.phone ?? null,
          companyName: rspp?.companyName ?? null,
        },
        generatedAt: now.toISOString(),
        summary: {
          totalEmployees: companyEmployees.length,
          complianceRate,
          overdueCount: totalOverdue,
          documentsCount: totalDeadlines,
        },
        employees: employeeData,
        companyDocuments,
        shareToken,
      },
    });
  } catch (error) {
    console.error('[GET /api/companies/:id/inspection-kit]', error);
    return serverErrorResponse(
      'Errore durante la generazione del kit ispezione'
    );
  }
}
