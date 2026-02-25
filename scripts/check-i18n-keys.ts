import fs from 'node:fs';
import path from 'node:path';

const SRC_DIR = path.resolve(process.cwd(), 'src');
const EN_MESSAGES_PATH = path.resolve(process.cwd(), 'resources', 'en.json');
const FILE_EXTENSIONS = new Set(['.ts', '.tsx']);

const en = JSON.parse(fs.readFileSync(EN_MESSAGES_PATH, 'utf8')) as Record<string, unknown>;

const getAllSourceFiles = (dir: string): string[] => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...getAllSourceFiles(fullPath));
      continue;
    }

    if (FILE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }

  return files;
};

const translationKeyPattern = /\bt\(\s*['"]([a-zA-Z0-9_.-]+)['"]\s*(?:,|\))/g;

const resolveKey = (object: unknown, key: string): unknown => {
  return key.split('.').reduce<unknown>((acc, part) => {
    if (!acc || typeof acc !== 'object') return undefined;
    return (acc as Record<string, unknown>)[part];
  }, object);
};

const sourceFiles = getAllSourceFiles(SRC_DIR);
const missingKeys = new Map<string, string[]>();

for (const filePath of sourceFiles) {
  const source = fs.readFileSync(filePath, 'utf8');
  const keysInFile = new Set<string>();

  for (const match of source.matchAll(translationKeyPattern)) {
    const key = match[1];
    if (!key) continue;
    keysInFile.add(key);
  }

  const unresolved = [...keysInFile].filter((key) => resolveKey(en, key) === undefined);
  if (unresolved.length > 0) {
    missingKeys.set(path.relative(process.cwd(), filePath), unresolved.sort());
  }
}

if (missingKeys.size > 0) {
  console.error('Missing translation keys in resources/en.json:\n');

  for (const [file, keys] of missingKeys) {
    console.error(`- ${file}`);
    for (const key of keys) {
      console.error(`  - ${key}`);
    }
  }

  process.exit(1);
}

console.log(`i18n key check passed across ${sourceFiles.length} source files.`);
