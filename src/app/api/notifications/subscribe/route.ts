import { NextRequest } from 'next/server';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';

// ─── Validation ──────────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  endpoint: z.string().url('Endpoint non valido'),
  keys: z.object({
    p256dh: z.string().min(1, 'Chiave p256dh obbligatoria'),
    auth: z.string().min(1, 'Chiave auth obbligatoria'),
  }),
});

// ─── POST /api/notifications/subscribe ───────────────────────────────────────

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

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  const { endpoint, keys } = parsed.data;

  try {
    // Check for existing subscription with the same endpoint
    const [existing] = await db
      .select({ id: pushSubscriptions.id })
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      )
      .limit(1);

    if (existing) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
          isActive: true,
          userAgent: request.headers.get('user-agent') || null,
        })
        .where(eq(pushSubscriptions.id, existing.id));

      return Response.json({ data: { id: existing.id, updated: true } });
    }

    // Create new subscription
    const [sub] = await db
      .insert(pushSubscriptions)
      .values({
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        userAgent: request.headers.get('user-agent') || null,
      })
      .returning();

    return Response.json({ data: { id: sub.id, created: true } }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/notifications/subscribe]', error);
    return serverErrorResponse('Errore durante la registrazione delle notifiche');
  }
}

// ─── DELETE /api/notifications/subscribe ─────────────────────────────────────

export async function DELETE(request: NextRequest) {
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

  const endpointSchema = z.object({ endpoint: z.string().url() });
  const parsed = endpointSchema.safeParse(body);
  if (!parsed.success) {
    return validationErrorResponse(parsed.error.issues);
  }

  try {
    await db
      .update(pushSubscriptions)
      .set({ isActive: false })
      .where(
        and(
          eq(pushSubscriptions.userId, user.id),
          eq(pushSubscriptions.endpoint, parsed.data.endpoint)
        )
      );

    return Response.json({ data: { unsubscribed: true } });
  } catch (error) {
    console.error('[DELETE /api/notifications/subscribe]', error);
    return serverErrorResponse();
  }
}
