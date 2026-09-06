import { SunIcon } from "@/app/components/icons";
import { ROOM } from "@/app/lib/data";

export function LoginHero() {
  return (
    <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#F6A98E] via-[#F2937A] to-[#EC7E62] px-6 py-10 text-white lg:px-[60px] lg:py-14">
      <div className="pointer-events-none absolute -right-[120px] -top-[140px] h-[300px] w-[300px] rounded-full bg-white/12 lg:h-[420px] lg:w-[420px]" />
      <div className="pointer-events-none absolute -bottom-[110px] -left-[80px] h-[220px] w-[220px] rounded-full bg-white/10 lg:h-[300px] lg:w-[300px]" />

      <div className="relative flex items-center gap-3">
        <div className="flex h-[46px] w-[46px] flex-none items-center justify-center rounded-[14px] bg-white/22">
          <SunIcon className="h-[26px] w-[26px]" />
        </div>
        <span className="font-display text-[21px] font-semibold tracking-[.5px]">
          OpenDayCare
        </span>
      </div>

      <div className="relative mt-8 lg:mt-0">
        <h1 className="m-0 mb-[18px] font-display text-[30px] font-semibold leading-[1.15] lg:text-[42px] lg:leading-[1.12]">
          El día de cada niño,
          <br />
          compartido con su familia.
        </h1>
        <p className="m-0 max-w-[430px] text-[15px] leading-[1.6] text-white/90 lg:text-[17px]">
          Publicá momentos, gestioná las salas y mantené a las familias cerca,
          desde un solo lugar.
        </p>
      </div>

      <div className="relative mt-8 text-sm text-white/90 lg:mt-0">
        🌿 Guardería {ROOM.name}
      </div>
    </div>
  );
}
