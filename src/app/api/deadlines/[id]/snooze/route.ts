import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { deadlines } from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

const snoozeSchema = z.object({
  snoozedUntil: z.string(), // ISO date string — required
});

// ─── POST /api/deadlines/:id/snooze ─────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id } = await params;

  // Fetch deadline to verify ownership
  const [deadline] = await db
    .select({ id: deadlines.id, userId: deadlines.userId })
    .from(deadlines)
    .where(eq(deadlines.id, id))
    .limit(1);

  if (!deadline) return notFoundResponse('Scadenza');
  if (deadline.userId !== user.id) return forbiddenResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: { message: 'Body JSON non valido' } },
      { status: 400 }
    );
  }

  const parsed = snoozeSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    const [updated] = await db
      .update(deadlines)
      .set({
        notificationsSnoozedUntil: new Date(parsed.data.snoozedUntil),
        updatedAt: new Date(),
      })
      .where(and(eq(deadlines.id, id), eq(deadlines.userId, user.id)))
      .returning();

    return Response.json({ data: updated });
  } catch (error) {
    console.error('[POST /api/deadlines/:id/snooze]', error);
    return serverErrorResponse('Errore durante lo snooze della scadenza');
  }
}
