import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { ActivateForm } from "@/app/components/auth/activate-form";
import { createClient } from "@/utils/supabase/server";

interface InvitationInfo {
  full_name: string;
  email: string;
  relationship: string;
  child_name: string;
  room_name: string;
  status: string;
  expires_at: string;
}

function isInvitationExpired(expiresAt: string) {
  return new Date(expiresAt).getTime() <= Date.now();
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-crema-suave px-5 py-10">
      {children}
    </div>
  );
}

export default async function ActivateAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = (params.code ?? "").trim().toUpperCase();

  if (!code) {
    return (
      <Shell>
        <ActivateForm mode="code" />
      </Shell>
    );
  }

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .rpc("get_invitation_info", { p_code: code })
    .maybeSingle();

  if (error) {
    console.error("get_invitation_info failed", error);
    return (
      <Shell>
        <ActivateForm
          mode="error"
          code={code}
          message="No pudimos verificar el código. Intentá de nuevo en unos minutos."
        />
      </Shell>
    );
  }

  const info = data as InvitationInfo | null;
  const expired = info ? isInvitationExpired(info.expires_at) : false;

  if (!info) {
    return (
      <Shell>
        <ActivateForm
          mode="error"
          code={code}
          message="El código no es válido. Revisá el correo de invitación o pedile a la guardería que te reenvíe uno nuevo."
        />
      </Shell>
    );
  }

  if (info.status !== "pending") {
    return (
      <Shell>
        <ActivateForm
          mode="error"
          code={code}
          message="Esta invitación ya fue usada. Si necesitás vincular a otro niño, pedile a la guardería una nueva invitación."
        />
      </Shell>
    );
  }

  if (expired) {
    return (
      <Shell>
        <ActivateForm
          mode="error"
          code={code}
          message="El código venció. Pedile a la guardería que te reenvíe la invitación."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <ActivateForm
        mode="form"
        code={code}
        email={info.email}
        fullName={info.full_name}
        childName={info.child_name}
        roomName={info.room_name}
      />
    </Shell>
  );
}
