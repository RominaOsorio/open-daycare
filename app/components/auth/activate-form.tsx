import Link from "next/link";
import { SunIcon } from "@/app/components/icons";

export function ActivateForm() {
  return (
    <div className="w-full max-w-[440px]">
      <div className="mb-[22px] flex h-[58px] w-[58px] items-center justify-center rounded-[18px] bg-gradient-to-br from-[#F8C3A8] to-[#F2937A] shadow-[0_12px_26px_-10px_rgba(238,129,100,.65)]">
        <SunIcon className="h-[30px] w-[30px]" />
      </div>
      <h1 className="m-0 mb-2 font-display text-[28px] font-semibold leading-[1.15] text-tinta lg:text-[32px]">
        Bienvenida a OpenDayCare
      </h1>
      <p className="m-0 mb-[26px] text-[15.5px] leading-[1.55] text-gris-oscuro">
        Te invitaron a seguir el día de tu hijo. Creá tu contraseña para activar
        la cuenta.
      </p>

      <div className="mb-[22px] flex items-center gap-3.5 rounded-2xl border-[1.5px] border-borde-input bg-white px-4 py-3.5">
        <div className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-[#A9D9E8] font-display text-[19px] font-semibold text-[#1F7A93]">
          M
        </div>
        <div>
          <div className="text-[13px] text-gris-oscuro">
            Te invitaron a seguir a
          </div>
          <div className="font-display text-[17px] font-semibold text-tinta">
            Mateo · Sala Soles
          </div>
        </div>
      </div>

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-gris-oscuro">
        CÓDIGO DE INVITACIÓN
      </div>
      <input
        defaultValue="7K4P9"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 font-display text-[18px] font-bold tracking-[3px] text-tinta focus:outline-none"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-gris-oscuro">
        EMAIL
      </div>
      <input
        type="email"
        defaultValue="lucia.fernandez@gmail.com"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-borde-input bg-white px-4 py-3.5 text-[15px] text-tinta focus:outline-none"
      />

      <div className="mb-2 text-xs font-bold tracking-[.7px] text-gris-oscuro">
        CREAR CONTRASEÑA
      </div>
      <input
        type="password"
        defaultValue="contraseña"
        className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-[#f2a78e] bg-white px-4 py-3.5 text-[15px] text-tinta focus:outline-none"
      />

      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-marfil px-4 py-3.5">
        <input type="checkbox" defaultChecked className="sr-only" />
        <span className="mt-px flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-verde-check">
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
        </span>
        <span className="text-sm leading-[1.45] text-marron-invitacion">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro
          de la app.
        </span>
      </label>

      <a
        href="#"
        className="block w-full rounded-[15px] bg-gradient-to-b from-[#F4977E] to-[#EE8164] py-[15px] text-center text-base font-extrabold text-white shadow-[0_10px_22px_-8px_rgba(238,129,100,.7)]"
      >
        Activar mi cuenta
      </a>

      <p className="m-0 mt-[22px] text-center text-[14.5px] text-gris-oscuro">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-extrabold text-rojo-oscuro">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
