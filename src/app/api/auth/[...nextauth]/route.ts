import crypto from 'node:crypto';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        userName: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Query the database to validate user credentials
        const userName = credentials?.userName;
        const password = credentials?.password;

        if (!userName || !password) {
          return null;
        }

        // Hash the password using SHA256 (same method as backend)
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

        try {
          // Query GraphQL API to verify user credentials
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `query { verifyUser(username: "${userName}", passwordHash: "${passwordHash}") { id username email } }`,
            }),
          });

          const result = await response.json();
          const user = result?.data?.verifyUser;

          if (!user) {
            // Invalid credentials
            return null;
          }

          return {
            id: user.id.toString(),
            name: user.username,
            email: user.email,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add user id to the session from the token's sub field (standard JWT user id)
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
