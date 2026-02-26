import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GithubProvider from 'next-auth/providers/github';
import { getRoleOverrideForIdentity } from '@/utils/serverRoleOverrides';
import { resolveUserRole } from '@/utils/userRole';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

const sanitizeUsername = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 24);

const randomPassword = (): string => `${Math.random().toString(36).slice(2)}A1!${Date.now()}`;

type BackendUser = {
  id: number;
  username: string;
  email: string;
};

const fetchUserByEmail = async (email: string): Promise<BackendUser | null> => {
  const response = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query UserByEmail($email: String!) {
        userByEmail(email: $email) {
          id
          username
          email
        }
      }`,
      variables: { email },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.data?.userByEmail || null;
};

const createBackendUser = async ({
  username,
  email,
}: {
  username: string;
  email: string;
}): Promise<BackendUser | null> => {
  const response = await fetch(`${BACKEND_URL}/graphql`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation CreateUser($username: String!, $email: String!, $password: String!) {
        createUser(username: $username, email: $email, password: $password) {
          id
          username
          email
        }
      }`,
      variables: {
        username,
        email,
        password: randomPassword(),
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload?.data?.createUser || null;
};

const ensureBackendUserForOAuth = async ({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}): Promise<BackendUser | null> => {
  const existing = await fetchUserByEmail(email);
  if (existing) {
    return existing;
  }

  const base = sanitizeUsername(name || email.split('@')[0] || 'user');

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = attempt === 0 ? '' : `${Math.floor(Math.random() * 10000)}`;
    const username = `${base}${suffix}`;

    const created = await createBackendUser({ username, email });
    if (created) {
      return created;
    }
  }

  return null;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        userName: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const userName = credentials?.userName;
        const password = credentials?.password;

        if (!userName || !password) {
          return null;
        }

        try {
          const response = await fetch(`${BACKEND_URL}/graphql`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `query VerifyUser($username: String!, $password: String!) {
                verifyUser(username: $username, password: $password) {
                  id
                  username
                  email
                }
              }`,
              variables: {
                username: userName.trim(),
                password,
              },
            }),
            cache: 'no-store',
          });

          if (!response.ok) {
            return null;
          }

          const result = await response.json();

          if (result?.errors?.length) {
            return null;
          }

          const user = result?.data?.verifyUser;

          if (!user) {
            return null;
          }

          const role = resolveUserRole({
            id: user.id?.toString(),
            name: user.username,
            email: user.email,
            role: user.role,
          });

          const overrideRole = await getRoleOverrideForIdentity({
            id: user.id?.toString(),
            username: user.username,
            email: user.email,
          });

          return {
            id: user.id.toString(),
            name: user.username,
            email: user.email,
            role: overrideRole || role,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'github') {
        return true;
      }

      const email = user.email?.toLowerCase();
      if (!email) {
        return false;
      }

      const backendUser = await ensureBackendUserForOAuth({ email, name: user.name });
      if (!backendUser) {
        return false;
      }

      const baseRole = resolveUserRole({
        id: backendUser.id.toString(),
        name: backendUser.username,
        email: backendUser.email,
      });

      const overrideRole = await getRoleOverrideForIdentity({
        id: backendUser.id.toString(),
        username: backendUser.username,
        email: backendUser.email,
      });

      (user as { appUserId?: string }).appUserId = backendUser.id.toString();
      (user as { role?: 'user' | 'dev' }).role = (overrideRole || baseRole) as 'user' | 'dev';
      user.name = backendUser.username;
      user.email = backendUser.email;

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        const userRole = (user as { role?: 'user' | 'dev' }).role;
        token.role = userRole || 'user';
        token.appUserId = (user as { appUserId?: string }).appUserId || user.id;
      }

      if (!token.role) {
        token.role = 'user';
      }

      if (!token.appUserId) {
        token.appUserId = token.sub;
      }

      return token;
    },
    async session({ session, token }) {
      // Add user id to the session from the token's sub field (standard JWT user id)
      if (session.user && (token.appUserId || token.sub)) {
        session.user.id = (token.appUserId as string) || token.sub || '';
        session.user.role = (token.role as 'user' | 'dev' | undefined) || 'user';
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 60 * 60 * 8,
    updateAge: 60 * 30,
  },
  jwt: {
    maxAge: 60 * 60 * 8,
  },
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
