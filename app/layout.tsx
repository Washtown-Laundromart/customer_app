import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreshFold",
  description: "Laundry pickup, cleaning, and delivery tracking"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
