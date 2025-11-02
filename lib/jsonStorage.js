import fs from 'fs';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'data');

function cloneDefault(value) {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (value && typeof value === 'object') {
    return { ...value };
  }
  return value;
}

export function readJsonFile(fileName, defaultValue) {
  const filePath = path.join(dataDirectory, fileName);
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Impossible de lire le fichier ${fileName} :`, error);
    }
    return cloneDefault(defaultValue);
  }
}

export function writeJsonFile(fileName, data) {
  const filePath = path.join(dataDirectory, fileName);
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Impossible d’écrire le fichier ${fileName} :`, error);
  }
}
