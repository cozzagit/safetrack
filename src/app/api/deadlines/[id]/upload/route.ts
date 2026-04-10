import { NextRequest } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import {
  documents,
  deadlines,
  deadlineTypes,
  companies,
} from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
  validationErrorResponse,
  notFoundResponse,
} from '@/lib/api-auth';
import { extractCertificateData } from '@/lib/services/ocr-service';

// ─── Constants ───────────────────────────────────────────────────────────────

const UPLOAD_BASE = process.env.UPLOAD_DIR || '/data/safetrack/uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 200);
}

// ─── POST /api/deadlines/:id/upload ──────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { id: deadlineId } = await params;

  // Verify deadline ownership and fetch details
  const [deadline] = await db
    .select({
      id: deadlines.id,
      companyId: deadlines.companyId,
      employeeId: deadlines.employeeId,
      deadlineTypeId: deadlines.deadlineTypeId,
      dueDate: deadlines.dueDate,
      status: deadlines.status,
    })
    .from(deadlines)
    .where(and(eq(deadlines.id, deadlineId), eq(deadlines.userId, user.id)))
    .limit(1);

  if (!deadline) {
    return notFoundResponse('Scadenza');
  }

  // Fetch deadline type for renewal calculation
  const [deadlineType] = await db
    .select({
      name: deadlineTypes.name,
      defaultPeriodicityMonths: deadlineTypes.defaultPeriodicityMonths,
    })
    .from(deadlineTypes)
    .where(eq(deadlineTypes.id, deadline.deadlineTypeId))
    .limit(1);

  // Parse form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return validationErrorResponse('Richiesta multipart non valida');
  }

  const file = formData.get('file') as File | null;
  if (!file) {
    return validationErrorResponse('File obbligatorio');
  }
  if (file.size > MAX_FILE_SIZE) {
    return validationErrorResponse('File troppo grande (max 10 MB)');
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return validationErrorResponse(
      'Tipo file non supportato. Accettati: JPG, PNG, WebP, PDF'
    );
  }

  try {
    // Save file
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now();
    const safeName = sanitizeFileName(file.name);
    const fileName = `${timestamp}_${safeName}`;
    const relativePath = join(user.id, year, month, fileName);
    const absoluteDir = join(UPLOAD_BASE, user.id, year, month);
    const absolutePath = join(UPLOAD_BASE, relativePath);

    await mkdir(absoluteDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    // Run OCR if image
    let ocrResult = null;
    const isImage = IMAGE_MIME_TYPES.includes(file.type);

    if (isImage) {
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      ocrResult = await extractCertificateData(dataUrl);
    }

    // Create document linked to this deadline
    const [doc] = await db
      .insert(documents)
      .values({
        userId: user.id,
        deadlineId: deadline.id,
        companyId: deadline.companyId,
        employeeId: deadline.employeeId,
        fileName: file.name,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.type,
        documentType: 'attestato',
        title:
          ocrResult?.courseName || deadlineType?.name || file.name,
        issueDate: ocrResult?.courseDate
          ? new Date(ocrResult.courseDate)
          : null,
        expiryDate: ocrResult?.expiryDate
          ? new Date(ocrResult.expiryDate)
          : null,
        issuingBody: ocrResult?.issuingBody || null,
        aiExtracted: isImage && ocrResult !== null,
        aiConfidence: ocrResult
          ? (ocrResult.confidence / 100).toFixed(4)
          : null,
        rawAiResponse: ocrResult
          ? {
              employeeName: ocrResult.employeeName,
              courseName: ocrResult.courseName,
              courseDate: ocrResult.courseDate,
              expiryDate: ocrResult.expiryDate,
              issuingBody: ocrResult.issuingBody,
              durationHours: ocrResult.durationHours,
              confidence: ocrResult.confidence,
              rawText: ocrResult.rawText,
            }
          : null,
      })
      .returning();

    // Build suggestion: if OCR extracted a date, suggest completing the deadline
    let suggestion: {
      action: string;
      completedDate: string | null;
      renewalDate: string | null;
      message: string;
    } | null = null;

    if (ocrResult?.courseDate) {
      const completedDate = ocrResult.courseDate;
      let renewalDate: string | null = null;

      if (deadlineType?.defaultPeriodicityMonths && deadlineType.defaultPeriodicityMonths > 0) {
        const renewal = new Date(completedDate);
        renewal.setMonth(
          renewal.getMonth() + deadlineType.defaultPeriodicityMonths
        );
        renewalDate = renewal.toISOString().slice(0, 10);
      }

      suggestion = {
        action: 'complete_deadline',
        completedDate,
        renewalDate,
        message: renewalDate
          ? `Attestato datato ${completedDate}. Suggerimento: segna completata e imposta rinnovo al ${renewalDate}.`
          : `Attestato datato ${completedDate}. Suggerimento: segna come completata.`,
      };
    }

    return Response.json(
      {
        data: doc,
        ocr: ocrResult,
        suggestion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/deadlines/:id/upload]', error);
    return serverErrorResponse(
      'Errore durante il caricamento del documento'
    );
  }
}
