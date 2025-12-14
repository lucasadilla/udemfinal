import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { getUserImageBucket, isGridFsUnavailable, toObjectId } from '../../../../lib/userImageStorage.js';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  try {
    // In Next.js 15+, params is a Promise and must be awaited
    const resolvedParams = await params;
    const { id } = resolvedParams || {};

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return NextResponse.json({ error: 'Identifiant de fichier manquant.' }, { status: 400 });
    }

    const objectId = toObjectId(id.trim());
    if (!objectId) {
      // Log for debugging but return 404 instead of 400 for better UX
      console.warn(`[User Image GET] Invalid ObjectId format: ${id}`);
      return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
    }

    const bucket = await getUserImageBucket();
    const file = await bucket.find({ _id: objectId }).next();

    if (!file) {
      return NextResponse.json({ error: 'Fichier introuvable.' }, { status: 404 });
    }

    const downloadStream = bucket.openDownloadStream(objectId);
    const stream = Readable.toWeb(downloadStream);

    const headers = new Headers();
    if (file.contentType) {
      headers.set('Content-Type', file.contentType);
    }
    if (typeof file.length === 'number') {
      headers.set('Content-Length', String(file.length));
    }
    headers.set('Cache-Control', 'public, max-age=604800, immutable');

    return new Response(stream, { status: 200, headers });
  } catch (error) {
    if (isGridFsUnavailable(error)) {
      return NextResponse.json(
        { error: "Le stockage de fichiers n'est pas disponible pour le moment." },
        { status: 503 },
      );
    }

    // Try to get id from params for logging (handle both sync and async params)
    let idForLogging = 'unknown';
    try {
      const resolvedParams = await params;
      idForLogging = resolvedParams?.id || 'unknown';
    } catch {
      // If params is not a promise, it's already resolved
      idForLogging = params?.id || 'unknown';
    }
    
    console.error('[User Image GET] Erreur lors de la lecture du fichier GridFS :', {
      error: error.message,
      stack: error.stack,
      id: idForLogging,
    });
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
