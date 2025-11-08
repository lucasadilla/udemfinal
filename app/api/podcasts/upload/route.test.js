import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { POST } from './route.js';

test('POST /api/podcasts/upload bascule en stockage inline lorsque mkdirSync échoue pour système en lecture seule', async () => {
  const mkdirMock = mock.method(fs, 'mkdirSync', () => {
    const error = new Error('read-only');
    error.code = 'EROFS';
    throw error;
  });

  try {
    const request = {
      headers: {
        get(name) {
          if (name.toLowerCase() === 'x-upload-action') {
            return 'init';
          }
          return null;
        },
      },
      async json() {
        return {
          fileName: 'episode.mp3',
          mimeType: 'audio/mpeg',
          size: 1024,
          type: 'video',
        };
      },
    };

    const response = await POST(request);

    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.ok(payload.uploadId);
    assert.equal(payload.storage, 'inline');
  } finally {
    mkdirMock.mock.restore();
  }
});
