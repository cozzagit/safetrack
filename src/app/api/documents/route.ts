import { NextRequest } from 'next/server';
import { eq, and, desc } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { db } from '@/lib/db';
import { documents, companies, employees } from '@/lib/db/schema';
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
  validationErrorResponse,
} from '@/lib/api-auth';
import { extractCertificateData } from '@/lib/services/ocr-service';

// ─── Constants ───────────────────────────────────────────────────────────────

const UPLOAD_BASE = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .slice(0, 200);
}

// ─── POST /api/documents (upload + OCR) ──────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return validationErrorResponse('Richiesta multipart non valida');
  }

  const file = formData.get('file') as File | null;
  const companyId = formData.get('companyId') as string | null;
  const employeeId = (formData.get('employeeId') as string | null) || null;
  const documentType =
    (formData.get('documentType') as string | null) || 'attestato';

  // Validation
  if (!file) {
    return validationErrorResponse('File obbligatorio');
  }
  if (!companyId) {
    return validationErrorResponse('companyId obbligatorio');
  }
  if (file.size > MAX_FILE_SIZE) {
    return validationErrorResponse('File troppo grande (max 10 MB)');
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return validationErrorResponse(
      'Tipo file non supportato. Accettati: JPG, PNG, WebP, PDF'
    );
  }

  // Verify company ownership
  const [company] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(and(eq(companies.id, companyId), eq(companies.userId, user.id)))
    .limit(1);

  if (!company) {
    return Response.json(
      { error: { message: 'Azienda non trovata' } },
      { status: 404 }
    );
  }

  // Verify employee belongs to the company (if provided)
  if (employeeId) {
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(
        and(eq(employees.id, employeeId), eq(employees.companyId, companyId))
      )
      .limit(1);

    if (!employee) {
      return Response.json(
        { error: { message: 'Dipendente non trovato' } },
        { status: 404 }
      );
    }
  }

  try {
    // Build file path: /data/safetrack/uploads/{userId}/{year}/{month}/{filename}
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const timestamp = Date.now();
    const safeName = sanitizeFileName(file.name);
    const fileName = `${timestamp}_${safeName}`;
    const relativePath = join(user.id, year, month, fileName);
    const absoluteDir = join(UPLOAD_BASE, user.id, year, month);
    const absolutePath = join(UPLOAD_BASE, relativePath);

    // Create directory and write file
    await mkdir(absoluteDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    // Run OCR if the file is an image
    let ocrResult = null;
    const isImage = IMAGE_MIME_TYPES.includes(file.type);

    if (isImage) {
      const base64 = buffer.toString('base64');
      const dataUrl = `data:${file.type};base64,${base64}`;
      ocrResult = await extractCertificateData(dataUrl);
    }

    // Create document record
    const validDocTypes = ['attestato', 'verbale', 'certificato', 'altro'] as const;
    const docType = validDocTypes.includes(documentType as typeof validDocTypes[number])
      ? (documentType as typeof validDocTypes[number])
      : 'altro';

    const [doc] = await db
      .insert(documents)
      .values({
        userId: user.id,
        companyId,
        employeeId,
        fileName: file.name,
        filePath: relativePath,
        fileSize: file.size,
        mimeType: file.type,
        documentType: docType,
        title: ocrResult?.courseName || file.name,
        issueDate: ocrResult?.courseDate ? new Date(ocrResult.courseDate) : null,
        expiryDate: ocrResult?.expiryDate
          ? new Date(ocrResult.expiryDate)
          : null,
        issuingBody: ocrResult?.issuingBody || null,
        aiExtracted: isImage && ocrResult !== null,
        aiConfidence: ocrResult ? (ocrResult.confidence / 100).toFixed(4) : null,
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

    return Response.json(
      {
        data: doc,
        ocr: ocrResult,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/documents]', error);
    return serverErrorResponse('Errore durante il caricamento del documento');
  }
}

// ─── GET /api/documents ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const { searchParams } = request.nextUrl;
  const companyId = searchParams.get('companyId');
  const employeeId = searchParams.get('employeeId');
  const deadlineId = searchParams.get('deadlineId');

  try {
    const conditions = [eq(documents.userId, user.id)];

    if (companyId) {
      conditions.push(eq(documents.companyId, companyId));
    }
    if (employeeId) {
      conditions.push(eq(documents.employeeId, employeeId));
    }
    if (deadlineId) {
      conditions.push(eq(documents.deadlineId, deadlineId));
    }

    const docs = await db
      .select()
      .from(documents)
      .where(and(...conditions))
      .orderBy(desc(documents.createdAt));

    return Response.json({ data: docs });
  } catch (error) {
    console.error('[GET /api/documents]', error);
    return serverErrorResponse();
  }
}
