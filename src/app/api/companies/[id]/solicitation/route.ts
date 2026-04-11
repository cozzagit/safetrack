import { NextRequest } from 'next/server';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  companies,
  employees,
  deadlines,
  deadlineTypes,
  users,
  activityLog,
} from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
} from '@/lib/api-auth';
import { sendSolicitationEmail } from '@/lib/services/email-service';

// ─── POST /api/companies/:id/solicitation ───────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id: companyId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const { deadlineIds, sendEmail } = body as {
      deadlineIds?: string[];
      sendEmail?: boolean;
    };

    // Fetch company
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) return notFoundResponse('Azienda');
    if (company.userId !== user.id) return forbiddenResponse();

    // Fetch RSPP
    const [rspp] = await db
      .select()
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    // Fetch overdue deadlines
    const now = new Date();
    let overdueDeadlines;

    if (deadlineIds && deadlineIds.length > 0) {
      overdueDeadlines = await db
        .select({
          id: deadlines.id,
          employeeId: deadlines.employeeId,
          dueDate: deadlines.dueDate,
          status: deadlines.status,
          typeName: deadlineTypes.name,
          category: deadlineTypes.category,
          legalReference: deadlineTypes.legalReference,
          sanctionInfo: deadlineTypes.sanctionInfo,
        })
        .from(deadlines)
        .innerJoin(
          deadlineTypes,
          eq(deadlines.deadlineTypeId, deadlineTypes.id)
        )
        .where(
          and(
            eq(deadlines.companyId, companyId),
            inArray(deadlines.id, deadlineIds)
          )
        );
    } else {
      // Get ALL overdue deadlines for this company
      overdueDeadlines = await db
        .select({
          id: deadlines.id,
          employeeId: deadlines.employeeId,
          dueDate: deadlines.dueDate,
          status: deadlines.status,
          typeName: deadlineTypes.name,
          category: deadlineTypes.category,
          legalReference: deadlineTypes.legalReference,
          sanctionInfo: deadlineTypes.sanctionInfo,
        })
        .from(deadlines)
        .innerJoin(
          deadlineTypes,
          eq(deadlines.deadlineTypeId, deadlineTypes.id)
        )
        .where(
          and(
            eq(deadlines.companyId, companyId),
            eq(deadlines.status, 'overdue')
          )
        );

      // Also include pending deadlines that are past due date
      const pendingDeadlines = await db
        .select({
          id: deadlines.id,
          employeeId: deadlines.employeeId,
          dueDate: deadlines.dueDate,
          status: deadlines.status,
          typeName: deadlineTypes.name,
          category: deadlineTypes.category,
          legalReference: deadlineTypes.legalReference,
          sanctionInfo: deadlineTypes.sanctionInfo,
        })
        .from(deadlines)
        .innerJoin(
          deadlineTypes,
          eq(deadlines.deadlineTypeId, deadlineTypes.id)
        )
        .where(
          and(
            eq(deadlines.companyId, companyId),
            eq(deadlines.status, 'pending')
          )
        );

      const pastDuePending = pendingDeadlines.filter(
        (d) => new Date(d.dueDate) < now
      );
      overdueDeadlines = [...overdueDeadlines, ...pastDuePending];
    }

    if (overdueDeadlines.length === 0) {
      return Response.json(
        { error: { message: 'Nessuna scadenza da sollecitare' } },
        { status: 400 }
      );
    }

    // Fetch employees for these deadlines
    const employeeIds = [
      ...new Set(
        overdueDeadlines
          .filter((d) => d.employeeId)
          .map((d) => d.employeeId!)
      ),
    ];

    let employeeMap = new Map<
      string,
      { firstName: string; lastName: string; role: string | null; jobTitle: string | null }
    >();

    if (employeeIds.length > 0) {
      const emps = await db
        .select({
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          role: employees.role,
          jobTitle: employees.jobTitle,
        })
        .from(employees)
        .where(inArray(employees.id, employeeIds));

      employeeMap = new Map(emps.map((e) => [e.id, e]));
    }

    // Group deadlines by employee
    const byEmployee = new Map<
      string | null,
      (typeof overdueDeadlines)[number][]
    >();
    for (const d of overdueDeadlines) {
      const key = d.employeeId ?? '__company__';
      if (!byEmployee.has(key)) byEmployee.set(key, []);
      byEmployee.get(key)!.push(d);
    }

    // Generate letter content
    const rsppName =
      rspp?.name ||
      `${rspp?.firstName ?? ''} ${rspp?.lastName ?? ''}`.trim() ||
      'RSPP';
    const rsppCompany = rspp?.companyName ?? '';
    const dateStr = now.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    let letterBody = '';

    // Letter header
    letterBody += `Oggetto: SOLLECITO ADEMPIMENTI SICUREZZA SUL LAVORO — Art. 18 D.Lgs. 81/08\n\n`;
    letterBody += `Spett.le ${company.name}\n`;
    letterBody += `Alla c.a. del Datore di Lavoro ${company.legalRepresentative ?? '(Legale Rappresentante)'}\n\n`;
    letterBody += `Con la presente, in qualità di Responsabile del Servizio di Prevenzione e Protezione (RSPP) esterno della Vs. azienda, sono a segnalare i seguenti adempimenti in materia di sicurezza sul lavoro attualmente SCADUTI o NON ADEMPIUTI:\n\n`;

    // Deadlines grouped by employee
    for (const [empId, empDeadlines] of byEmployee) {
      if (empId === '__company__') {
        letterBody += `ADEMPIMENTI AZIENDALI:\n`;
      } else {
        const emp = employeeMap.get(empId!);
        const empName = emp
          ? `${emp.firstName} ${emp.lastName}`
          : 'Dipendente';
        const empRole = emp?.role ?? emp?.jobTitle ?? '';
        letterBody += `DIPENDENTE: ${empName}${empRole ? ` — Mansione: ${empRole}` : ''}\n`;
      }

      for (const d of empDeadlines) {
        const dueDate = new Date(d.dueDate).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        const legalRef = d.legalReference
          ? ` (Rif. ${d.legalReference})`
          : '';
        const sanction = d.sanctionInfo
          ? `\n  Sanzione prevista: ${d.sanctionInfo}`
          : '';
        letterBody += `- ${d.typeName}${legalRef}: scadenza prevista il ${dueDate}, ad oggi non risulta adempiuto.${sanction}\n`;
      }
      letterBody += '\n';
    }

    // Letter footer
    letterBody += `Si ricorda che ai sensi dell'art. 18, comma 1, del D.Lgs. 81/08, il Datore di Lavoro è tenuto a provvedere a tutti gli adempimenti sopra elencati. L'inadempimento comporta le sanzioni penali e amministrative previste dal medesimo decreto.\n\n`;
    letterBody += `Si invita pertanto a provvedere con URGENZA alla regolarizzazione delle posizioni sopra indicate.\n\n`;
    letterBody += `La presente vale quale formale messa in mora ai sensi e per gli effetti di legge.\n\n`;
    letterBody += `Distinti saluti,\n`;
    letterBody += `${rsppName}\n`;
    letterBody += `RSPP esterno${rsppCompany ? ` — ${rsppCompany}` : ''}\n`;
    letterBody += `Data: ${dateStr}\n`;

    // Send email if requested
    let emailSent = false;
    if (sendEmail && company.contactEmail) {
      emailSent = await sendSolicitationEmail(
        company.contactEmail,
        company.name,
        company.legalRepresentative ?? 'Datore di Lavoro',
        rsppName,
        rsppCompany,
        letterBody,
        overdueDeadlines.length
      );
    }

    // Log activity
    await db.insert(activityLog).values({
      userId: user.id,
      action: 'export',
      entityType: 'company',
      entityId: companyId,
      details: {
        type: 'solicitation',
        deadlineCount: overdueDeadlines.length,
        deadlineIds: overdueDeadlines.map((d) => d.id),
        emailSent,
        emailTo: sendEmail ? company.contactEmail : null,
        generatedAt: now.toISOString(),
        letterPreview: letterBody.substring(0, 500),
      },
    });

    return Response.json({
      data: {
        letterContent: letterBody,
        deadlineCount: overdueDeadlines.length,
        emailSent,
        emailTo: sendEmail ? company.contactEmail : null,
        generatedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('[POST /api/companies/:id/solicitation]', error);
    return serverErrorResponse(
      'Errore durante la generazione del sollecito'
    );
  }
}

// ─── GET /api/companies/:id/solicitation — history ──────────────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id: companyId } = await params;

  try {
    // Verify ownership
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (!company) return notFoundResponse('Azienda');
    if (company.userId !== user.id) return forbiddenResponse();

    // Fetch solicitation history from activity log
    const history = await db
      .select()
      .from(activityLog)
      .where(
        and(
          eq(activityLog.userId, user.id),
          eq(activityLog.entityType, 'company'),
          eq(activityLog.entityId, companyId),
          eq(activityLog.action, 'export')
        )
      )
      .orderBy(activityLog.createdAt);

    // Filter only solicitation entries
    const solicitations = history
      .filter(
        (h) =>
          h.details &&
          typeof h.details === 'object' &&
          (h.details as Record<string, unknown>).type === 'solicitation'
      )
      .map((h) => {
        const details = h.details as Record<string, unknown>;
        return {
          id: h.id,
          createdAt: h.createdAt.toISOString(),
          deadlineCount: details.deadlineCount as number,
          emailSent: details.emailSent as boolean,
          emailTo: details.emailTo as string | null,
        };
      })
      .reverse(); // Most recent first

    return Response.json({ data: solicitations });
  } catch (error) {
    console.error('[GET /api/companies/:id/solicitation]', error);
    return serverErrorResponse(
      'Errore durante il recupero dello storico solleciti'
    );
  }
}
