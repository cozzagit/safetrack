import OpenAI from 'openai';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OCRResult {
  employeeName: string | null;
  courseName: string | null;
  courseDate: string | null;
  expiryDate: string | null;
  issuingBody: string | null;
  durationHours: number | null;
  confidence: number;
  rawText: string;
}

interface AIExtractionResponse {
  nome_lavoratore?: string;
  nome_corso?: string;
  data_corso?: string;
  durata_ore?: number;
  ente_certificatore?: string;
  data_scadenza?: string;
  testo_completo?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sei un assistente specializzato nell'analisi di attestati e certificati di formazione sulla sicurezza sul lavoro italiani (D.Lgs. 81/08).

Analizza l'immagine e estrai le seguenti informazioni:
- nome_lavoratore: nome completo del lavoratore/partecipante
- nome_corso: nome del corso di formazione
- data_corso: data del corso o data di rilascio (formato YYYY-MM-DD)
- durata_ore: durata del corso in ore (numero)
- ente_certificatore: nome dell'ente che ha rilasciato l'attestato
- data_scadenza: data di scadenza se indicata (formato YYYY-MM-DD)
- testo_completo: tutto il testo leggibile nell'immagine

Rispondi SOLO con un oggetto JSON valido, senza markdown, senza commenti.
Se un campo non e' leggibile o non presente, usa null.
Per le date usa sempre il formato YYYY-MM-DD.`;

function parseISODate(value: unknown): string | null {
  if (typeof value !== 'string' || !value) return null;
  // Accept YYYY-MM-DD or DD/MM/YYYY
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : value.slice(0, 10);
  }
  const euMatch = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (euMatch) {
    const [, day, month, year] = euMatch;
    const iso = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : iso;
  }
  return null;
}

function calculateConfidence(result: Omit<OCRResult, 'confidence' | 'rawText'>): number {
  const fields = [
    result.employeeName,
    result.courseName,
    result.courseDate,
    result.issuingBody,
    result.durationHours,
  ];
  const extracted = fields.filter((f) => f !== null && f !== undefined).length;
  // 5 key fields: each worth 20 points
  return Math.round((extracted / fields.length) * 100);
}

// ─── Main Function ───────────────────────────────────────────────────────────

export async function extractCertificateData(imageBase64: string): Promise<OCRResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[OCR] OPENAI_API_KEY not configured');
    return {
      employeeName: null,
      courseName: null,
      courseDate: null,
      expiryDate: null,
      issuingBody: null,
      durationHours: null,
      confidence: 0,
      rawText: '',
    };
  }

  const openai = new OpenAI({ apiKey });

  // Determine MIME type from base64 header or default to jpeg
  let dataUrl = imageBase64;
  if (!imageBase64.startsWith('data:')) {
    dataUrl = `data:image/jpeg;base64,${imageBase64}`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: dataUrl, detail: 'high' },
            },
            {
              type: 'text',
              text: 'Analizza questo attestato/certificato di formazione sulla sicurezza sul lavoro. Estrai i dati richiesti in formato JSON.',
            },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() ?? '';

    // Try to parse JSON from the response (strip potential markdown fences)
    let jsonStr = raw;
    const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    let parsed: AIExtractionResponse;
    try {
      parsed = JSON.parse(jsonStr) as AIExtractionResponse;
    } catch {
      // If JSON parsing fails, return raw text with low confidence
      console.error('[OCR] Failed to parse AI response as JSON:', raw.slice(0, 200));
      return {
        employeeName: null,
        courseName: null,
        courseDate: null,
        expiryDate: null,
        issuingBody: null,
        durationHours: null,
        confidence: 5,
        rawText: raw,
      };
    }

    const employeeName = parsed.nome_lavoratore || null;
    const courseName = parsed.nome_corso || null;
    const courseDate = parseISODate(parsed.data_corso);
    const expiryDate = parseISODate(parsed.data_scadenza);
    const issuingBody = parsed.ente_certificatore || null;
    const durationHours =
      typeof parsed.durata_ore === 'number' && parsed.durata_ore > 0
        ? parsed.durata_ore
        : null;
    const rawText = parsed.testo_completo || raw;

    const partial = { employeeName, courseName, courseDate, expiryDate, issuingBody, durationHours };
    const confidence = calculateConfidence(partial);

    return {
      ...partial,
      confidence,
      rawText,
    };
  } catch (error) {
    console.error('[OCR] OpenAI API error:', error instanceof Error ? error.message : error);
    return {
      employeeName: null,
      courseName: null,
      courseDate: null,
      expiryDate: null,
      issuingBody: null,
      durationHours: null,
      confidence: 0,
      rawText: '',
    };
  }
}
