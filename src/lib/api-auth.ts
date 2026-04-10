import { auth } from '@/lib/auth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Extracts and validates the current session from the incoming request.
 * Returns the authenticated user or null if no valid session exists.
 */
export async function getAuthUser(request: Request): Promise<AuthUser | null> {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    };
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return Response.json(
    { error: { message: 'Non autenticato' } },
    { status: 401 }
  );
}

export function forbiddenResponse() {
  return Response.json(
    { error: { message: 'Accesso negato' } },
    { status: 403 }
  );
}

export function notFoundResponse(entity = 'Risorsa') {
  return Response.json(
    { error: { message: `${entity} non trovata` } },
    { status: 404 }
  );
}

export function serverErrorResponse(message = 'Errore interno del server') {
  return Response.json(
    { error: { message } },
    { status: 500 }
  );
}

export function validationErrorResponse(details: unknown) {
  return Response.json(
    { error: { message: 'Dati non validi', details } },
    { status: 400 }
  );
}
