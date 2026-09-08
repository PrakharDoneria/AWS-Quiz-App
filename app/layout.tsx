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
      <body>
        <nav className="w-full bg-[#0d1117] border-b-4 border-[#324054] px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <a href="/" className="flex items-center gap-2 text-white font-black text-xl uppercase tracking-wider hover:text-primary transition-colors">
            <img src="/icons/App_Icon.svg" alt="Icon" className="w-8 h-8" />
            AWS Quiz
          </a>
          <div className="flex items-center gap-4">
            <a href="/team-info" className="text-gray-300 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors">Team Info</a>
            <a href="/certificate" className="text-gray-300 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors">Certificate</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
