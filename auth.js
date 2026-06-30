import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
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

        // Delegate authentication to the backend API
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
          const res = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })
          const data = await res.json().catch(() => null)
          if (!data || !data.success || !data.data?.user) return null

          const u = data.data.user
          return {
            id: String(u.id),
            name: u.name,
            email: u.email,
            role: u.role,
            department: u.department,
          }
        } catch (err) {
          return null
        }
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
