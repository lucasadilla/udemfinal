import { Readable } from 'node:stream';
import { NextResponse } from 'next/server';
import { getPodcastMediaBucket, isGridFsUnavailable, toObjectId } from '../../../../../lib/podcastMediaStorage.js';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  // In Next.js 15+, params is a Promise and must be awaited
  const resolvedParams = await params;
  const { id } = resolvedParams || {};

  if (!id) {
    return NextResponse.json({ error: 'Identifiant de fichier manquant.' }, { status: 400 });
  }

  const objectId = toObjectId(id);
  if (!objectId) {
    return NextResponse.json({ error: 'Identifiant de fichier invalide.' }, { status: 400 });
  }

  try {
    const bucket = await getPodcastMediaBucket();
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

    console.error('Erreur lors de la lecture du fichier GridFS :', error);
    return NextResponse.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}

