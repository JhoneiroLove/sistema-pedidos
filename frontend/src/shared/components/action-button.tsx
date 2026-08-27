"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { FormState } from "@/shared/lib/form-state";

interface ActionButtonProps {
  action: () => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
  redirectTo?: string;
}

export function ActionButton({
  action,
  children,
  className = "button primary",
  pendingLabel = "Procesando…",
  redirectTo,
}: ActionButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>();

  function handleClick() {
    setMessage(undefined);
    startTransition(async () => {
      const result = await action();
      if (result.message) {
        setMessage(result.message);
        return;
      }
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div>
      <button className={className} disabled={isPending} onClick={handleClick} type="button">
        {isPending ? pendingLabel : children}
      </button>
      {message && <p className="form-message error">{message}</p>}
    </div>
  );
}
