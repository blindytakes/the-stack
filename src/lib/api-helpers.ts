import { NextResponse } from 'next/server';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function badRequest(message = 'Invalid request') {
  return jsonError(message, 400);
}

export function serverError(message = 'Server error') {
  return jsonError(message, 500);
}

export async function parseJsonBody<T = unknown>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}
