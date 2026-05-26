import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "LN StudyHall | Premium Study Hall Booking",
  description: "Book premium study seats, private cabins, silent rooms, memberships, and 24/7 study spaces at LN StudyHall.",
  keywords: ["study hall", "seat booking", "library", "LN StudyHall", "private cabin", "exam preparation"],
  openGraph: {
    title: "LN StudyHall",
    description: "Premium animated study hall booking and information platform.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
