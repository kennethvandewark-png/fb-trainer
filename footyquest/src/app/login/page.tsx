import Link from "next/link";
import { loginUser } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/ui";
import { Logo } from "@/components/nav";

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <div className="card">
        <h1 className="mb-1 text-2xl font-black">Parent / Coach login</h1>
        <p className="mb-6 text-sm text-zinc-400">Welcome back.</p>
        <ActionForm action={loginUser}>
          <div className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input" required />
            </div>
            <SubmitButton>Log in</SubmitButton>
          </div>
        </ActionForm>
        <div className="mt-5 space-y-1 text-center text-sm text-zinc-400">
          <p>
            Player? <Link href="/login/child" className="text-emerald-400 hover:underline">Log in with username &amp; PIN</Link>
          </p>
          <p>
            New here? <Link href="/register" className="text-emerald-400 hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
