// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Sayothix Caller",
  description: "AI Cold Calling Agent for Sayothix",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
