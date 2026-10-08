import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plant Load Radar",
  description:
    "Demo: who gets the plant's capacity when there isn't enough, decided by the ringgit at stake.",
};

// System font stack on purpose: no build-time font download, so the demo builds offline.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
