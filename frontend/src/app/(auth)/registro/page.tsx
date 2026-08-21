import type { Metadata } from "next";

import { registerAction } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return (
    <div className="auth-card">
      <p className="eyebrow">Nueva cuenta</p>
      <h2>Empezá a operar</h2>
      <p className="muted">Tu cuenta queda vinculada a la ficha de cliente.</p>
      <AuthForm mode="register" action={registerAction} />
    </div>
  );
}
