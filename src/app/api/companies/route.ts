import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, isNull, and, asc, count, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { companies, deadlines } from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

// ─── ATECO risk mapping ───────────────────────────────────────────────────────

function deriveRiskLevel(atecoCode: string): 'alto' | 'medio' | 'basso' {
  const first = atecoCode.trim()[0]?.toUpperCase();
  if (['A', 'B', 'C', 'F'].includes(first)) return 'alto';
  if (['D', 'E', 'G', 'H', 'I'].includes(first)) return 'medio';
  return 'basso';
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const createCompanySchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio').max(255),
  fiscalCode: z.string().max(16).optional(),
  atecoCode: z
    .string()
    .max(20)
    .regex(/^[A-Z]\d/, { message: 'Codice ATECO non valido (es. C28.15)' })
    .optional()
    .or(z.literal('')),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(5).optional(),
  cap: z.string().max(5).optional(),
  legalRepresentative: z.string().max(255).optional(),
  contactEmail: z.string().email('Email non valida').optional().or(z.literal('')),
  contactPhone: z.string().max(30).optional(),
  notes: z.string().optional(),
});

// ─── GET /api/companies ───────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const now = new Date();
    const soonThreshold = new Date(now);
    soonThreshold.setDate(soonThreshold.getDate() + 30);

    // Fetch all active companies for this user
    const companiesList = await db
      .select()
      .from(companies)
      .where(and(eq(companies.userId, user.id), isNull(companies.deletedAt)))
      .orderBy(asc(companies.name));

    if (companiesList.length === 0) {
      return Response.json({ data: [] });
    }

    // Fetch deadline stats per company in a single query
    const deadlineStats = await db
      .select({
        companyId: deadlines.companyId,
        total: count(deadlines.id),
        overdue: sql<number>`COUNT(*) FILTER (WHERE ${deadlines.status} = 'overdue')`,
        expiringSoon: sql<number>`COUNT(*) FILTER (WHERE ${deadlines.status} = 'expiring_soon')`,
      })
      .from(deadlines)
      .where(eq(deadlines.userId, user.id))
      .groupBy(deadlines.companyId);

    const statsMap = new Map(
      deadlineStats.map((s) => [
        s.companyId,
        {
          total: Number(s.total),
          overdue: Number(s.overdue),
          expiringSoon: Number(s.expiringSoon),
        },
      ])
    );

    const result = companiesList.map((company) => ({
      ...company,
      deadlineStats: statsMap.get(company.id) ?? {
        total: 0,
        overdue: 0,
        expiringSoon: 0,
      },
    }));

    return Response.json({ data: result });
  } catch (error) {
    console.error('[GET /api/companies]', error);
    return serverErrorResponse();
  }
}

// ─── POST /api/companies ──────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { message: 'Body JSON non valido' } },
      { status: 400 }
    );
  }

  const parsed = createCompanySchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const data = parsed.data;
  const riskLevel = data.atecoCode ? deriveRiskLevel(data.atecoCode) : 'basso';

  try {
    const [created] = await db
      .insert(companies)
      .values({
        userId: user.id,
        name: data.name,
        fiscalCode: data.fiscalCode || null,
        atecoCode: data.atecoCode || null,
        address: data.address || null,
        city: data.city || null,
        province: data.province || null,
        cap: data.cap || null,
        legalRepresentative: data.legalRepresentative || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
        notes: data.notes || null,
        riskLevel,
      })
      .returning();

    return Response.json({ data: created }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/companies]', error);
    return serverErrorResponse('Errore durante la creazione dell\'azienda');
  }
}
