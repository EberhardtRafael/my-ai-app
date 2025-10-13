import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        userName: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Add more logic here. I need to grab the user from a database instead of just mocking one
        if (credentials?.userName === "test" && credentials?.password === "test") {
          return { id: "1", name: "Test User", email: "test@example.com" };
        }
        return null;
      }
    })
  ],
  session: {
  strategy: "jwt" as const
  },
  pages: {
    signIn: "/auth/signin"
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
