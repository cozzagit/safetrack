import { NextRequest } from 'next/server';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';
import {
  getAuthUser,
  unauthorizedResponse,
  serverErrorResponse,
} from '@/lib/api-auth';

// ─── In-memory temp store for preview→execute flow ──────────────────────────

// Global map: fileId → { rows, headers, userId, createdAt }
// Cleaned up after 15 minutes
const tempFileStore = new Map<
  string,
  {
    rows: Record<string, unknown>[];
    headers: string[];
    userId: string;
    createdAt: number;
  }
>();

// Export for use in execute route
export { tempFileStore };

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tempFileStore) {
    if (now - value.createdAt > 15 * 60 * 1000) {
      tempFileStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateFileId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const AVAILABLE_FIELDS = [
  'companyName',
  'employeeFiscalCode',
  'employeeFirstName',
  'employeeLastName',
  'employeeRole',
  'hiringDate',
  'formazioneGenerale',
  'formazioneSpecifica',
  'formazionePreposti',
  'antincendio',
  'primoSoccorso',
  'visitaMedica',
  'rls',
  'SKIP',
] as const;

async function aiMapColumns(
  headers: string[]
): Promise<Record<string, string>> {
  const openai = new OpenAI();

  const prompt = `Sei un esperto di sicurezza sul lavoro italiana. Mappa queste colonne di un foglio Excel di un consulente RSPP ai seguenti campi del database:

Colonne trovate: ${JSON.stringify(headers)}

Campi disponibili:
- companyName: ragione sociale azienda
- employeeFiscalCode: codice fiscale dipendente
- employeeFirstName: nome dipendente
- employeeLastName: cognome dipendente
- employeeRole: mansione/ruolo
- hiringDate: data assunzione
- formazioneGenerale: data formazione generale
- formazioneSpecifica: data formazione specifica
- formazionePreposti: data formazione preposti
- antincendio: data corso antincendio
- primoSoccorso: data corso primo soccorso
- visitaMedica: data ultima visita medica
- rls: data formazione RLS
- SKIP: colonna da ignorare

NOTA: Se una colonna contiene sia nome che cognome (es. "Cognome e Nome", "Nome Cognome", "Lavoratore"), mappala a employeeLastName — il sistema separerà nome e cognome.

Rispondi SOLO in JSON: { "column_name": "field_name", ... }`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return {};

    return JSON.parse(content) as Record<string, string>;
  } catch (error) {
    console.error('[AI Column Mapping]', error);
    return {};
  }
}

// ─── POST /api/import/preview ───────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return Response.json(
        { error: { message: 'Nessun file caricato' } },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return Response.json(
        {
          error: {
            message: 'File troppo grande. Massimo 5MB.',
          },
        },
        { status: 400 }
      );
    }

    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some((ext) =>
      fileName.endsWith(ext)
    );
    if (!hasValidExtension) {
      return Response.json(
        {
          error: {
            message: 'Formato file non supportato. Usa .xlsx, .xls o .csv',
          },
        },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse with SheetJS
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return Response.json(
        { error: { message: 'Il file non contiene fogli di lavoro' } },
        { status: 400 }
      );
    }

    const sheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false,
    });

    if (jsonData.length === 0) {
      return Response.json(
        { error: { message: 'Il foglio di lavoro è vuoto' } },
        { status: 400 }
      );
    }

    const headers = Object.keys(jsonData[0]);
    const previewRows = jsonData.slice(0, 10);
    const totalRows = jsonData.length;

    // AI column mapping
    const aiMapping = await aiMapColumns(headers);

    // Store full data temporarily
    const fileId = generateFileId();
    tempFileStore.set(fileId, {
      rows: jsonData,
      headers,
      userId: user.id,
      createdAt: Date.now(),
    });

    return Response.json({
      data: {
        fileId,
        headers,
        previewRows,
        totalRows,
        aiMapping,
        availableFields: AVAILABLE_FIELDS,
      },
    });
  } catch (error) {
    console.error('[POST /api/import/preview]', error);
    return serverErrorResponse('Errore durante la lettura del file');
  }
}
