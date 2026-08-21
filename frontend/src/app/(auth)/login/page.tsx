import type { Metadata } from "next";

import { loginAction } from "@/features/auth/actions";
import { AuthForm } from "@/features/auth/components/auth-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="auth-card">
      <p className="eyebrow">Bienvenido de vuelta</p>
      <h2>Ingresá a tu espacio</h2>
      <p className="muted">Usá las credenciales con las que te registraste.</p>
      <AuthForm mode="login" action={loginAction} />
    </div>
  );
}
