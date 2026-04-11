/**
 * POST /api/auth/post-register
 *
 * Called by the register page immediately after a successful Better Auth sign-up.
 * Sends the welcome email to the newly created user.
 *
 * Body: { email: string; firstName: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/services/email-service';
import { z } from 'zod';

const bodySchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
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

  const { email, firstName } = parsed.data;

  // Fire-and-forget — don't block the response if email fails
  sendWelcomeEmail(email, firstName).catch((err) => {
    console.error('[post-register] sendWelcomeEmail error:', err);
  });

  return NextResponse.json({ data: { ok: true } }, { status: 200 });
}
