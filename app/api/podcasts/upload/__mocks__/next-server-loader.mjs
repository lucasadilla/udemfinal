import path from 'node:path';
import { pathToFileURL } from 'node:url';

const mockUrl = pathToFileURL(path.join(process.cwd(), 'app/api/podcasts/upload/__mocks__/next-server.js')).href;

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === 'next/server') {
    return {
      shortCircuit: true,
      url: mockUrl,
    };
  }

  return defaultResolve(specifier, context, defaultResolve);
}
