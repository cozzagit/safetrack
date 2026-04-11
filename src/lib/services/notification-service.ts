import webPush from 'web-push';
import { eq, and, ne, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  deadlines,
  deadlineTypes,
  companies,
  employees,
  pushSubscriptions,
  notifications,
  users,
} from '@/lib/db/schema';
import {
  sendDeadlineReminderEmail,
  sendOverdueAlertEmail,
  type DeadlineForEmail,
} from '@/lib/services/email-service';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PendingDeadline {
  deadlineId: string;
  userId: string;
  companyId: string;
  companyName: string;
  employeeId: string | null;
  employeeName: string | null;
  deadlineTypeName: string;
  dueDate: Date;
  daysUntilDue: number;
  notificationsSnoozedUntil: Date | null;
  lastNotifiedAt: Date | null;
}

interface NotificationPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

interface SendResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
}

type UrgencyLevel = '60_days' | '30_days' | '14_days' | '7_days' | 'overdue';

// ─── Configure web-push ──────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:noreply@safetrack.app';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function classifyUrgency(daysUntilDue: number): UrgencyLevel | null {
  if (daysUntilDue < 0) return 'overdue';
  if (daysUntilDue <= 7) return '7_days';
  if (daysUntilDue <= 14) return '14_days';
  if (daysUntilDue <= 30) return '30_days';
  if (daysUntilDue <= 60) return '60_days';
  return null;
}

function shouldSendPush(urgency: UrgencyLevel): boolean {
  // 60 days = email only, no push
  return urgency !== '60_days';
}

function shouldNotifyToday(
  urgency: UrgencyLevel,
  lastNotifiedAt: Date | null
): boolean {
  if (!lastNotifiedAt) return true;

  const now = new Date();
  const hoursSinceLastNotification =
    (now.getTime() - lastNotifiedAt.getTime()) / (1000 * 60 * 60);

  switch (urgency) {
    case 'overdue':
    case '7_days':
      // Daily notifications
      return hoursSinceLastNotification >= 20;
    case '14_days':
      // Every 3 days
      return hoursSinceLastNotification >= 68;
    case '30_days':
      // Weekly
      return hoursSinceLastNotification >= 164;
    case '60_days':
      // Every 2 weeks
      return hoursSinceLastNotification >= 320;
    default:
      return false;
  }
}

function isSnoozed(snoozedUntil: Date | null): boolean {
  if (!snoozedUntil) return false;
  return snoozedUntil > new Date();
}

