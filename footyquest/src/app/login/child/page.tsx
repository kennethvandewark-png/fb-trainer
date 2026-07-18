import Link from "next/link";
import { loginChild } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/ui";
import { Logo } from "@/components/nav";

export default function ChildLoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <div className="card">
        <h1 className="mb-1 text-2xl font-black">Player login</h1>
        <p className="mb-6 text-sm text-zinc-400">Enter the username and 4-digit PIN your parent set up.</p>
        <ActionForm action={loginChild}>
          <div className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input name="username" className="input" placeholder="superstriker10" required autoCapitalize="none" />
            </div>
            <div>
              <label className="label">PIN</label>
              <input
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                className="input text-center text-2xl tracking-[0.5em]"
                placeholder="••••"
                required
              />
            </div>
            <SubmitButton>Let&apos;s train ⚽</SubmitButton>
          </div>
        </ActionForm>
        <p className="mt-5 text-center text-sm text-zinc-400">
          Parent or coach? <Link href="/login" className="text-emerald-400 hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
}
