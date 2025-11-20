import fs from 'fs';
import os from 'os';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'data');
const fallbackDataDirectory = path.join(os.tmpdir(), 'udemfinal-data');

function cloneDefault(value) {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (value && typeof value === 'object') {
    return { ...value };
  }
  return value;
}

function readJsonFromPath(filePath, defaultValue) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Impossible de lire le fichier ${filePath} :`, error);
    }
    return cloneDefault(defaultValue);
  }
}

function isReadOnlyFileSystemError(error) {
  return error?.code === 'EACCES' || error?.code === 'EROFS' || error?.code === 'EPERM';
}

export function readJsonFile(fileName, defaultValue) {
  const primaryPath = path.join(dataDirectory, fileName);
  const fallbackPath = path.join(fallbackDataDirectory, fileName);

  const primaryResult = readJsonFromPath(primaryPath, undefined);
  if (typeof primaryResult !== 'undefined') {
    return primaryResult;
  }

  return readJsonFromPath(fallbackPath, defaultValue);
}

function writeJsonToPath(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function writeJsonFile(fileName, data) {
  const primaryPath = path.join(dataDirectory, fileName);

  try {
    writeJsonToPath(primaryPath, data);
    return true;
  } catch (error) {
    if (!isReadOnlyFileSystemError(error)) {
      console.error(`Impossible d’écrire le fichier ${fileName} :`, error);
      throw error;
    }

    console.warn(
      `Système de fichiers en lecture seule détecté pour ${fileName}; basculement vers le stockage temporaire.`,
    );
    const fallbackPath = path.join(fallbackDataDirectory, fileName);
    try {
      writeJsonToPath(fallbackPath, data);
      return true;
    } catch (fallbackError) {
      console.error(`Impossible d’écrire le fichier ${fileName} dans le stockage temporaire :`, fallbackError);
      throw fallbackError;
    }
  }
}

export function deleteJsonFile(fileName) {
  const primaryPath = path.join(dataDirectory, fileName);
  const fallbackPath = path.join(fallbackDataDirectory, fileName);

  [primaryPath, fallbackPath].forEach((filePath) => {
    try {
      fs.unlinkSync(filePath);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.error(`Impossible de supprimer le fichier ${filePath} :`, error);
      }
    }
  });
}
