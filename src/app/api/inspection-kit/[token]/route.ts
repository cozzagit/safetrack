import { NextRequest } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  companies,
  employees,
  deadlines,
  deadlineTypes,
  users,
  verifications,
} from '@/lib/db/schema';

// ─── GET /api/inspection-kit/:token (PUBLIC — no auth) ─────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const now = new Date();

    // Look up token in verifications table
    const [verification] = await db
      .select()
      .from(verifications)
      .where(
        and(
          eq(verifications.value, token),
          gt(verifications.expiresAt, now)
        )
      )
      .limit(1);

    if (!verification) {
      return Response.json(
        { error: { message: 'Link scaduto o non valido. Richiedere un nuovo link.' } },
        { status: 410 }
      );
    }

    // Extract companyId from identifier: "inspection-kit:{companyId}"
    const companyId = verification.identifier.replace('inspection-kit:', '');

    // Fetch company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) {
      return Response.json(
        { error: { message: 'Azienda non trovata' } },
        { status: 404 }
      );
    }

    // Fetch RSPP (company owner)
    const [rspp] = await db
      .select()
      .from(users)
      .where(eq(users.id, company.userId))
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
        typeName: deadlineTypes.name,
        category: deadlineTypes.category,
        legalReference: deadlineTypes.legalReference,
        sanctionInfo: deadlineTypes.sanctionInfo,
      })
      .from(deadlines)
      .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
      .where(eq(deadlines.companyId, companyId));

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

        const existing = trainingMap.get(d.deadlineTypeId);
        if (
          !existing ||
          (entry.completedDate &&
            (!existing.completedDate || entry.completedDate > existing.completedDate))
        ) {
          trainingMap.set(d.deadlineTypeId, entry);
        }
      }

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
      },
    });
  } catch (error) {
    console.error('[GET /api/inspection-kit/:token]', error);
    return Response.json(
      { error: { message: 'Errore interno del server' } },
      { status: 500 }
    );
  }
}
