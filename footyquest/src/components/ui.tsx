"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions";

export function SubmitButton({
  children,
  className = "btn-primary w-full",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "Working…" : children}
    </button>
  );
}

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <p className="mb-3 rounded-xl border border-red-800 bg-red-950/60 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mb-3 rounded-xl border border-emerald-800 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-300">
          {state.success}
        </p>
      )}
      {children}
    </form>
  );
}
