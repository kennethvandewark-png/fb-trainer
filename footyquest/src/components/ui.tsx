"use client";

import { createContext, useContext, useActionState, startTransition } from "react";
import type { ActionState } from "@/lib/actions";

const PendingContext = createContext(false);

export function SubmitButton({
  children,
  className = "btn-primary w-full",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pending = useContext(PendingContext);
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
  const [state, formAction, pending] = useActionState(action, null);

  // Submit manually inside a transition so React does NOT auto-reset the form.
  // This keeps user input intact when the server action returns an error.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  };

  return (
    <form action={formAction} onSubmit={onSubmit} className={className}>
      <PendingContext.Provider value={pending}>
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
      </PendingContext.Provider>
    </form>
  );
}
