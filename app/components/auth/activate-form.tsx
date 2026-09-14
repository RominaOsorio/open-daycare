"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SunIcon } from "@/app/components/icons";
import { useUser } from "@/app/components/user/user-provider";
import { INVITE_CODE_PATTERN } from "@/app/lib/invitations";
import { createClient } from "@/utils/supabase/client";

type ActivateFormProps =
  | { mode: "code" }
  | {
      mode: "form";
      code: string;
      email: string;
      fullName: string;
      childName: string;
      roomName: string;
    }
  | { mode: "error"; code: string; message: string };

const inputClass =
  "mb-[18px] w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 text-[15px] text-tinta focus:outline-none";

const labelClass = "mb-2 text-xs font-bold tracking-[.7px] text-gris-oscuro";

const buttonClass =
  "block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)] disabled:opacity-60";

const RPC_ERRORS: Record<string, string> = {
  not_authenticated: "Iniciá sesión para aceptar la invitación.",
  invitation_not_found: "El código no es válido.",
  invitation_not_pending: "Esta invitación ya fue usada.",
  invitation_expired:
    "El código venció. Pedile a la guardería que te reenvíe la invitación.",
  email_mismatch:
    "Este código es para otro email. Cerrá sesión e ingresá con el email invitado.",
};

function Header() {
  return (
    <>
      <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
        <SunIcon className="h-[30px] w-[30px]" />
      </div>
      <h1 className="m-0 mb-2 font-display text-[28px] font-semibold leading-[1.15] text-tinta lg:text-[32px]">
        Bienvenida a OpenDayCare
      </h1>
    </>
  );
}

function LoginFooter() {
  return (
    <p className="m-0 mt-[22px] text-center text-[14.5px] text-gris-oscuro">
      ¿Ya tenés cuenta?{" "}
      <Link href="/login" className="font-extrabold text-rojo-oscuro">
        Iniciar sesión
      </Link>
    </p>
  );
}

function CodeStep() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!INVITE_CODE_PATTERN.test(normalized)) {
      setError("El código tiene 5 caracteres. Por ejemplo: 7K4P9.");
      return;
    }
    router.push(`/activar-cuenta?code=${encodeURIComponent(normalized)}`);
  }

  return (
    <div className="w-full max-w-[440px]">
      <Header />
      <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-gris-oscuro">
        Ingresá el código que te envió la guardería para activar tu cuenta.
      </p>

      <form onSubmit={handleSubmit}>
        <div className={labelClass}>CÓDIGO DE INVITACIÓN</div>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="7K4P9"
          maxLength={5}
          autoFocus
          className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 font-display text-[18px] font-bold uppercase tracking-[3px] text-tinta focus:outline-none"
        />

        {error && (
          <p className="m-0 mb-4 text-center text-[13.5px] font-bold text-rojo-oscuro">
            {error}
          </p>
        )}

        <button type="submit" className={buttonClass}>
          Continuar
        </button>
      </form>

      <LoginFooter />
    </div>
  );
}

function ErrorStep({ message }: { message: string }) {
  return (
    <div className="w-full max-w-[440px]">
      <Header />
      <div className="mb-[22px] rounded-2xl border-[1.5px] border-[#f2c3b4] bg-[#FDF0EB] px-4 py-3.5">
        <p className="m-0 text-[14.5px] leading-[1.5] text-[#8C3B24]">
          {message}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link href="/activar-cuenta" className={buttonClass}>
          Probar con otro código
        </Link>
        <Link
          href="/login"
          className="block w-full rounded-[15px] border-[1.5px] border-borde-input bg-white py-[14px] text-center text-base font-extrabold text-gris-oscuro"
        >
          Iniciar sesión
        </Link>
      </div>
    </div>
  );
}

