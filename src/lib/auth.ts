import type { NextAuthOptions, DefaultSession, DefaultUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      globalRole: string;
      status: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    globalRole: string;
    status: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    globalRole: string;
    status: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        if (user.status !== "APPROVED") {
          throw new Error("Your account is pending approval by an administrator.");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
          globalRole: user.globalRole,
          status: user.status,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.globalRole = user.globalRole;
        token.id = user.id;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.globalRole = token.globalRole;
        session.user.id = token.id;
        session.user.status = token.status;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "oneqa-enterprise-secret-change-in-production",
};
