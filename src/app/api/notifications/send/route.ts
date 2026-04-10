import { NextRequest } from 'next/server';
import { serverErrorResponse } from '@/lib/api-auth';
import { processAndSendNotifications } from '@/lib/services/notification-service';

// ─── POST /api/notifications/send ────────────────────────────────────────────
// Internal endpoint for cron jobs. Secured via API key.

export async function POST(request: NextRequest) {
  // Verify internal API key
  const apiKey = request.headers.get('x-api-key');
  const expectedKey = process.env.INTERNAL_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return Response.json(
      { error: { message: 'Non autorizzato' } },
      { status: 401 }
    );
  }

  try {
    const result = await processAndSendNotifications();

    return Response.json({
      data: {
        processed: result.processed,
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
      },
    });
  } catch (error) {
    console.error('[POST /api/notifications/send]', error);
    return serverErrorResponse('Errore durante l\'invio delle notifiche');
  }
}
