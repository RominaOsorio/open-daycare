import { LoginHero } from "@/app/components/auth/login-hero";
import { LoginForm } from "@/app/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen bg-crema-suave lg:grid-cols-[1.05fr_1fr]">
      <LoginHero />
      <div className="flex items-center justify-center px-5 py-10">
        <LoginForm />
      </div>
    </div>
  );
}
