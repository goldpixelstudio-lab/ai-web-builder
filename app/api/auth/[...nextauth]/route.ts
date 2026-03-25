import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // ŻELAZNA BRAMA: Sprawdzamy, czy email logującej się osoby to Twój email z pliku .env
      if (user.email === process.env.ALLOWED_EMAIL) {
        return true;
      }
      return false; // Każdy inny użytkownik zostaje wyrzucony
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };