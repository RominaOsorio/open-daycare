import { Resend } from "resend";

interface InvitationEmailInput {
  to: string;
  parentName: string;
  childName: string;
  code: string;
  link: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function invitationHtml({
  parentName,
  childName,
  code,
  link,
}: Omit<InvitationEmailInput, "to">) {
  const parent = escapeHtml(parentName);
  const child = escapeHtml(childName);
  return `<!DOCTYPE html>
<html lang="es">
  <body style="margin:0;padding:0;background:#FBF4EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF4EE;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#FFFFFF;border-radius:24px;border:1px solid #EFE3D4;">
            <tr>
              <td style="padding:28px 28px 0;">
                <div style="font-size:20px;font-weight:700;color:#3F362E;">OpenDayCare</div>
                <div style="font-size:13px;color:#8A7A6B;margin-top:2px;">Guardería Sala Soles</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 28px 0;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.5;color:#3F362E;">Hola ${parent},</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#6E6359;">
                  Te invitaron a seguir el día de <strong>${child}</strong> en OpenDayCare. Usá este código para activar tu cuenta:
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px;">
                <div style="border:1.5px dashed #E6D08A;background:#FBF1D6;border-radius:16px;padding:18px;text-align:center;">
                  <div style="font-size:12px;font-weight:700;letter-spacing:.7px;color:#A88526;">CÓDIGO DE INVITACIÓN</div>
                  <div style="font-size:34px;font-weight:700;letter-spacing:7px;color:#8A7234;margin-top:6px;">${code}</div>
                  <div style="font-size:13px;color:#A88526;margin-top:4px;">Vence en 7 días</div>
                </div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:22px 28px 0;">
                <a href="${link}" style="display:inline-block;background:#EE8164;color:#FFFFFF;font-size:16px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:14px;">Activar mi cuenta</a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 0;">
                <p style="margin:0;font-size:12.5px;line-height:1.5;color:#8A7A6B;word-break:break-all;">
                  Si el botón no funciona, copiá y pegá este link en tu navegador:<br />
                  <a href="${link}" style="color:#C25B41;">${link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 28px 28px;">
                <p style="margin:0;font-size:12px;line-height:1.5;color:#A79A8C;border-top:1px solid #EFE3D4;padding-top:16px;">
                  Si no esperabas esta invitación, podés ignorar este correo.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendInvitationEmail(
  input: InvitationEmailInput,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Falta RESEND_API_KEY" };

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "OpenDayCare <onboarding@resend.dev>",
    to: [input.to],
    subject: `Invitación para seguir a ${input.childName} en OpenDayCare`,
    html: invitationHtml(input),
  });

  return error ? { ok: false, error: error.message } : { ok: true };
}
