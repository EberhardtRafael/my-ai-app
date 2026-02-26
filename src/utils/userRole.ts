export type AppUserRole = 'user' | 'dev';

type UserIdentity = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

const parseCsv = (value: string | undefined): Set<string> =>
  new Set(
    (value || '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );

const normalize = (value: string | null | undefined): string => (value || '').trim().toLowerCase();

const configuredDeveloperIds = parseCsv(process.env.DEV_USER_IDS);
const configuredDeveloperNames = parseCsv(process.env.DEV_USERNAMES);
const configuredDeveloperEmails = parseCsv(process.env.DEV_USER_EMAILS);
const builtinDeveloperNames = new Set(['dev']);
const builtinDeveloperEmails = new Set(['dev@example.com']);

export const isDeveloperRole = (role: string | null | undefined): boolean => role === 'dev';

export const resolveUserRole = (identity: UserIdentity): AppUserRole => {
  if (isDeveloperRole(identity.role)) {
    return 'dev';
  }

  const id = normalize(identity.id);
  const name = normalize(identity.name);
  const email = normalize(identity.email);

  if (
    (name && builtinDeveloperNames.has(name)) ||
    (email && builtinDeveloperEmails.has(email)) ||
    (id && configuredDeveloperIds.has(id)) ||
    (name && configuredDeveloperNames.has(name)) ||
    (email && configuredDeveloperEmails.has(email))
  ) {
    return 'dev';
  }

  return 'user';
};
