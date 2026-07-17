import Link from "next/link";
import { registerUser } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/ui";
import { Logo } from "@/components/nav";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  const isCoach = role === "coach";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center">
        <Logo />
      </div>
      <div className="card">
        <h1 className="mb-1 text-2xl font-black">{isCoach ? "Coach sign-up" : "Create a family account"}</h1>
        <p className="mb-6 text-sm text-zinc-400">
          {isCoach
            ? "Link with your players using invite codes from their parents."
            : "Parents own the account and add player profiles for their children."}
        </p>
        <ActionForm action={registerUser}>
          <input type="hidden" name="role" value={isCoach ? "COACH" : "PARENT"} />
          <div className="space-y-4">
            <div>
              <label className="label">Your name</label>
              <input name="name" className="input" placeholder={isCoach ? "Coach Alex" : "Sam Parker"} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input" placeholder="At least 6 characters" required minLength={6} />
            </div>
            <SubmitButton>{isCoach ? "Create coach account" : "Create parent account"}</SubmitButton>
          </div>
        </ActionForm>
        <div className="mt-5 space-y-1 text-center text-sm text-zinc-400">
          <p>
            {isCoach ? (
              <Link href="/register" className="text-emerald-400 hover:underline">I&apos;m a parent instead</Link>
            ) : (
              <Link href="/register?role=coach" className="text-emerald-400 hover:underline">I&apos;m a coach instead</Link>
            )}
          </p>
          <p>
            Already have an account? <Link href="/login" className="text-emerald-400 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
