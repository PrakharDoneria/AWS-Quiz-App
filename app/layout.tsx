import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AWS Quiz App",
  description: "A production-ready quiz web application using Next.js and Amazon DynamoDB.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
