// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Sayothix Caller",
  description: "AI Cold Calling Agent · Isabell",
  icons: {
    icon: [
      { url: "/sayothix-logo.webp", type: "image/webp" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/sayothix-logo.webp" type="image/webp" />
      </head>
      <body>{children}</body>
    </html>
  );
}