function formatDateIT(date: Date): string {
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Build notification messages ─────────────────────────────────────────────

function buildNotificationForGroup(
  urgency: UrgencyLevel,
  companyName: string,
  deadlinesInGroup: PendingDeadline[]
): NotificationPayload {
  const count = deadlinesInGroup.length;

  if (count === 1) {
    const dl = deadlinesInGroup[0];
    return buildSingleNotification(urgency, companyName, dl);
  }

  // Batch notification for multiple deadlines in same company
  switch (urgency) {
    case 'overdue':
      return {
        title: `SCADUTO: ${companyName}`,
        body: `${count} scadenze risultano scadute e richiedono intervento immediato.`,
        url: `/scadenze?companyId=${deadlinesInGroup[0].companyId}`,
        tag: `overdue-${deadlinesInGroup[0].companyId}`,
      };
    case '7_days':
      return {
        title: `CRITICO: ${companyName}`,
        body: `${count} scadenze in scadenza entro 7 giorni!`,
        url: `/scadenze?companyId=${deadlinesInGroup[0].companyId}`,
        tag: `critical-${deadlinesInGroup[0].companyId}`,
      };
    case '14_days':
      return {
        title: `URGENTE: ${companyName}`,
        body: `${count} scadenze in arrivo nelle prossime 2 settimane.`,
        url: `/scadenze?companyId=${deadlinesInGroup[0].companyId}`,
        tag: `urgent-${deadlinesInGroup[0].companyId}`,
      };
    case '30_days':
      return {
        title: `${companyName}`,
        body: `${count} scadenze in arrivo nei prossimi 30 giorni.`,
        url: `/scadenze?companyId=${deadlinesInGroup[0].companyId}`,
        tag: `soon-${deadlinesInGroup[0].companyId}`,
      };
    default:
      return {
        title: `${companyName}`,
        body: `${count} scadenze da monitorare nei prossimi 60 giorni.`,
        url: `/scadenze?companyId=${deadlinesInGroup[0].companyId}`,
        tag: `info-${deadlinesInGroup[0].companyId}`,
      };
  }
}

function buildSingleNotification(
  urgency: UrgencyLevel,
  companyName: string,
  dl: PendingDeadline
): NotificationPayload {
  const emp = dl.employeeName ? ` per ${dl.employeeName}` : '';
  const dateStr = formatDateIT(dl.dueDate);

  switch (urgency) {
    case 'overdue':
      return {
        title: `SCADUTO: ${dl.deadlineTypeName}`,
        body: `${dl.deadlineTypeName}${emp} era previsto per il ${dateStr}.`,
        url: `/scadenze?companyId=${dl.companyId}`,
        tag: `overdue-${dl.deadlineId}`,
      };
    case '7_days':
      return {
        title: `CRITICO: ${dl.deadlineTypeName}`,
        body: `${dl.deadlineTypeName}${emp} scade tra ${Math.max(dl.daysUntilDue, 0)} giorni!`,
        url: `/scadenze?companyId=${dl.companyId}`,
        tag: `critical-${dl.deadlineId}`,
      };
    case '14_days':
      return {
        title: `URGENTE: ${dl.deadlineTypeName}`,
        body: `${dl.deadlineTypeName}${emp} scade il ${dateStr}.`,
        url: `/scadenze?companyId=${dl.companyId}`,
        tag: `urgent-${dl.deadlineId}`,
      };
    case '30_days':
      return {
        title: `${companyName}`,
        body: `${dl.deadlineTypeName}${emp} scade il ${dateStr}.`,
        url: `/scadenze?companyId=${dl.companyId}`,
        tag: `soon-${dl.deadlineId}`,
      };
    default:
      return {
        title: `${companyName}`,
        body: `${dl.deadlineTypeName}${emp} scade il ${dateStr}.`,
        url: `/scadenze?companyId=${dl.companyId}`,
        tag: `info-${dl.deadlineId}`,
      };
  }
}

// ─── Send push notification ──────────────────────────────────────────────────

async function sendPushToUser(
  userId: string,
  payload: NotificationPayload
): Promise<{ sent: number; failed: number }> {
  const subs = await db
    .select()
    .from(pushSubscriptions)
    .where(
      and(
        eq(pushSubscriptions.userId, userId),
        eq(pushSubscriptions.isActive, true)
      )
    );

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify(payload),
        { TTL: 86400 } // 24 hours
      );
      sent++;
    } catch (error: unknown) {
      failed++;
      // If subscription is gone (410), deactivate it
      const statusCode =
        error && typeof error === 'object' && 'statusCode' in error
          ? (error as { statusCode: number }).statusCode
          : 0;
      if (statusCode === 410 || statusCode === 404) {
        await db
          .update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.id, sub.id));
      }
      console.error(
        `[Notification] Push failed for sub ${sub.id}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return { sent, failed };
}

// ─── Main processing function ────────────────────────────────────────────────

export async function processAndSendNotifications(): Promise<SendResult> {
  const now = new Date();
  const sixtyDaysFromNow = new Date(now);
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  // Fetch all deadlines that are:
  // - not completed / not_applicable
  // - due within 60 days OR already overdue
  const pendingRows = await db
    .select({
      deadlineId: deadlines.id,
      userId: deadlines.userId,
      companyId: deadlines.companyId,
      employeeId: deadlines.employeeId,
      dueDate: deadlines.dueDate,
      notificationsSnoozedUntil: deadlines.notificationsSnoozedUntil,
      lastNotifiedAt: deadlines.lastNotifiedAt,
      companyName: companies.name,
      deadlineTypeName: deadlineTypes.name,
      employeeFirstName: employees.firstName,
      employeeLastName: employees.lastName,
    })
    .from(deadlines)
    .innerJoin(companies, eq(deadlines.companyId, companies.id))
    .innerJoin(deadlineTypes, eq(deadlines.deadlineTypeId, deadlineTypes.id))
    .leftJoin(employees, eq(deadlines.employeeId, employees.id))
    .where(
      and(
        ne(deadlines.status, 'completed'),
        ne(deadlines.status, 'not_applicable'),
        lte(deadlines.dueDate, sixtyDaysFromNow)
      )
    );

  const result: SendResult = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  // Transform rows into PendingDeadline
  const pendingDeadlines: PendingDeadline[] = pendingRows.map((row) => {
    const dueDate = new Date(row.dueDate);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      deadlineId: row.deadlineId,
      userId: row.userId,
      companyId: row.companyId,
      companyName: row.companyName,
      employeeId: row.employeeId,
      employeeName:
        row.employeeFirstName && row.employeeLastName
          ? `${row.employeeFirstName} ${row.employeeLastName}`
          : null,
      deadlineTypeName: row.deadlineTypeName,
      dueDate,
      daysUntilDue,
      notificationsSnoozedUntil: row.notificationsSnoozedUntil,
      lastNotifiedAt: row.lastNotifiedAt,
    };
  });

  result.processed = pendingDeadlines.length;

  // Group by user, then by company, then by urgency
  const byUser = new Map<string, PendingDeadline[]>();
  for (const dl of pendingDeadlines) {
    const urgency = classifyUrgency(dl.daysUntilDue);
    if (!urgency) {
      result.skipped++;
      continue;
    }

    // Check snooze
    if (isSnoozed(dl.notificationsSnoozedUntil)) {
      result.skipped++;
      continue;
    }

    // Check if should notify today
    if (!shouldNotifyToday(urgency, dl.lastNotifiedAt)) {
      result.skipped++;
      continue;
    }

    if (!byUser.has(dl.userId)) {
      byUser.set(dl.userId, []);
    }
    byUser.get(dl.userId)!.push(dl);
  }

  // Cache user email+name per userId to avoid repeated DB calls
  const userCache = new Map<string, { email: string; firstName: string | null; name: string }>();

  async function getUserInfo(userId: string) {
    if (userCache.has(userId)) return userCache.get(userId)!;
    const rows = await db
      .select({ email: users.email, firstName: users.firstName, name: users.name })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const info = rows[0] ?? { email: '', firstName: null, name: '' };
    userCache.set(userId, info);
    return info;
  }

  // Process per user
  for (const [userId, userDeadlines] of byUser) {
    // Group by company + urgency for batching
    const groupKey = (dl: PendingDeadline) => {
      const urgency = classifyUrgency(dl.daysUntilDue)!;
      return `${dl.companyId}__${urgency}`;
    };

    const groups = new Map<string, PendingDeadline[]>();
    for (const dl of userDeadlines) {
      const key = groupKey(dl);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(dl);
    }

    for (const [key, group] of groups) {
      const urgency = classifyUrgency(group[0].daysUntilDue)!;
      const companyName = group[0].companyName;

      const payload = buildNotificationForGroup(urgency, companyName, group);

      // Determine channels
      const channels: Array<'push' | 'email' | 'in_app'> = ['in_app'];
      if (shouldSendPush(urgency)) {
        channels.push('push');
      }
      // Email for all urgency levels
      channels.push('email');

      // Send push if applicable
      if (channels.includes('push') && VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
        const pushResult = await sendPushToUser(userId, payload);
        result.sent += pushResult.sent;
        result.failed += pushResult.failed;
      }

      // Send email notification
      if (channels.includes('email')) {
        try {
          const userInfo = await getUserInfo(userId);
          if (userInfo.email) {
            const rsppName = userInfo.firstName || userInfo.name || 'RSPP';
            const emailDeadlines: DeadlineForEmail[] = group.map((dl) => ({
              deadlineTypeName: dl.deadlineTypeName,
              companyName: dl.companyName,
              employeeName: dl.employeeName,
              dueDate: dl.dueDate,
              daysUntilDue: dl.daysUntilDue,
            }));

            if (urgency === 'overdue') {
              await sendOverdueAlertEmail(userInfo.email, rsppName, companyName, emailDeadlines);
            } else {
              await sendDeadlineReminderEmail(userInfo.email, rsppName, companyName, emailDeadlines);
            }
          }
        } catch (err) {
          console.error('[Notification] Email send failed:', err instanceof Error ? err.message : err);
        }
      }

      // Record notification in DB (in_app always)
      const notificationType =
        urgency === 'overdue' ? 'deadline_overdue' : 'deadline_expiring';

      try {
        await db.insert(notifications).values({
          userId,
          type: notificationType as 'deadline_expiring' | 'deadline_overdue',
          channel: 'in_app',
          title: payload.title,
          body: payload.body,
          relatedCompanyId: group[0].companyId,
          relatedDeadlineId: group.length === 1 ? group[0].deadlineId : null,
          status: 'sent',
        });
      } catch (err) {
        console.error('[Notification] Failed to insert notification record:', err);
      }

      // Update lastNotifiedAt for all deadlines in this group
      for (const dl of group) {
        try {
          await db
            .update(deadlines)
            .set({ lastNotifiedAt: now })
            .where(eq(deadlines.id, dl.deadlineId));
        } catch (err) {
          console.error(
            `[Notification] Failed to update lastNotifiedAt for ${dl.deadlineId}:`,
            err
          );
        }
      }
    }
  }

  return result;
}
