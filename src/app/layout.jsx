import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata = {
  title: "UACC DIMS - Uganda Air Cargo Corporation",
  description: "Digital Information & Management System (DIMS) replaces paper-based workflows with a secure, intelligent digital system — document management, procurement approvals, activity logging, and an AI agent.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable} scroll-smooth`}>
      <body className="antialiased min-h-screen relative" style={{ backgroundColor: 'var(--background)' }}>
        {children}
      </body>
    </html>
  );
}
