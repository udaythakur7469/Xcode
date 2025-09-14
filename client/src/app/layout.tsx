import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/themes/themeProvider";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "codex",
  description: "codex",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;1,400;1,500&display=swap');
          `}</style>
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
