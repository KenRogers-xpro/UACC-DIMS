import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: 'jwt',
  },

  pages: {
    signIn: '/login',
  },

  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Look up the user in MySQL via Prisma
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.isActive) return null;

        // Compare plain-text attempt against bcrypt hash in DB
        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!passwordMatch) return null;

        // Return a JWT-safe subset — never expose the hashed password
        return {
          id:         String(user.id),
          name:       user.name,
          email:      user.email,
          role:       user.role,
          department: user.department,
        };
      },
    }),
  ],

  callbacks: {
    // Persist role + department into the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id;
        token.role       = user.role;
        token.department = user.department;
      }
      return token;
    },

    // Expose role + department on the client-side session object
    async session({ session, token }) {
      if (session.user) {
        session.user.id         = token.id;
        session.user.role       = token.role;
        session.user.department = token.department;
      }
      return session;
    },
  },
});
