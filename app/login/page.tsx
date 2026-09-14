import { LoginHero } from "@/app/components/auth/login-hero";
import { LoginForm } from "@/app/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ activada?: string }>;
}) {
  const params = await searchParams;
  const notice =
    params.activada === "1"
      ? "activated"
      : params.activada === "error"
        ? "error"
        : undefined;

  return (
    <div className="grid min-h-screen bg-crema-suave lg:grid-cols-[1.05fr_1fr]">
      <LoginHero />
      <div className="flex items-center justify-center px-5 py-10">
        <LoginForm notice={notice} />
      </div>
    </div>
  );
}
