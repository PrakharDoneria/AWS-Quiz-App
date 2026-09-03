import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLogin() {
  async function login(formData: FormData) {
    "use server";
    const password = formData.get("password");
    if (password === "aws-sbg") {
      (await cookies()).set("admin_auth", "true", { secure: true, httpOnly: true });
      redirect("/admin/dashboard");
    }
  }

  return (
    <main className="container flex flex-col items-center justify-center gap-4 mt-8">
      <div className="glass-panel text-center w-full max-w-md">
        <Lock size={48} className="mx-auto mb-4 text-primary" />
        <h1 className="mb-6">Admin Login</h1>
        <form action={login} className="flex flex-col gap-4">
          <input 
            name="password" 
            type="password" 
            placeholder="Enter Admin Password" 
            className="input" 
            required 
          />
          <button type="submit" className="btn">Login</button>
        </form>
      </div>
    </main>
  );
}
