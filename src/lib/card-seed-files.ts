import fs from 'node:fs/promises';
import path from 'node:path';
import { cardsSeedDatasetSchema, type CardSeedRecord } from '@/lib/card-seed-schema';

const CARD_SEED_FILE_PATTERN = /^cards(?:-[\w-]+)?\.json$/;
const CARD_SEED_CONTENT_DIR = 'content';

type CardSeedFileDataset = {
  cards: unknown;
};

function compareCardSeedFileNames(a: string, b: string) {
  return a.localeCompare(b, 'en', { numeric: true });
}

export async function listCardSeedFiles(cwd = process.cwd()) {
  const contentDir = path.join(cwd, CARD_SEED_CONTENT_DIR);
  const fileNames = await fs.readdir(contentDir);

  return fileNames
    .filter((fileName) => CARD_SEED_FILE_PATTERN.test(fileName))
    .sort(compareCardSeedFileNames)
    .map((fileName) => path.join(CARD_SEED_CONTENT_DIR, fileName));
}

export async function readCardSeedDataset(
  filePath: string,
  cwd = process.cwd()
): Promise<CardSeedRecord[]> {
  const raw = await fs.readFile(path.join(cwd, filePath), 'utf8');
  const parsed = JSON.parse(raw) as CardSeedFileDataset;
  return cardsSeedDatasetSchema.parse(parsed.cards);
}

export async function readAllCardSeedDatasets(cwd = process.cwd()) {
  const filePaths = await listCardSeedFiles(cwd);
  const datasets = await Promise.all(filePaths.map((filePath) => readCardSeedDataset(filePath, cwd)));

  return filePaths.map((filePath, index) => ({
    filePath,
    cards: datasets[index] ?? []
  }));
}
