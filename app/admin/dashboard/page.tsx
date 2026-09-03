import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Settings, List } from "lucide-react";
import Link from "next/link";
import QuizBuilderClient from "./QuizBuilderClient";

export default async function AdminDashboard() {
  const cookieStore = await cookies();
  const isAdmin = cookieStore.get("admin_auth")?.value === "true";

  if (!isAdmin) {
    redirect("/admin");
  }

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <div className="w-full max-w-4xl">
        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Settings size={32} className="text-primary" />
            <h2 className="mb-0">Quiz Builder</h2>
          </div>
          <Link href="/admin/manage" className="btn btn-secondary text-sm px-4 py-2">
            <List size={18} /> Manage Quizzes
          </Link>
        </div>

        <QuizBuilderClient />

        <div className="mt-8 flex justify-between items-center mb-8 border-t border-white/10 pt-4">
          <Link href="/" className="text-sm text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
