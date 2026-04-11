/**
 * POST /api/auth/post-register
 *
 * Called by the register page immediately after a successful Better Auth sign-up.
 * Saves extra profile fields (firstName, lastName, companyName, phone) to the DB
 * and sends the welcome email.
 *
 * Body: { email, firstName, lastName, companyName, phone }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/services/email-service';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const bodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  phone: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'INVALID_JSON', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'email and firstName are required' } },
      { status: 400 }
    );
  }

  const { email, firstName, lastName, companyName, phone } = parsed.data;

  // Update user profile with extra fields
  try {
    await db
      .update(users)
      .set({
        firstName: firstName,
        lastName: lastName || null,
        companyName: companyName || null,
        phone: phone || null,
      })
      .where(eq(users.email, email));
  } catch (err) {
    console.error('[post-register] DB update error:', err);
  }

  // Send welcome email (fire and forget)
  sendWelcomeEmail(email, firstName).catch((err) => {
    console.error('[post-register] sendWelcomeEmail error:', err);
  });

  return NextResponse.json({ data: { ok: true } }, { status: 200 });
}
