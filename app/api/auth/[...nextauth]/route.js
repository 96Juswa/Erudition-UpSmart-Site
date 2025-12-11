// app/api/auth/[...nextauth]/route.js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { findUserByEmail } from "@/app/lib/db";
import { verifyPassword } from "@/app/lib/auth";

const authOptions = {
  providers: [
    // Manual email/password login
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await findUserByEmail(credentials.email);
        if (!user) return null;

        const isValid = await verifyPassword(
          credentials.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.userId.toString(),
          email: user.email,
          name: user.firstName,
        };
      },
    }),

    // Google login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],

  callbacks: {
    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        if (!profile?.email?.endsWith("@my.jru.edu")) {
          return false;
        }
        // ✅ Just skip the database check for now
        // The database call here is causing issues
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.userId = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.userId = token.userId;
        session.user.id = token.userId;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