function FormStep({
  code,
  email,
  fullName,
  childName,
  roomName,
}: Extract<ActivateFormProps, { mode: "form" }>) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [password, setPassword] = useState("");
  const [photoConsent, setPhotoConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invitedEmail = email.trim().toLowerCase();
  const currentEmail = user?.email?.toLowerCase() ?? null;
  const sibling = Boolean(user) && currentEmail === invitedEmail;
  const wrongSession = Boolean(user) && !sibling;
  const canSubmit =
    !loading &&
    !userLoading &&
    !wrongSession &&
    (sibling || password.length >= 6);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user: current },
    } = await supabase.auth.getUser();

    if (!current) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) {
        if (signUpError.code === "user_already_exists") {
          setError(
            `Ya existe una cuenta con este email. Iniciá sesión y abrí de nuevo el enlace de la invitación para vincular a ${childName}.`,
          );
        } else {
          setError("No pudimos crear la cuenta. Intentá de nuevo.");
        }
        setLoading(false);
        return;
      }

      if (data.user && data.user.identities?.length === 0) {
        setError(
          `Ya existe una cuenta con este email. Iniciá sesión y abrí de nuevo el enlace de la invitación para vincular a ${childName}.`,
        );
        setLoading(false);
        return;
      }
    }

    const { data: result, error: rpcError } = await supabase.rpc(
      "accept_invitation",
      { p_code: code, p_photo_consent: photoConsent },
    );

    if (rpcError || !result?.ok) {
      if (!current) await supabase.auth.signOut();
      const errorCode = (result?.error as string | undefined) ?? "";
      setError(
        RPC_ERRORS[errorCode] ??
          "No pudimos vincular la invitación. Contactá a la guardería.",
      );
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/login?activada=1");
    router.refresh();
  }

  async function handleSignOut() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="w-full max-w-[440px]">
      <Header />
      <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-gris-oscuro">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar
        la cuenta.
      </p>

      <div className="mb-[22px] flex items-center gap-3.5 rounded-2xl border-[1.5px] border-borde-input bg-white px-4 py-3.5">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[19px] font-semibold text-[#1F7A93]">
          {childName.trim().charAt(0).toUpperCase()}
        </div>
        <div>
          <div className="text-[13px] text-gris-oscuro">
            Te invitaron a seguir a
          </div>
          <div className="font-display text-[17px] font-semibold text-tinta">
            {roomName ? `${childName} · Sala ${roomName}` : childName}
          </div>
        </div>
      </div>

      {wrongSession && (
        <div className="mb-6 rounded-2xl border-[1.5px] border-[#f2c3b4] bg-[#FDF0EB] px-4 py-3.5">
          <p className="m-0 text-[14.5px] leading-[1.5] text-[#8C3B24]">
            Estás conectado como {user?.email}. Esta invitación es para {email}.
            Cerrá sesión para activar la cuenta.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="mt-4 block w-full rounded-[15px] border-[1.5px] border-borde-input bg-white py-[14px] text-center text-base font-extrabold text-gris-oscuro disabled:opacity-60"
          >
            {loading ? "Cerrando sesión…" : "Cerrar sesión"}
          </button>
        </div>
      )}

      {!wrongSession && (
        <form onSubmit={handleSubmit}>
          <div className={labelClass}>CÓDIGO DE INVITACIÓN</div>
          <input
            value={code}
            readOnly
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 font-display text-[18px] font-bold tracking-[3px] text-tinta focus:outline-none"
          />

          <div className={labelClass}>EMAIL</div>
          <input
            type="email"
            value={email}
            readOnly
            className={inputClass}
          />

          {!sibling && (
            <>
              <div className={labelClass}>CREAR CONTRASEÑA</div>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 text-[15px] text-tinta placeholder:text-[#b6a99b] focus:outline-none"
              />
            </>
          )}

          <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-marfil px-4 py-3.5">
            <input
              type="checkbox"
              checked={photoConsent}
              onChange={(event) => setPhotoConsent(event.target.checked)}
              className="sr-only"
            />
            <span
              className={`mt-px flex h-6 w-6 flex-none items-center justify-center rounded-lg ${
                photoConsent ? "bg-verde-check" : "border-2 border-borde-input bg-white"
              }`}
            >
              {photoConsent && (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <span className="text-sm leading-[1.45] text-marron-invitacion">
              Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
              de la app.
            </span>
          </label>

          {error && (
            <p className="m-0 mb-4 text-center text-[13.5px] font-bold leading-snug text-rojo-oscuro">
              {error}
            </p>
          )}

          <button type="submit" disabled={!canSubmit} className={buttonClass}>
            {loading
              ? "Activando…"
              : sibling
                ? `Vincular a ${childName}`
                : "Activar mi cuenta"}
          </button>
        </form>
      )}

      <LoginFooter />
    </div>
  );
}

export function ActivateForm(props: ActivateFormProps) {
  if (props.mode === "code") return <CodeStep />;
  if (props.mode === "error") return <ErrorStep message={props.message} />;
  return <FormStep {...props} />;
}
