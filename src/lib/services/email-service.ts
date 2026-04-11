/**
 * Email service for SafeTrack — transactional emails via Aruba SMTP.
 *
 * Uses info@vibecanyon.com as the sending address (shared Aruba account).
 * If SMTP_HOST is not configured, emails are logged and skipped (no crash).
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// ─── Configuration ────────────────────────────────────────────────────────────

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? '465', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? 'SafeTrack <info@vibecanyon.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn('[SafeTrack Email] SMTP non configurato — le email non verranno inviate');
    return null;
  }
  _transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true, // SSL
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
  return _transporter;
}

// ─── Base HTML layout ─────────────────────────────────────────────────────────

function emailLayout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background-color:#1e3a5f;border-radius:12px 12px 0 0;padding:28px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.025em;">
                      Safe<span style="color:#34d399;">Track</span>
                    </span>
                    <br />
                    <span style="font-size:12px;color:#93c5fd;letter-spacing:0.05em;">
                      GESTIONE SCADENZE SICUREZZA
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:32px 32px 24px 32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-radius:0 0 12px 12px;border-top:1px solid #e2e8f0;padding:20px 32px;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                SafeTrack — Gestione Scadenze Sicurezza sul Lavoro<br />
                Hai ricevuto questa email perché hai un account su SafeTrack.<br />
                <a href="${APP_URL}/impostazioni" style="color:#059669;text-decoration:none;">Gestisci le preferenze email</a>
                &nbsp;·&nbsp;
                <a href="${APP_URL}" style="color:#059669;text-decoration:none;">Apri SafeTrack</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function formatDateIT(date: Date): string {
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function urgencyBadge(daysUntilDue: number): string {
  if (daysUntilDue < 0) {
    return '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background-color:#fee2e2;color:#dc2626;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">SCADUTA</span>';
  }
  if (daysUntilDue <= 7) {
    return '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background-color:#fee2e2;color:#dc2626;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">CRITICO</span>';
  }
  if (daysUntilDue <= 14) {
    return '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background-color:#ffedd5;color:#ea580c;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">URGENTE</span>';
  }
  if (daysUntilDue <= 30) {
    return '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background-color:#fefce8;color:#ca8a04;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">IN SCADENZA</span>';
  }
  return '<span style="display:inline-block;padding:3px 10px;border-radius:999px;background-color:#f0fdf4;color:#16a34a;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">PIANIFICATA</span>';
}

function ctaButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr>
      <td style="border-radius:8px;background-color:#059669;">
        <a href="${href}" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

// ─── Email function types ─────────────────────────────────────────────────────

export interface DeadlineForEmail {
  deadlineTypeName: string;
  companyName: string;
  employeeName?: string | null;
  dueDate: Date;
  daysUntilDue: number;
}

export interface WeeklyStats {
  completed: number;
  upcoming: number; // deadlines due in next 30 days
  overdue: number;
  complianceRate: number; // 0-100
}

// ─── Send helper ──────────────────────────────────────────────────────────────

async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.info(`[SafeTrack Email] Inviata: "${options.subject}" a ${options.to}`);
    return true;
  } catch (error) {
    console.error(
      `[SafeTrack Email] Errore invio a ${options.to}:`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

// ─── A. Welcome email ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName: string): Promise<boolean> {
  const body = `
    <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:#1e3a5f;">
      Benvenuto su SafeTrack, ${firstName}!
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">
      Il tuo account è stato creato con successo. Da oggi hai a disposizione uno strumento
      professionale per gestire tutte le scadenze di sicurezza sul lavoro delle tue aziende clienti.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px 0;font-size:14px;font-weight:600;color:#065f46;">
            Inizia in 3 semplici passi:
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:6px 0;">
                <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background-color:#059669;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:12px;">1</span>
                <span style="font-size:14px;color:#374151;">Aggiungi le tue <strong>aziende clienti</strong></span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background-color:#059669;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:12px;">2</span>
                <span style="font-size:14px;color:#374151;">Inserisci i <strong>dipendenti</strong> e le loro scadenze</span>
              </td>
            </tr>
            <tr>
              <td style="padding:6px 0;">
                <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background-color:#059669;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;margin-right:12px;">3</span>
                <span style="font-size:14px;color:#374151;">Attiva le <strong>notifiche push</strong> per gli avvisi automatici</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px 0;font-size:14px;color:#64748b;line-height:1.6;">
      SafeTrack ti invierà automaticamente promemoria per le scadenze in arrivo: visite mediche,
      formazioni obbligatorie, manutenzioni e molto altro — tutto tracciato, nulla dimenticato.
    </p>

    <div style="text-align:center;margin-bottom:24px;">
      ${ctaButton('Apri la dashboard', `${APP_URL}/dashboard`)}
    </div>

    <p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
      Hai domande? Scrivici a
      <a href="mailto:info@vibecanyon.com" style="color:#059669;text-decoration:none;">info@vibecanyon.com</a>
    </p>
  `;

  return sendEmail({
    to,
    subject: 'Benvenuto su SafeTrack!',
    html: emailLayout('Benvenuto su SafeTrack', body),
  });
}

// ─── B. Deadline reminder email ───────────────────────────────────────────────

export async function sendDeadlineReminderEmail(
  to: string,
  rsppName: string,
  companyName: string,
  deadlines: DeadlineForEmail[]
): Promise<boolean> {
  const count = deadlines.length;
  const deadlineRows = deadlines
    .slice(0, 10) // cap at 10 to keep email readable
    .map((dl) => {
      const emp = dl.employeeName ? ` — ${dl.employeeName}` : '';
      const daysText =
        dl.daysUntilDue <= 0
          ? 'Oggi!'
          : dl.daysUntilDue === 1
            ? 'Domani'
            : `${dl.daysUntilDue} giorni`;
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;">
            <span style="font-size:14px;color:#1e293b;font-weight:500;">${dl.deadlineTypeName}${emp}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap;">
            <span style="font-size:13px;color:#64748b;">${formatDateIT(dl.dueDate)}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap;">
            ${urgencyBadge(dl.daysUntilDue)}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;text-align:right;white-space:nowrap;">
            <span style="font-size:13px;color:#1e3a5f;font-weight:600;">${daysText}</span>
          </td>
        </tr>
      `;
    })
    .join('');

  const moreNote =
    deadlines.length > 10
      ? `<p style="margin:8px 0 0 0;font-size:13px;color:#94a3b8;text-align:right;">
           ... e altre ${deadlines.length - 10} scadenze
         </p>`
      : '';

  const body = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1e3a5f;">
      ${count} scadenz${count === 1 ? 'a' : 'e'} in arrivo
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">
      Ciao ${rsppName}, di seguito le scadenze imminenti per <strong>${companyName}</strong>.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="border:1px solid #e2e8f0;border-radius:8px;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background-color:#f8fafc;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Tipo scadenza</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Data</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Stato</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">Mancano</th>
        </tr>
      </thead>
      <tbody>
        ${deadlineRows}
      </tbody>
    </table>
    ${moreNote}

    <div style="text-align:center;margin-bottom:24px;">
      ${ctaButton('Gestisci le scadenze', `${APP_URL}/scadenze`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `SafeTrack: ${count} scadenz${count === 1 ? 'a' : 'e'} in arrivo per ${companyName}`,
    html: emailLayout('Scadenze in arrivo', body),
  });
}

// ─── C. Overdue alert email ───────────────────────────────────────────────────

export async function sendOverdueAlertEmail(
  to: string,
  rsppName: string,
  companyName: string,
  deadlines: DeadlineForEmail[]
): Promise<boolean> {
  const count = deadlines.length;
  const deadlineRows = deadlines
    .slice(0, 10)
    .map((dl) => {
      const emp = dl.employeeName ? ` — ${dl.employeeName}` : '';
      const daysOverdue = Math.abs(dl.daysUntilDue);
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #fef2f2;">
            <span style="font-size:14px;color:#1e293b;font-weight:500;">${dl.deadlineTypeName}${emp}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #fef2f2;text-align:right;white-space:nowrap;">
            <span style="font-size:13px;color:#64748b;">${formatDateIT(dl.dueDate)}</span>
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #fef2f2;text-align:right;white-space:nowrap;">
            <span style="font-size:13px;color:#dc2626;font-weight:600;">
              Scaduta da ${daysOverdue} giorn${daysOverdue === 1 ? 'o' : 'i'}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  const moreNote =
    deadlines.length > 10
      ? `<p style="margin:8px 0 0 0;font-size:13px;color:#94a3b8;text-align:right;">
           ... e altre ${deadlines.length - 10} scadenze scadute
         </p>`
      : '';

  const body = `
    <!-- Alert banner -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background-color:#fee2e2;border-radius:8px;border:1px solid #fecaca;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#dc2626;">
            &#9888; Attenzione: scadenze non rispettate
          </p>
          <p style="margin:4px 0 0 0;font-size:13px;color:#b91c1c;">
            Le scadenze non rispettate possono comportare sanzioni amministrative e penali.
            Intervieni al più presto.
          </p>
        </td>
      </tr>
    </table>

    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1e3a5f;">
      ${count} scadenz${count === 1 ? 'a' : 'e'} SCADUT${count === 1 ? 'A' : 'E'}
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">
      Ciao ${rsppName}, le seguenti scadenze per <strong>${companyName}</strong>
      non sono state completate nei termini.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="border:1px solid #fecaca;border-radius:8px;border-collapse:collapse;background-color:#fff5f5;margin-bottom:24px;">
      <thead>
        <tr style="background-color:#fee2e2;">
          <th style="padding:10px 12px;text-align:left;font-size:12px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;">Tipo scadenza</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;">Data scadenza</th>
          <th style="padding:10px 12px;text-align:right;font-size:12px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.05em;">Ritardo</th>
        </tr>
      </thead>
      <tbody>
        ${deadlineRows}
      </tbody>
    </table>
    ${moreNote}

    <div style="text-align:center;margin-bottom:24px;">
      ${ctaButton('Intervieni subito', `${APP_URL}/scadenze`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: `⚠️ SafeTrack: ${count} scadenz${count === 1 ? 'a' : 'e'} SCADUT${count === 1 ? 'A' : 'E'} per ${companyName}`,
    html: emailLayout('Scadenze scadute', body),
  });
}

// ─── D. Weekly summary email ──────────────────────────────────────────────────

// ─── E. Solicitation letter email ────────────────────────────────────────────

export async function sendSolicitationEmail(
  to: string,
  companyName: string,
  legalRepresentative: string,
  rsppName: string,
  rsppCompany: string,
  letterContent: string,
  deadlineCount: number
): Promise<boolean> {
  // Convert plain text letter to HTML
  const letterHtml = letterContent
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin:0 0 12px 0;font-size:14px;color:#1e293b;line-height:1.7;">')
    .replace(/\n/g, '<br/>')
    .replace(
      /SCADUTI o NON ADEMPIUTI/g,
      '<strong style="color:#dc2626;">SCADUTI o NON ADEMPIUTI</strong>'
    )
    .replace(
      /URGENZA/g,
      '<strong style="color:#dc2626;">URGENZA</strong>'
    );

  const body = `
    <!-- Alert banner -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
           style="background-color:#fee2e2;border-radius:8px;border:1px solid #fecaca;margin-bottom:24px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0;font-size:15px;font-weight:700;color:#dc2626;">
            &#9888; Sollecito Formale — Adempimenti Sicurezza sul Lavoro
          </p>
          <p style="margin:4px 0 0 0;font-size:13px;color:#b91c1c;">
            ${deadlineCount} adempiment${deadlineCount === 1 ? 'o non rispettato' : 'i non rispettati'} per ${companyName}
          </p>
        </td>
      </tr>
    </table>

    <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:24px;margin-bottom:24px;">
      <p style="margin:0 0 12px 0;font-size:14px;color:#1e293b;line-height:1.7;">
        ${letterHtml}
      </p>
    </div>

    <p style="margin:0 0 8px 0;font-size:12px;color:#94a3b8;text-align:center;">
      Questo sollecito è stato generato automaticamente da SafeTrack per conto di ${rsppName}${rsppCompany ? ` — ${rsppCompany}` : ''}.
    </p>
  `;

  return sendEmail({
    to,
    subject: `SOLLECITO: ${deadlineCount} adempiment${deadlineCount === 1 ? 'o' : 'i'} sicurezza scadut${deadlineCount === 1 ? 'o' : 'i'} — ${companyName}`,
    html: emailLayout('Sollecito Adempimenti Sicurezza', body),
  });
}

// ─── D. Weekly summary email ──────────────────────────────────────────────────

export async function sendWeeklySummaryEmail(
  to: string,
  rsppName: string,
  stats: WeeklyStats
): Promise<boolean> {
  const complianceColor =
    stats.complianceRate >= 90
      ? '#059669'
      : stats.complianceRate >= 70
        ? '#ca8a04'
        : '#dc2626';

  const complianceLabel =
    stats.complianceRate >= 90
      ? 'Ottimo'
      : stats.complianceRate >= 70
        ? 'Da migliorare'
        : 'Critico';

  const body = `
    <h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;color:#1e3a5f;">
      Riepilogo settimanale
    </h1>
    <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">
      Ciao ${rsppName}, ecco il riepilogo della settimana appena conclusa.
    </p>

    <!-- Stats grid -->
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
      <tr>
        <td width="50%" style="padding:0 6px 12px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                 style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0;font-size:28px;font-weight:700;color:#065f46;">${stats.completed}</p>
                <p style="margin:4px 0 0 0;font-size:13px;color:#16a34a;font-weight:500;">Completate</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" style="padding:0 0 12px 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                 style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0;font-size:28px;font-weight:700;color:#1e40af;">${stats.upcoming}</p>
                <p style="margin:4px 0 0 0;font-size:13px;color:#2563eb;font-weight:500;">Nei prossimi 30 giorni</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td width="50%" style="padding:0 6px 0 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                 style="background-color:${stats.overdue > 0 ? '#fef2f2' : '#f8fafc'};border:1px solid ${stats.overdue > 0 ? '#fecaca' : '#e2e8f0'};border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0;font-size:28px;font-weight:700;color:${stats.overdue > 0 ? '#dc2626' : '#64748b'};">${stats.overdue}</p>
                <p style="margin:4px 0 0 0;font-size:13px;color:${stats.overdue > 0 ? '#dc2626' : '#94a3b8'};font-weight:500;">Scadute</p>
              </td>
            </tr>
          </table>
        </td>
        <td width="50%" style="padding:0 0 0 6px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                 style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
            <tr>
              <td style="padding:16px 20px;">
                <p style="margin:0;font-size:28px;font-weight:700;color:${complianceColor};">${stats.complianceRate}%</p>
                <p style="margin:4px 0 0 0;font-size:13px;color:${complianceColor};font-weight:500;">Compliance — ${complianceLabel}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      stats.overdue > 0
        ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%"
                 style="background-color:#fee2e2;border-radius:8px;border:1px solid #fecaca;margin-bottom:24px;">
             <tr>
               <td style="padding:14px 20px;">
                 <p style="margin:0;font-size:14px;color:#b91c1c;">
                   &#9888; Hai <strong>${stats.overdue} scadenz${stats.overdue === 1 ? 'a' : 'e'} scadut${stats.overdue === 1 ? 'a' : 'e'}</strong> da gestire.
                   Accedi a SafeTrack per intervenire.
                 </p>
               </td>
             </tr>
           </table>`
        : ''
    }

    <div style="text-align:center;margin-bottom:24px;">
      ${ctaButton('Apri la dashboard', `${APP_URL}/dashboard`)}
    </div>
  `;

  return sendEmail({
    to,
    subject: 'SafeTrack: Riepilogo settimanale',
    html: emailLayout('Riepilogo settimanale', body),
  });
}
