"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email o contraseña incorrectos.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full max-w-[392px]">
      <h2 className="m-0 mb-1.5 font-display text-[30px] font-semibold text-tinta">
        Iniciar sesión
      </h2>
      <p className="m-0 mb-7 text-[15px] text-gris-oscuro">
        Ingresá para ver el día de hoy.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-2 text-xs font-bold tracking-[.7px] text-gris-oscuro">
          EMAIL
        </div>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="tu@email.com"
          required
          autoComplete="email"
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 text-[15px] text-tinta placeholder:text-[#b6a99b] focus:outline-none"
        />

        <div className="mb-2 text-xs font-bold tracking-[.7px] text-gris-oscuro">
          CONTRASEÑA
        </div>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          className="mb-2.5 w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 text-[15px] text-tinta placeholder:text-[#b6a99b] focus:outline-none"
        />

        <div className="mb-5 text-right">
          <a
            href="#"
            className="text-[13.5px] font-bold text-rojo-oscuro"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        {error && (
          <p className="m-0 mb-4 text-center text-[13.5px] font-bold text-rojo-oscuro">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:opacity-60"
        >
          {loading ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>

      <p className="m-0 mt-6 text-center text-[14.5px] text-gris-oscuro">
        ¿Te invitó la guardería?{" "}
        <Link href="/activar-cuenta" className="font-extrabold text-rojo-oscuro">
          Activá tu cuenta
        </Link>
      </p>
    </div>
  );
}
