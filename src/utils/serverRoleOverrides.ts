import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { AppUserRole } from '@/utils/userRole';

type RoleOverrideRecord = {
  id?: string;
  username?: string;
  email?: string;
  role: AppUserRole;
  updatedAt: string;
};

type RoleOverrideStore = {
  records: RoleOverrideRecord[];
};

const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_PATH = path.join(STORE_DIR, 'role-overrides.json');

const normalize = (value: string | null | undefined): string => (value || '').trim().toLowerCase();

const readStore = async (): Promise<RoleOverrideStore> => {
  try {
    const raw = await readFile(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as RoleOverrideStore;
    return { records: parsed.records || [] };
  } catch {
    return { records: [] };
  }
};

const writeStore = async (store: RoleOverrideStore): Promise<void> => {
  await mkdir(STORE_DIR, { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
};

export const getRoleOverrideForIdentity = async ({
  id,
  username,
  email,
}: {
  id?: string | null;
  username?: string | null;
  email?: string | null;
}): Promise<AppUserRole | null> => {
  const normalizedId = normalize(id);
  const normalizedUsername = normalize(username);
  const normalizedEmail = normalize(email);

  const store = await readStore();
  const match = store.records.find((record) => {
    const recordId = normalize(record.id);
    const recordUsername = normalize(record.username);
    const recordEmail = normalize(record.email);

    return (
      (normalizedId && recordId && normalizedId === recordId) ||
      (normalizedUsername && recordUsername && normalizedUsername === recordUsername) ||
      (normalizedEmail && recordEmail && normalizedEmail === recordEmail)
    );
  });

  return match?.role || null;
};

export const setRoleOverrideForIdentity = async ({
  id,
  username,
  email,
  role,
}: {
  id?: string | null;
  username?: string | null;
  email?: string | null;
  role: AppUserRole;
}): Promise<void> => {
  const normalizedId = normalize(id);
  const normalizedUsername = normalize(username);
  const normalizedEmail = normalize(email);

  if (!normalizedId && !normalizedUsername && !normalizedEmail) {
    return;
  }

  const store = await readStore();

  const matchIndex = store.records.findIndex((record) => {
    const recordId = normalize(record.id);
    const recordUsername = normalize(record.username);
    const recordEmail = normalize(record.email);

    return (
      (normalizedId && recordId && normalizedId === recordId) ||
      (normalizedUsername && recordUsername && normalizedUsername === recordUsername) ||
      (normalizedEmail && recordEmail && normalizedEmail === recordEmail)
    );
  });

  const updatedRecord: RoleOverrideRecord = {
    id: id || undefined,
    username: username || undefined,
    email: email || undefined,
    role,
    updatedAt: new Date().toISOString(),
  };

  if (matchIndex >= 0) {
    store.records[matchIndex] = {
      ...store.records[matchIndex],
      ...updatedRecord,
    };
  } else {
    store.records.push(updatedRecord);
  }

  await writeStore(store);
};
